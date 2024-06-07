"use client";
import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { useChat, UseChatHelpers } from "ai/react";
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
   const [isLoading, setIsLoading] = useState(false);
   const [data, setData] = useState<Data[]>([]);
   const { handleInputChange, input, setInput } = useChat() as UseChatHelpers;
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

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;
      setData((prevData) => [
         ...prevData,
         {
            role: "user",
            type: "question",
            content: input,
            content_type: "text",
         },
      ]);
      setInput("");
      setIsLoading(true);
      const response = await fetch(process.env.NEXT_PUBLIC_API ?? "", {
         method: "POST",
         headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN_AI}`,
            "Content-Type": "application/json",
            Accept: "*/*",
            Host: "api.coze.com",
            Connection: "keep-alive",
         },
         body: JSON.stringify({
            conversation_id: "123",
            bot_id: process.env.NEXT_PUBLIC_BOT_ID,
            user: "29032201862555",
            query: input,
            chat_history: data,
            stream: true,
         }),
      });
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         const streamItem = decoder.decode(value, { stream: true });
         result += streamItem;

         const messages = result.split("\n\n");
         if (messages[messages.length - 1] !== "") {
            // Remove the last message from the array and add it back to the result string
            result = messages?.pop() ?? "";
         } else {
            // The last message is empty, so we can clear the result string
            result = "";
         }
         for (const message of messages) {
            // Ignore empty messages
            if (!message) continue;
            // Parse the SSE message
            const dataLine = message.slice(5); // Remove the "data:" prefix
            const jsonData = JSON.parse(dataLine); // Parse the JSON data
            if (jsonData.event === "done") {
               setIsLoading(false);
               return;
            }
            // Extract the message data
            const { role, type, content, content_type, event } =
               jsonData.message;
            // Add the message to the data state
            if (type === "answer") {
               setData((prevData) => [
                  ...prevData,
                  { role, type, content, content_type },
               ]);
            }
         }
      }
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
            onSubmit={handleSubmit as (e: FormEvent) => void}
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
                        message.content
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
               Currently there is not enough operating budget for AI, sorry for
               the inconvenience
            </Box>
            <HStack>
               <InputGroup size="md">
                  <Input
                     autoFocus
                     pr="3rem"
                     size={{ md: "lg", xs: "md" }}
                     placeholder="Dương Văn Nghĩa sinh 11 - 06 - 1976 ..."
                     borderRadius={30}
                     value={input}
                     onChange={handleInputChange}
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
