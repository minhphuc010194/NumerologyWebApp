'use client';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import type { ChatMessage } from 'hooks/chat-types';
import { SourceReferences } from './SourceReferences';
import { motion } from 'framer-motion';
import { PyraMascot } from './PyraMascot';

import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Silencing KaTeX warnings about missing character metrics for Vietnamese characters
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('No character metrics')) {
      return; 
    }
    originalWarn.apply(console, args);
  };
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  t: (key: string) => string;
}

function ChatMessageBubbleInner({ message, t }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  // Color tokens using brand palette
  const userBubbleBg = useColorModeValue('brand.500', 'brand.600');
  const aiBubbleBg = useColorModeValue('white', 'gray.800');
  const aiBubbleBorder = useColorModeValue('brand.200', 'brand.700');
  const aiTextColor = useColorModeValue('gray.700', 'gray.200');
  const strongColor = useColorModeValue('brand.600', 'brand.300');

  const markdownContent = useMemo(() => {
    if (isUser) return null;
    
    let content = message.content;
    
    // 1. Remove all complete `<thought>...</thought>` blocks
    content = content.replace(/<thought>[\s\S]*?<\/thought>\n*/g, "");
    
    // 2. Hide incomplete `<thought>` block (while LLM is streaming it)
    if (content.includes("<thought>")) {
      content = content.split("<thought>")[0];
    }
    
    return content.trim();
  }, [isUser, message.content]);

  if (isUser) {
    if (!message.content.trim()) return null;
    return (
      <Box
        display="flex"
        justifyContent="flex-end"
        sx={{ animation: 'fadeIn 0.3s ease-in' }}
      >
        <Box
          maxW={{ base: '85%', md: '70%' }}
          p={3}
          bg={userBubbleBg}
          color="white"
          borderRadius="xl"
          borderTopRightRadius="sm"
          shadow="lg"
          wordBreak="break-word"
        >
          <Text fontSize="sm" fontWeight={500} whiteSpace="pre-wrap">
            {message.content}
          </Text>
        </Box>
      </Box>
    );
  }

  // Assistant message
  return (
    <Box
      display="flex"
      justifyContent="flex-start"
      mb={message.isStreaming ? 4 : 0}
      sx={{ animation: 'fadeIn 0.3s ease-in' }}
    >
      {message.isStreaming && (
        <Box
          w={{ base: '32px', md: '40px' }}
          h={{ base: '32px', md: '40px' }}
          mr={3}
          flexShrink={0}
        >
          <Box as={motion.div} layoutId="shared-pyra">
            <PyraMascot size={32} state="speaking" />
          </Box>
        </Box>
      )}

      <Box
        maxW={message.isStreaming ? "calc(100% - 50px)" : "100%"}
        w="100%"
        display="flex"
        flexDir="column"
        gap={2}
      >
        <Box
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
            fontSize="sm"
            lineHeight="tall"
            color={aiTextColor}
            className="markdown-content"
            css={{
              '& strong, & b': {
                color: strongColor,
                fontWeight: 600
              },
              '& h1, & h2, & h3, & h4': {
                color: strongColor,
                fontWeight: 700,
                marginTop: '12px',
                marginBottom: '6px'
              },
              '& ul, & ol': {
                paddingLeft: '20px',
                marginBottom: '8px'
              },
              '& li': {
                marginBottom: '4px'
              },
              '& p': {
                marginBottom: '8px'
              },
              '& code': {
                background: 'rgba(0,0,0,0.06)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.85em'
              },
              '& pre': {
                background: 'rgba(0,0,0,0.06)',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                marginBottom: '8px'
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '8px'
              },
              '& th, & td': {
                border: '1px solid',
                borderColor: aiBubbleBorder,
                padding: '6px 10px',
                fontSize: '0.85em'
              },
              '& blockquote': {
                borderLeft: '3px solid',
                borderColor: strongColor,
                paddingLeft: '12px',
                marginLeft: 0,
                opacity: 0.9
              }
            }}
          >
            {markdownContent ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[
                  [rehypeKatex, { strict: 'ignore', throwOnError: false }]
                ]}
              >
                {markdownContent}
              </ReactMarkdown>
            ) : (
              message.isStreaming && (
                <Box
                  w={2}
                  h={4}
                  bg={strongColor}
                  borderRadius="sm"
                  sx={{ animation: 'pulse 1s ease-in-out infinite' }}
                />
              )
            )}
          </Box>
        </Box>

        {/* Source references (Temporarily Hidden) */}
        {/* {message.sources &&
          message.sources.length > 0 &&
          !message.isStreaming && (
            <SourceReferences sources={message.sources} t={t} />
          )} */}
      </Box>
    </Box>
  );
}

export const ChatMessageBubble = memo(ChatMessageBubbleInner);
