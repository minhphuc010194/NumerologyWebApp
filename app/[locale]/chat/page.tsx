"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  VStack,
  Text,
  Flex,
  Icon,
  Badge,
  Spacer,
  HStack,
  Button,
  Heading,
  Container,
  useColorModeValue,
  MdArrowBackIosNew,
  MdDeleteOutline,
  LanguageSwitcher,
  CustomCard,
  useColorMode,
  AiFillGithub,
  Feeacback,
  Donate,
  Tooltip,
} from "components";
import { ChatMessageBubble, ChatInput, StreamingIndicator } from "components";
import { useTranslations } from "next-intl";
import { useChatRAG } from "hooks/use-chat-rag";

export default function Chat() {
  const t = useTranslations("Chat");
  const tHeader = useTranslations("Header");
  const tFooter = useTranslations("Footer");
  const router = useRouter();

  const { messages, sendMessage, isStreaming, phase, error, clearMessages, retryLastMessage } =
    useChatRAG();

  const { toggleColorMode, colorMode } = useColorMode();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Color tokens — brand palette
  const bgGradient = useColorModeValue(
    "linear(to-b, orange.50, gray.50)",
    "linear(to-b, gray.900, gray.850)"
  );
  // Clean, transparent glassmorphism for header
  const headerBg = useColorModeValue(
    "whiteAlpha.800",
    "blackAlpha.600"
  );
  const headerBorder = useColorModeValue(
    "blackAlpha.100",
    "whiteAlpha.100"
  );
  const emptyBg = useColorModeValue("whiteAlpha.800", "gray.800");
  const emptyBorder = useColorModeValue("brand.200", "brand.700");
  const scrollbarThumbBg = useColorModeValue("#DD6B20", "#ED8936");
  const scrollbarThumbHoverBg = useColorModeValue("#C05621", "#F6AD55");

  const hasMessages = messages.length > 0;

  return (
    <Box h="100dvh" overflow="hidden" bgGradient={bgGradient} display="flex" flexDir="column">
      {/* Header */}
      <Flex
        pos="sticky"
        top={0}
        w="100%"
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={headerBorder}
        shadow="sm"
        zIndex={10}
        backdropFilter="blur(20px)"
      >
        <HStack p={2} spacing={3} flex={1}>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            color="gray.700"
            _dark={{ color: "whiteAlpha.900" }}
            leftIcon={<Icon as={MdArrowBackIosNew} />}
            size="sm"
            fontWeight={600}
            borderRadius="full"
            _hover={{
              bg: "blackAlpha.100",
              _dark: { bg: "whiteAlpha.200" },
              transform: "translateX(-2px)",
            }}
            transition="all 0.2s"
          >
            {tHeader("home")}
          </Button>

          <Spacer />

          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
            <LanguageSwitcher isHeader />
            
            <Tooltip label={tFooter("mode", { mode: colorMode })} hasArrow>
               <CustomCard as="button" onClick={toggleColorMode} p={0} m={0} bg="transparent" border="none" shadow="none">
                  <Flex boxSize={9} align="center" justify="center" rounded="full" _hover={{ bg: "blackAlpha.100", _dark: { bg: "whiteAlpha.200" } }} transition="all 0.2s">
                     <Image
                        src="/Images/numerologyPNG.png"
                        alt={tFooter("logoAlt")}
                        placeholder="blur"
                        blurDataURL="/Images/numerologyPNG.png"
                        style={{ borderRadius: "50%" }}
                        width={24}
                        height={24}
                     />
                  </Flex>
               </CustomCard>
            </Tooltip>

            <Tooltip label={tFooter("sourceCode")} hasArrow>
               <CustomCard
                  as="a"
                  href="https://github.com/minhphuc010194/NumerologyWebApp"
                  target="_blank"
                  p={0} m={0} bg="transparent" border="none" shadow="none"
               >
                  <Flex boxSize={9} align="center" justify="center" rounded="full" color="gray.700" _dark={{ color: "whiteAlpha.900" }} _hover={{ bg: "blackAlpha.100", _dark: { bg: "whiteAlpha.200" } }} transition="all 0.2s">
                     <Icon
                        as={AiFillGithub}
                        boxSize={5}
                     />
                  </Flex>
               </CustomCard>
            </Tooltip>
            
            <Feeacback isHeader />
            <Donate isHeader />
          </HStack>

          <Spacer display={{ base: "none", md: "block" }} />

          {hasMessages && (
            <Button
              onClick={clearMessages}
              variant="ghost"
              color="gray.600"
              _dark={{ color: "whiteAlpha.800" }}
              size="sm"
              leftIcon={<Icon as={MdDeleteOutline} />}
              fontWeight={500}
              borderRadius="full"
              _hover={{
                bg: "blackAlpha.100",
                _dark: { bg: "whiteAlpha.200", color: "white" },
                color: "gray.800",
              }}
              transition="all 0.2s"
            >
              {t("clearChat")}
            </Button>
          )}
          <Badge
            bgGradient="linear(to-r, yellow.400, orange.400)"
            color="gray.900"
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight={800}
            textTransform="none"
            shadow="sm"
          >
            AI Numerology
          </Badge>
        </HStack>
      </Flex>

      {/* Messages Scroll Area - Full Width */}
      <Box
        flex={1}
        overflowY="auto"
        w="100%"
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: scrollbarThumbBg,
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: scrollbarThumbHoverBg,
          },
        }}
      >
        <Container maxW="container.lg" py={4} px={4} display="flex" flexDir="column" minH="100%">
          {/* Empty State */}
          {!hasMessages && (
            <VStack spacing={6} align="stretch" flex={1} justify="center" py={8}>
              <Box
                textAlign="center"
                py={12}
                px={6}
                borderRadius="2xl"
                bg={emptyBg}
                backdropFilter="blur(10px)"
                shadow="md"
                borderWidth={1}
                borderColor={emptyBorder}
              >
                <Heading
                  size="lg"
                  bgGradient="linear(to-r, brand.500, brand.300)"
                  bgClip="text"
                  mb={4}
                  fontFamily="fantasy"
                >
                  {t("emptyStateTitle")}
                </Heading>
                <Text
                  color={useColorModeValue("gray.600", "gray.300")}
                  fontSize="sm"
                  maxW="md"
                  mx="auto"
                  mb={3}
                >
                  {t("emptyStateSubtitle")}
                </Text>
                <Text
                  color={useColorModeValue("gray.500", "gray.400")}
                  fontSize="xs"
                  fontStyle="italic"
                >
                  {t("emptyStateExample")}
                </Text>
              </Box>
            </VStack>
          )}

          {/* Messages */}
          {hasMessages && (
            <VStack spacing={4} align="stretch" py={2}>
              {messages.map((message) => {
                // Hide empty assistant placeholder while searching
                if (message.role === "assistant" && !message.content && phase === "searching") {
                  return null;
                }
                return <ChatMessageBubble key={message.id} message={message} t={t} />;
              })}

              {/* Streaming Indicator */}
              {isStreaming && phase === "searching" && (
                <StreamingIndicator
                  phase="searching"
                  t={t}
                />
              )}

              {/* Error + Retry */}
              {phase === "error" && error && (
                <HStack justify="center" py={2}>
                  <Button
                    onClick={retryLastMessage}
                    size="sm"
                    colorScheme="brand"
                    variant="outline"
                    borderRadius="full"
                  >
                    {t("retryButton")}
                  </Button>
                </HStack>
              )}

              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Container>
      </Box>

      {/* Input Area - Full Width Wrapper */}
      <Box w="100%" pt={2} pb={4} flexShrink={0} bg="transparent">
        <Container maxW="container.lg" px={4}>
          <ChatInput
            onSend={sendMessage}
            isDisabled={isStreaming}
            placeholder={t("inputPlaceholder")}
          />
          <Text
            textAlign="center"
            fontSize="xs"
            color={useColorModeValue("gray.500", "gray.400")}
            fontStyle="italic"
            mt={2}
          >
            {t("tip")}
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
