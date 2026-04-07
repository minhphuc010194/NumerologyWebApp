'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Tooltip
} from '@/components';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Input
} from '@chakra-ui/react';
import { MdFileDownload, MdFileUpload, MdMoreVert, MdMenu, MdAdd, MdOutlineChat, MdEdit, MdCheck, MdClose, MdLockOutline } from 'react-icons/md';
import { ChatMessageBubble, ChatInput, StreamingIndicator } from '@/components';
import { useTranslations } from 'next-intl';
import { useChatRAG } from '@/hooks/use-chat-rag';

export default function Chat() {
  const t = useTranslations('Chat');
  const tHeader = useTranslations('Header');
  const tFooter = useTranslations('Footer');
  const router = useRouter();

  const {
    messages,
    sendMessage,
    isStreaming,
    phase,
    error,
    retryLastMessage,
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    exportSessions,
    importSessions
  } = useChatRAG();

  const { toggleColorMode, colorMode } = useColorMode();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importSessions(file);
      toast({
        title: t('importSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      onClose(); // Close drawer on success
    } catch (err) {
      toast({
        title: t('importError'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Color tokens — brand palette
  const bgGradient = useColorModeValue(
    'linear(to-b, orange.50, gray.50)',
    'linear(to-b, gray.900, gray.850)'
  );
  // Clean, transparent glassmorphism for header
  const headerBg = useColorModeValue('whiteAlpha.800', 'blackAlpha.600');
  const headerBorder = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const emptyBg = useColorModeValue('whiteAlpha.800', 'gray.800');
  const emptyBorder = useColorModeValue('brand.200', 'brand.700');
  const scrollbarThumbBg = useColorModeValue('#DD6B20', '#ED8936');
  const scrollbarThumbHoverBg = useColorModeValue('#C05621', '#F6AD55');

  const drawerBg = useColorModeValue('white', 'gray.900');
  const sessionItemBgHover = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const sessionActiveBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const drawerFooterBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const textMuted = useColorModeValue('gray.600', 'gray.300');
  const textHint = useColorModeValue('gray.500', 'gray.400');

  const hasMessages = messages.length > 0;

  return (
    <Box
      h="100dvh"
      overflow="hidden"
      bgGradient={bgGradient}
      display="flex"
      flexDir="column"
    >
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
          <IconButton
            icon={<Icon as={MdMenu} boxSize={5} />}
            variant="ghost"
            size="sm"
            rounded="full"
            color="gray.700"
            _dark={{ color: 'whiteAlpha.900' }}
            onClick={onOpen}
            aria-label="Menu"
            _hover={{
              bg: 'blackAlpha.100',
              _dark: { bg: 'whiteAlpha.200' }
            }}
          />
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            color="gray.700"
            _dark={{ color: 'whiteAlpha.900' }}
            leftIcon={<Icon as={MdArrowBackIosNew} />}
            size="sm"
            fontWeight={600}
            borderRadius="full"
            _hover={{
              bg: 'blackAlpha.100',
              _dark: { bg: 'whiteAlpha.200' },
              transform: 'translateX(-2px)'
            }}
            transition="all 0.2s"
          >
            {tHeader('home')}
          </Button>

          <Spacer />

          <HStack spacing={{ base: 1, md: 2 }}>
            <LanguageSwitcher isHeader />

            <Tooltip label={tFooter('mode', { mode: colorMode })} hasArrow>
              <CustomCard
                as="button"
                onClick={toggleColorMode}
                p={0}
                m={0}
                bg="transparent"
                border="none"
                shadow="none"
              >
                <Flex
                  boxSize={9}
                  align="center"
                  justify="center"
                  rounded="full"
                  _hover={{
                    bg: 'blackAlpha.100',
                    _dark: { bg: 'whiteAlpha.200' }
                  }}
                  transition="all 0.2s"
                >
                  <Image
                    src="/Images/numerologyPNG.png"
                    alt={tFooter('logoAlt')}
                    style={{ borderRadius: '50%' }}
                    width={24}
                    height={24}
                  />
                </Flex>
              </CustomCard>
            </Tooltip>

            <Tooltip label={tFooter('sourceCode')} hasArrow>
              <CustomCard
                as="a"
                href="https://github.com/minhphuc010194/NumerologyWebApp"
                target="_blank"
                p={0}
                m={0}
                bg="transparent"
                border="none"
                shadow="none"
              >
                <Flex
                  boxSize={9}
                  align="center"
                  justify="center"
                  rounded="full"
                  color="gray.700"
                  _dark={{ color: 'whiteAlpha.900' }}
                  _hover={{
                    bg: 'blackAlpha.100',
                    _dark: { bg: 'whiteAlpha.200' }
                  }}
                  transition="all 0.2s"
                >
                  <Icon as={AiFillGithub} boxSize={5} />
                </Flex>
              </CustomCard>
            </Tooltip>

            <Feeacback isHeader />
            <Donate isHeader />
          </HStack>
          <Spacer />

          {/* Hidden File Input */}
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Drawer for History & Settings */}
          <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
            <DrawerOverlay />
            <DrawerContent bg={drawerBg}>
              <DrawerCloseButton mt={1} />
              <DrawerHeader borderBottomWidth="1px" borderColor={headerBorder}>
                {t('chatHistory')}
              </DrawerHeader>
              <DrawerBody p={0} display="flex" flexDir="column">
                <Box p={3}>
                  <Button
                    w="100%"
                    colorScheme="brand"
                    leftIcon={<Icon as={MdAdd} />}
                    onClick={() => {
                      createNewSession();
                      onClose();
                    }}
                  >
                    {t('newChat')}
                  </Button>
                </Box>
                
                <VStack flex={1} overflowY="auto" align="stretch" spacing={0} px={2} pb={2}>
                  {sessions.map(s => (
                    <Flex
                      key={s.id}
                      p={3}
                      align="center"
                      cursor="pointer"
                      borderRadius="md"
                      bg={s.id === currentSessionId ? sessionActiveBg : 'transparent'}
                      _hover={{ bg: sessionItemBgHover }}
                      onClick={() => {
                        switchSession(s.id);
                        onClose();
                      }}
                    >
                      <Icon as={MdOutlineChat} mr={3} color="gray.500" />
                      <Box flex={1} overflow="hidden">
                        {editingSessionId === s.id ? (
                          <HStack flex={1} onClick={(e) => e.stopPropagation()}>
                            <Input 
                              size="xs" 
                              value={editTitleValue} 
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  renameSession(s.id, editTitleValue);
                                  setEditingSessionId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingSessionId(null);
                                }
                              }}
                              autoFocus
                            />
                            <IconButton
                              icon={<Icon as={MdCheck} />}
                              size="xs"
                              aria-label="Save"
                              colorScheme="green"
                              onClick={() => {
                                renameSession(s.id, editTitleValue);
                                setEditingSessionId(null);
                              }}
                            />
                            <IconButton
                              icon={<Icon as={MdClose} />}
                              size="xs"
                              aria-label="Cancel"
                              onClick={() => setEditingSessionId(null)}
                            />
                          </HStack>
                        ) : (
                          <>
                            <Text fontSize="sm" fontWeight={s.id === currentSessionId ? "bold" : "medium"} noOfLines={1}>
                              {s.title}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(s.updatedAt).toLocaleTimeString()} - {new Date(s.updatedAt).toLocaleDateString()}
                            </Text>
                          </>
                        )}
                      </Box>
                      {!editingSessionId && (
                        <>
                          <IconButton
                            icon={<Icon as={MdEdit} />}
                            size="xs"
                            aria-label={t('renameSession')}
                            variant="ghost"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(s.id);
                              setEditTitleValue(s.title);
                            }}
                          />
                          <IconButton
                            icon={<Icon as={MdDeleteOutline} />}
                            size="xs"
                            aria-label="Delete"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(s.id);
                            }}
                          />
                        </>
                      )}
                    </Flex>
                  ))}
                </VStack>

                <VStack p={3} borderTop="1px solid" borderColor={headerBorder} spacing={2} align="stretch" bg={drawerFooterBg}>
                  <Button
                    size="sm"
                    variant="ghost"
                    justifyContent="flex-start"
                    leftIcon={<Icon as={MdFileUpload} />}
                    onClick={handleImportClick}
                  >
                    {t('importChat')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    justifyContent="flex-start"
                    leftIcon={<Icon as={MdFileDownload} />}
                    onClick={() => { exportSessions(); onClose(); }}
                    isDisabled={sessions.length === 0}
                  >
                    {t('exportChat')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    justifyContent="flex-start"
                    leftIcon={<Icon as={MdDeleteOutline} />}
                    onClick={() => { clearAllSessions(); onClose(); }}
                    isDisabled={sessions.length === 0}
                  >
                    {t('clearAllSessions')}
                  </Button>
                  <HStack px={2} pt={2} pb={1} spacing={2} align="flex-start">
                    <Icon as={MdLockOutline} color="green.500" mt={0.5} boxSize={3.5} />
                    <Text fontSize="xs" color={textHint} lineHeight="shorter">
                      {t('privacyNotice')}
                    </Text>
                  </HStack>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </HStack>
      </Flex>

      {/* Messages Scroll Area - Full Width */}
      <Box
        flex={1}
        overflowY="auto"
        w="100%"
        css={{
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollbarThumbBg,
            borderRadius: '10px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: scrollbarThumbHoverBg
          }
        }}
      >
        <Container
          maxW="container.lg"
          py={4}
          px={4}
          display="flex"
          flexDir="column"
          minH="100%"
        >
          {/* Empty State */}
          {!hasMessages && (
            <VStack
              spacing={6}
              align="stretch"
              flex={1}
              justify="center"
              py={8}
            >
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
                  {t('emptyStateTitle')}
                </Heading>
                <Text
                  color={useColorModeValue('gray.600', 'gray.300')}
                  fontSize="sm"
                  maxW="md"
                  mx="auto"
                  mb={3}
                >
                  {t('emptyStateSubtitle')}
                </Text>
                <Text
                  color={useColorModeValue('gray.500', 'gray.400')}
                  fontSize="xs"
                  fontStyle="italic"
                >
                  {t('emptyStateExample')}
                </Text>
              </Box>
            </VStack>
          )}

          {/* Messages */}
          {hasMessages && (
            <VStack spacing={4} align="stretch" py={2}>
              {messages.map((message) => {
                // Hide empty assistant placeholder while searching
                if (
                  message.role === 'assistant' &&
                  !message.content &&
                  phase === 'searching'
                ) {
                  return null;
                }
                return (
                  <ChatMessageBubble key={message.id} message={message} t={t} />
                );
              })}

              {/* Streaming Indicator */}
              {isStreaming && phase === 'searching' && (
                <StreamingIndicator phase="searching" t={t} />
              )}

              {/* Error + Retry */}
              {phase === 'error' && error && (
                <HStack justify="center" py={2}>
                  <Button
                    onClick={retryLastMessage}
                    size="sm"
                    colorScheme="brand"
                    variant="outline"
                    borderRadius="full"
                  >
                    {t('retryButton')}
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
            placeholder={t('inputPlaceholder')}
          />
          <Text
            textAlign="center"
            fontSize="xs"
            color={textHint}
            fontStyle="italic"
            mt={2}
          >
            {t('tip')}
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
