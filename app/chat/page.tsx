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
   const handleChat = async (e: React.FormEvent) => {
      e.preventDefault();
      // if (isLoading) return;
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
      // setIsLoading(true);
      const response = await fetch(
         process.env.NEXT_PUBLIC_API_CHAT +
            "?msToken=" +
            process.env.NEXT_PUBLIC_MSTOKEN +
            "&X-Bogus=" +
            process.env.NEXT_PUBLIC_XBOGUS +
            "&_signature=" +
            process.env.NEXT_PUBLIC_SIGNATURE,
         {
            method: "POST",
            headers: {
               "content-type": "application/json",
               accept: "*/*",
               "accept-language":
                  "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,fr-FR;q=0.6,fr;q=0.5",
               "cache-control": "no-cache",
               cookie: `store-idc=alisg; store-country-code=vn; store-country-code-src=uid; s_v_web_id=verify_lv0sdf6a_jkNfxNeu_f1dD_4nZE_8c2k_SubebblBovw7; i18next=en; passport_csrf_token=e5cb34b44e32b1f4eaa1a6fd5c132f70; passport_csrf_token_default=e5cb34b44e32b1f4eaa1a6fd5c132f70; d_ticket=9010485fea96ba7e18eef07d3fb1d40b7e3fd; odin_tt=4f4ffac04df09212a5dc5cb45d4069e56e971f0da4f53f1d23f3087e223563b67ed2f7e7436cc1710e52385b9234b8b5b1872f1dcbfe986a53a2e17a11d2ca5c; passport_auth_status=9a7a868ab94248df57b21bae9201587d%2C59c28120ffcb072ba49e7bf7ae790141; passport_auth_status_ss=9a7a868ab94248df57b21bae9201587d%2C59c28120ffcb072ba49e7bf7ae790141; sid_guard=dff4361dcfcbbe0244e560c3bfbcd5c5%7C1716391258%7C5184000%7CSun%2C+21-Jul-2024+15%3A20%3A58+GMT; uid_tt=ad4d4b31bdd840fb09f58381a6aed127c69475f98e42078bd26b44c2af4d3726; uid_tt_ss=ad4d4b31bdd840fb09f58381a6aed127c69475f98e42078bd26b44c2af4d3726; sid_tt=dff4361dcfcbbe0244e560c3bfbcd5c5; sessionid=dff4361dcfcbbe0244e560c3bfbcd5c5; sessionid_ss=dff4361dcfcbbe0244e560c3bfbcd5c5; sid_ucp_v1=1.0.0-KDA1ZmI4ODJiMWE0ZTVjOWQ2OWU0OTlmMWZlOWViZTFhZDZkM2YyYmQKIQiCiIv-0rqn_2UQ2pq4sgYY1J0fIAww77v6rwY4AkDxBxADGgNzZzEiIGRmZjQzNjFkY2ZjYmJlMDI0NGU1NjBjM2JmYmNkNWM1; ssid_ucp_v1=1.0.0-KDA1ZmI4ODJiMWE0ZTVjOWQ2OWU0OTlmMWZlOWViZTFhZDZkM2YyYmQKIQiCiIv-0rqn_2UQ2pq4sgYY1J0fIAww77v6rwY4AkDxBxADGgNzZzEiIGRmZjQzNjFkY2ZjYmJlMDI0NGU1NjBjM2JmYmNkNWM1; arcosite-lang=en; ttwid=1%7CbtVF2G5Jm6jiXhysRvJjWqboyEyxREgJ-dCoO2gI5D4%7C1717598320%7C749e221d3798cf9359ae977c5e6ced69425314f334ce9676efbce5738af3b3b2; msToken=9fSRLwAzlgTQ0PlAEK003C9jQsTSalFs776zNaeYFvPXTS3yR2pZnAhRGiQ5WPfxK7XDbmdfeppTEKDQg3LaKjJ9SJDGNG1B6g1u3V9-wS_5SerIq0GGr_l3pXDgDOo=; msToken=9fSRLwAzlgTQ0PlAEK003C9jQsTSalFs776zNaeYFvPXTS3yR2pZnAhRGiQ5WPfxK7XDbmdfeppTEKDQg3LaKjJ9SJDGNG1B6g1u3V9-wS_5SerIq0GGr_l3pXDgDOo=`,
               origin: "https://www.coze.com",
               pragma: "no-cache",
               priority: "u=1, i",
               referer:
                  "https://www.coze.com/store/bot/7374054689647837185?bid=6co3n2slo7008&panel=1",
               "sec-ch-ua": `"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"`,
               "sec-ch-ua-mobile": "?0",
               "sec-ch-ua-platform": "macOS",
               "sec-fetch-dest": "empty",
               "sec-fetch-mode": "cors",
               "sec-fetch-site": "same-origin",
               "sec-gpc": "1",
            },
            body: JSON.stringify({
               bot_id: "7373692273135222801",
               conversation_id: "7374055342407286801",
               local_message_id: "hGgQYvrXAvny5lPj8l4pR",
               content_type: "text",
               query: input,
               extra: {},
               scene: 2,
               bot_version: "1717574714742",
               draft_mode: false,
               stream: true,
               chat_history: data,
               mention_list: [],
               device_id: "423955195",
            }),
         }
      );
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
            onSubmit={handleChat as (e: FormEvent) => void}
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
