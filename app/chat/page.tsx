"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useChat, UseChatHelpers } from "ai/react";
import _ from "lodash";
import { useRouter } from "next/navigation";
import {
   Box,
   VStack,
   Text,
   Flex,
   Icon,
   Divider,
   Badge,
   Spacer,
   Input,
   HStack,
   Button,
   Heading,
   Container,
   InputGroup,
   AiOutlineSend,
   MdArrowBackIosNew,
   InputRightElement,
   useColorModeValue,
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
   const bgGradient = useColorModeValue(
      "linear(to-b, gray.50, gray.100)",
      "linear(to-b, gray.900, gray.800)"
   );
   const headerBg = useColorModeValue(
      "linear(to-r, red.600, orange.500)",
      "linear(to-r, red.800, orange.700)"
   );
   const userBubbleBg = useColorModeValue("red.600", "red.500");
   const aiBubbleBg = useColorModeValue("white", "gray.800");
   const aiBubbleBorder = useColorModeValue("red.300", "red.600");
   const inputBg = useColorModeValue("white", "gray.800");
   const inputBorder = useColorModeValue("gray.300", "gray.600");

   return (
      <Box minH="100vh" bgGradient={bgGradient}>
         {/* Header */}
         <Flex
            pos="sticky"
            top={0}
            w="100%"
            bgGradient={headerBg}
            color="white"
            shadow="lg"
            zIndex={10}
            backdropFilter="blur(10px)"
         >
            <HStack p={4} spacing={3} flex={1}>
               <Button
                  onClick={() => router.push("/")}
                  variant="solid"
                  bg="whiteAlpha.200"
                  color="white"
                  leftIcon={<Icon as={MdArrowBackIosNew} />}
                  size="sm"
                  fontWeight={700}
                  borderRadius="full"
                  borderWidth={1}
                  borderColor="whiteAlpha.300"
                  _hover={{
                     bg: "whiteAlpha.300",
                     borderColor: "whiteAlpha.400",
                     transform: "translateX(-2px)",
                  }}
                  _active={{
                     bg: "whiteAlpha.400",
                  }}
                  transition="all 0.2s"
               >
                  Home
               </Button>
               <Spacer />
               <Badge
                  bg="yellow.400"
                  color="gray.800"
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight={700}
                  textTransform="none"
                  shadow="sm"
               >
                  AI Numerology
               </Badge>
            </HStack>
         </Flex>

         {/* Chat Container */}
         <Container
            onSubmit={(e) => {
               handleSubmit(e);
               if (inputRef.current) {
                  inputRef.current.value = "";
                  inputRef.current?.focus();
               }
            }}
            maxW="container.lg"
            as="form"
            py={6}
            px={4}
         >
            <VStack spacing={4} align="stretch">
               {/* Welcome Message */}
               {data.length === 0 && (
                  <VStack spacing={6} align="stretch">
                     <Box
                        textAlign="center"
                        py={12}
                        px={4}
                        borderRadius="xl"
                        bg={useColorModeValue("whiteAlpha.800", "gray.800")}
                        backdropFilter="blur(10px)"
                        shadow="md"
                        borderWidth={1}
                        borderColor={useColorModeValue("red.200", "red.700")}
                     >
                        <Heading
                           size="lg"
                           color={useColorModeValue("red.500", "red.400")}
                           mb={3}
                           fontFamily="fantasy"
                        >
                           🔮 Numerology AI Assistant
                        </Heading>
                        <Text
                           color={useColorModeValue("gray.600", "gray.300")}
                           fontSize="sm"
                        >
                           Nhập tên và ngày sinh để bắt đầu tra cứu thần số học
                        </Text>
                        <Text
                           color={useColorModeValue("gray.500", "gray.400")}
                           fontSize="xs"
                           mt={2}
                           fontStyle="italic"
                        >
                           Ví dụ: "Dương Văn Nghĩa sinh 11 - 06 - 1976"
                        </Text>
                     </Box>

                     {/* Development Notice */}
                     <Box
                        textAlign="center"
                        py={6}
                        px={4}
                        borderRadius="xl"
                        bg={useColorModeValue("yellow.50", "yellow.900")}
                        borderWidth={2}
                        borderColor={useColorModeValue(
                           "yellow.300",
                           "yellow.700"
                        )}
                        shadow="sm"
                     >
                        <Text
                           fontSize="md"
                           fontWeight={600}
                           color={useColorModeValue("yellow.800", "yellow.200")}
                           mb={2}
                        >
                           ⚠️ Thông Báo / Notice
                        </Text>
                        <VStack spacing={2} align="stretch">
                           <Text
                              fontSize="sm"
                              color={useColorModeValue("gray.700", "gray.200")}
                              fontWeight={500}
                           >
                              <strong>Tiếng Việt:</strong> Hệ thống AI đang phát
                              triển, sẽ đến sớm trong tương lai
                           </Text>
                           <Text
                              fontSize="sm"
                              color={useColorModeValue("gray.700", "gray.200")}
                              fontWeight={500}
                           >
                              <strong>English:</strong> AI system is under
                              development, coming soon in the future
                           </Text>
                        </VStack>
                     </Box>
                  </VStack>
               )}

               {/* Messages */}
               <Box
                  h={size.h ? `${size.h - 280}px` : "calc(100vh - 280px)"}
                  w="100%"
                  overflowY="auto"
                  pr={2}
                  css={{
                     "&::-webkit-scrollbar": {
                        width: "6px",
                     },
                     "&::-webkit-scrollbar-track": {
                        background: "transparent",
                     },
                     "&::-webkit-scrollbar-thumb": {
                        background: useColorModeValue("#E53E3E", "#FC8181"),
                        borderRadius: "10px",
                     },
                     "&::-webkit-scrollbar-thumb:hover": {
                        background: useColorModeValue("#C53030", "#F56565"),
                     },
                  }}
               >
                  <VStack spacing={4} align="stretch" py={2}>
                     {data.map((message, index) => (
                        <Box
                           ref={
                              index === data.length - 1 ? lastMessageRef : null
                           }
                           key={index}
                           display="flex"
                           justifyContent={
                              message.role === "user"
                                 ? "flex-end"
                                 : "flex-start"
                           }
                           sx={{
                              animation: "fadeIn 0.3s ease-in",
                           }}
                        >
                           {message.role === "user" &&
                           message.content.trim() ? (
                              <Box
                                 maxW={{ base: "85%", md: "70%" }}
                                 p={3}
                                 bg={userBubbleBg}
                                 color="white"
                                 borderRadius="xl"
                                 borderTopRightRadius="sm"
                                 shadow="lg"
                                 wordBreak="break-word"
                                 borderWidth={1}
                                 borderColor={useColorModeValue(
                                    "red.700",
                                    "red.800"
                                 )}
                              >
                                 <Text fontSize="sm" fontWeight={500}>
                                    {message.content}
                                 </Text>
                              </Box>
                           ) : (
                              <Box
                                 maxW={{ base: "90%", md: "75%" }}
                                 p={4}
                                 bg={aiBubbleBg}
                                 borderRadius="xl"
                                 borderTopLeftRadius="sm"
                                 borderWidth={1}
                                 borderColor={aiBubbleBorder}
                                 shadow="md"
                                 wordBreak="break-word"
                              >
                                 <Box
                                    as="span"
                                    whiteSpace="pre-wrap"
                                    dangerouslySetInnerHTML={{
                                       __html: formatResponse(message.content),
                                    }}
                                    fontSize="sm"
                                    lineHeight="tall"
                                    color={useColorModeValue(
                                       "gray.700",
                                       "gray.200"
                                    )}
                                    css={{
                                       "& strong": {
                                          color: useColorModeValue(
                                             "red.500",
                                             "red.400"
                                          ),
                                          fontWeight: 600,
                                       },
                                       "& div": {
                                          marginBottom: "8px",
                                       },
                                    }}
                                 />
                              </Box>
                           )}
                        </Box>
                     ))}
                     {isLoading && (
                        <Box
                           display="flex"
                           justifyContent="flex-start"
                           maxW={{ base: "90%", md: "75%" }}
                        >
                           <Box
                              p={4}
                              bg={aiBubbleBg}
                              borderRadius="2xl"
                              borderWidth={2}
                              borderColor={aiBubbleBorder}
                              shadow="sm"
                           >
                              <HStack spacing={2}>
                                 <Box
                                    w={2}
                                    h={2}
                                    bg="red.400"
                                    borderRadius="full"
                                    sx={{
                                       animation:
                                          "pulse 1.4s ease-in-out infinite",
                                    }}
                                 />
                                 <Box
                                    w={2}
                                    h={2}
                                    bg="red.400"
                                    borderRadius="full"
                                    sx={{
                                       animation:
                                          "pulse 1.4s ease-in-out 0.2s infinite",
                                    }}
                                 />
                                 <Box
                                    w={2}
                                    h={2}
                                    bg="red.400"
                                    borderRadius="full"
                                    sx={{
                                       animation:
                                          "pulse 1.4s ease-in-out 0.4s infinite",
                                    }}
                                 />
                              </HStack>
                           </Box>
                        </Box>
                     )}
                  </VStack>
               </Box>

               <Divider borderColor={useColorModeValue("red.200", "red.700")} />

               {/* Input Area */}
               <Box
                  bg={useColorModeValue("white", "gray.800")}
                  p={4}
                  borderRadius="xl"
                  shadow="xl"
                  borderWidth={1}
                  borderColor={inputBorder}
               >
                  <VStack spacing={3}>
                     <InputGroup size="lg">
                        <Input
                           ref={inputRef}
                           autoFocus
                           pr="3.5rem"
                           placeholder="Nhập tên và ngày sinh (VD: Nguyễn Văn A sinh 01-01-2000)..."
                           borderRadius="full"
                           bg={inputBg}
                           borderWidth={1}
                           borderColor={inputBorder}
                           _focus={{
                              borderColor: "red.500",
                              boxShadow: "0 0 0 3px rgba(229, 62, 62, 0.1)",
                           }}
                           _hover={{
                              borderColor: "red.400",
                           }}
                           onChange={debouncedHandleInputChange}
                           fontSize="sm"
                           py={6}
                        />
                        <InputRightElement width="4.5rem" pr={2}>
                           <Button
                              size="md"
                              rounded="full"
                              bg={useColorModeValue("red.500", "red.600")}
                              color="white"
                              disabled={isDisabled}
                              type="submit"
                              minW="40px"
                              h="40px"
                              shadow="md"
                              _hover={{
                                 bg: useColorModeValue("red.600", "red.500"),
                                 transform: "scale(1.1)",
                                 shadow: "lg",
                              }}
                              _active={{
                                 transform: "scale(0.95)",
                              }}
                              _disabled={{
                                 opacity: 0.4,
                                 cursor: "not-allowed",
                                 bg: useColorModeValue("gray.300", "gray.600"),
                              }}
                              transition="all 0.2s"
                           >
                              <Icon as={AiOutlineSend} boxSize={5} />
                           </Button>
                        </InputRightElement>
                     </InputGroup>

                     <Text
                        textAlign="center"
                        fontSize="xs"
                        color={useColorModeValue("gray.500", "gray.400")}
                        fontStyle="italic"
                     >
                        💡 Tip: Nhập đầy đủ tên và ngày sinh để có kết quả chính
                        xác nhất
                     </Text>
                  </VStack>
               </Box>
            </VStack>
         </Container>
      </Box>
   );
}
