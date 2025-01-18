"use client";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { useChat } from "ai/react";
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

export default function Chat() {
   const [size, setSize] = useState({ w: 0, h: 0 });
   const [liveMessages, setLiveMessages] = useState<
      { role: string; content: string }[]
   >([]);
   const { handleInputChange, input, handleSubmit, isLoading, messages } =
      useChat({
         api: "/api/chat",
         onResponse: async (stream) => {
            const reader = await stream.body?.getReader();
            const decoder = new TextDecoder();
            let done = false;

            let currentMessage = "";
            while (!done) {
               const { value, done: streamDone } =
                  (await reader?.read()) as any;
               done = streamDone;
               const chunk = decoder.decode(value, { stream: !done });
               currentMessage += chunk;

               // Update the liveMessages with the latest chunk
               setLiveMessages((prevMessages) => [
                  ...prevMessages.slice(0, -1),
                  {
                     role: "assistant",
                     content: currentMessage,
                  },
               ]);
            }
         },
      });

   const lastMessageRef = useRef<HTMLDivElement>(null);
   const router = useRouter();

   useEffect(() => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
   }, []);

   useEffect(() => {
      // Add the user message to the liveMessages
      if (messages.length > 0) {
         setLiveMessages((prevMessages) => [
            ...prevMessages,
            messages[messages.length - 1],
            { role: "assistant", content: "" },
         ]);
      }
   }, [messages]);

   useEffect(() => {
      if (lastMessageRef.current) {
         lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
      }
   }, [liveMessages]);

   const isDisabled = useMemo(() => isLoading || !input, [isLoading, input]);

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
                  "-ms-overflow-style": "none",
                  "scrollbar-width": "none",
               }}
            >
               {liveMessages.map((message, index) => (
                  <Box
                     ref={
                        index === liveMessages.length - 1
                           ? lastMessageRef
                           : null
                     }
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
