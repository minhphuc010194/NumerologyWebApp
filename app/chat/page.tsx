"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useChat, UseChatHelpers } from "ai/react";
import _ from "lodash";
import { useRouter } from "next/navigation";
import {
   Box,
   Flex,
   Icon,
   Spacer,
   Input,
   HStack,
   Button,
   Heading,
   Container,
   InputGroup,
   CiMenuBurger,
   AiOutlineSend,
   MdArrowBackIosNew,
   InputRightElement,
} from "Components";

type Data = {
   role: string;
   type: string;
   content: string;
   content_type: string;
};
export default function Chat() {
   const [size, setSize] = useState({ w: 0, h: 0 });
   const [data, setData] = useState<Data[]>([]);
   const inputRef = useRef<HTMLInputElement>(null);
   const { input, handleSubmit, isLoading, setInput } = useChat({
      api: "/api/chat",
      onResponse: async (response: Response) => {
         if (!response.ok) {
            throw new Error("Failed to fetch response");
         }
         const stream = new TextDecoderStream();
         const streamReader = response.body?.getReader();
         if (!streamReader) {
            throw new Error("Response body is null");
         }
         const readableStream = new ReadableStream({
            async start(controller) {
               try {
                  while (true) {
                     const { done, value } = await streamReader.read();
                     if (done) break;
                     controller.enqueue(value);
                  }
               } finally {
                  streamReader.releaseLock();
                  controller.close();
               }
            },
         });

         const reader = readableStream.pipeThrough(stream).getReader();
         let buffer = "";

         try {
            while (true) {
               const { done, value } = await reader.read();
               if (done) break;

               buffer += value;
               const lines = buffer.split("\n");
               buffer = lines.pop() || "";

               for (const line of lines) {
                  if (line.startsWith("data: ")) {
                     const jsonStr = line.slice(6);
                     if (jsonStr === "[DONE]") break;

                     try {
                        const json = JSON.parse(jsonStr);
                        setData((prev) => [...prev, json]);
                     } catch (e) {
                        console.warn("Parse error:", e);
                     }
                  }
               }
            }
         } catch (error) {
            console.error("Stream error:", error);
            throw error;
         } finally {
            reader.releaseLock();
         }
      },
      onError: (error: any) => {
         console.error("Chat error:", error);
      },
   }) as UseChatHelpers;
   const lastMessageRef = useRef<HTMLDivElement>(null);
   const router = useRouter();

   useEffect(() => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
   }, []);
   useEffect(() => {
      if (lastMessageRef.current) {
         lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
      }
   }, [data]);
   const isDisabled = useMemo(() => isLoading || !input, [isLoading, input]);
   const debouncedHandleInputChange = _.debounce(function (e) {
      const value = e.target.value?.trim();
      setInput(value);
   }, 50);

   const formatResponse = (text: string) => {
      return (
         text
            // Format section headers (both with and without content after colon)
            .replace(
               /^(\d+)\. ([^:\n]+):?(.*)$/gm,
               "<div><strong>$1. $2:</strong>$3</div>"
            )
            // Format calculations
            .replace(
               /([:=]>?\s*)(\d+(?:\s*[+=\-]\s*\d+)*\s*=\s*\d+)/g,
               '$1<span style="color: #666">$2</span>'
            )
            // Format bold conclusions
            .replace(/\*\*([^*]+)\*\*\.?/g, "<strong>$1</strong>")
            // Preserve line breaks
            .replace(/\n{2,}/g, "<br /><br />")
      );
   };
   return (
      <Box>
         <Flex pos="fixed" top={0} w="100%" bg="white" color="black">
            <HStack p="4">
               <Icon
                  onClick={() => router.push("/")}
                  as={MdArrowBackIosNew}
                  boxSize={6}
                  cursor="pointer"
               />
               <Heading size="md" fontWeight={500}>
                  Trang chủ
               </Heading>
            </HStack>
            <Spacer />
            <Box p="4">
               <Icon as={CiMenuBurger} boxSize={6} cursor="pointer" />
            </Box>
         </Flex>
         <Container
            onSubmit={(e) => {
               handleSubmit(e);
               if (inputRef.current) {
                  inputRef.current.value = "";
                  inputRef.current?.focus();
               }
            }}
            maxW="container.md"
            as="form"
         >
            <Box
               h={size.h * 0.9}
               w="100%"
               pt={40}
               pb={10}
               overflowY="auto"
               css={{
                  "&::-webkit-scrollbar": {
                     display: "none",
                  },
                  "-ms-overflow-style": "none" /* IE and Edge */,
                  "scrollbar-width": "none" /* Firefox */,
               }}
            >
               {data.map((message, index) => (
                  <Box
                     ref={index === data.length - 1 ? lastMessageRef : null}
                     as={message.role === "user" ? "div" : "span"}
                     key={index}
                     whiteSpace="pre-line"
                     display={message.role === "user" ? "flex" : ""}
                     justifyContent={
                        message.role === "user" ? "right" : "normal"
                     }
                  >
                     {message.role === "user" && message.content.trim() ? (
                        <Box
                           p={3}
                           border="1px solid gray"
                           rounded={100}
                           inlineSize="max-content"
                           overflowWrap="break-word"
                        >
                           {message.content}
                        </Box>
                     ) : (
                        <Box
                           as="span"
                           whiteSpace={"pre-wrap"}
                           dangerouslySetInnerHTML={{
                              __html: formatResponse(message.content),
                           }}
                           borderRadius="md"
                           fontSize="sm"
                           fontFamily="system-ui"
                        />
                     )}
                  </Box>
               ))}
            </Box>
            <Box
               textAlign="center"
               fontStyle="italic"
               fontSize="small"
               color="red.300"
            >
               *Currently there is not enough operating budget for AI, sorry for
               the inconvenience
            </Box>
            <HStack>
               <InputGroup size="md">
                  <Input
                     ref={inputRef}
                     autoFocus
                     pr="3rem"
                     size={{ md: "lg", xs: "md" }}
                     placeholder="Dương Văn Nghĩa sinh 11 - 06 - 1976 ..."
                     borderRadius={30}
                     //  value={input}
                     onChange={debouncedHandleInputChange}
                  />

                  <InputRightElement
                     width={{ base: "40px", md: "70px" }}
                     mt={{ md: 2, sm: 1 }}
                  >
                     <Button
                        size={{ md: "lg", xs: "md" }}
                        rounded={30}
                        variant="unstyled"
                        disabled={isDisabled}
                        type="submit"
                     >
                        <Icon
                           color={isDisabled ? "gray" : "black"}
                           as={AiOutlineSend}
                           boxSize={8}
                        />
                     </Button>
                  </InputRightElement>
               </InputGroup>
            </HStack>
         </Container>
      </Box>
   );
}
