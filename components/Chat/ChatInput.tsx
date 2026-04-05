'use client';
import { useRef, useCallback, KeyboardEvent } from 'react';
import {
  Flex,
  Box,
  Textarea,
  Button,
  Icon,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { AiOutlineSend } from 'react-icons/ai';

interface ChatInputProps {
  onSend: (content: string) => void;
  isDisabled: boolean;
  placeholder: string;
}

export function ChatInput({ onSend, isDisabled, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputBg = useColorModeValue('white', 'gray.800');
  const inputBorder = useColorModeValue('gray.300', 'gray.600');
  const sendBg = useColorModeValue('brand.500', 'brand.600');
  const sendHoverBg = useColorModeValue('brand.600', 'brand.500');

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value?.trim();
    if (!value || isDisabled) return;

    onSend(value);

    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }, [onSend, isDisabled]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleAutoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = 150; // ~6 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  return (
    <Flex
      bg={inputBg}
      borderRadius="3xl"
      borderWidth={1}
      borderColor={inputBorder}
      shadow="sm"
      alignItems="flex-end"
      pl={6}
      pr={2}
      py={2}
      _focusWithin={{
        borderColor: 'brand.300',
        boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)'
      }}
      transition="all 0.2s"
      w="100%"
    >
      {/* Input Field */}
      <Textarea
        ref={textareaRef}
        autoFocus
        placeholder={placeholder}
        bg="transparent"
        border="none"
        _focus={{ boxShadow: 'none' }}
        _hover={{ border: 'none' }}
        onKeyDown={handleKeyDown}
        onInput={handleAutoResize}
        fontSize="md"
        p={0}
        py={2}
        mr={2}
        lineHeight="24px"
        minH="80px"
        maxH="150px"
        resize="none"
        rows={1}
        overflow="auto"
        overflowY="hidden"
        flex={1}
        css={{
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '10px'
          }
        }}
      />

      {/* Right Controls */}
      <Box>
        <Button
          onClick={handleSend}
          rounded="full"
          bg={sendBg}
          color="white"
          isDisabled={isDisabled}
          w="40px"
          h="40px"
          minW="40px"
          p={0}
          _hover={{
            bg: sendHoverBg,
            transform: 'scale(1.05)'
          }}
          _active={{
            transform: 'scale(0.95)'
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
            bg: useColorModeValue('gray.400', 'gray.600')
          }}
          transition="all 0.2s"
          flexShrink={0}
        >
          <Icon as={AiOutlineSend} boxSize={5} />
        </Button>
      </Box>
    </Flex>
  );
}
