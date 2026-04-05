"use client";
import { useState } from "react";
import {
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Link,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdExpandMore, MdExpandLess, MdMenuBook } from "react-icons/md";
import type { RetrievalSourceInfo } from "hooks/chat-types";

interface SourceReferencesProps {
  sources: RetrievalSourceInfo[];
  t: (key: string) => string;
}

const COLLECTION_LABELS: Record<string, string> = {
  chunk: "sourcesFromChunk",
  summary: "sourcesFromSummary",
  qa: "sourcesFromQA",
};

const COLLECTION_COLORS: Record<string, string> = {
  chunk: "blue",
  summary: "green",
  qa: "purple",
};

export function SourceReferences({ sources, t }: SourceReferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardBg = useColorModeValue("gray.50", "gray.750");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  if (sources.length === 0) return null;

  return (
    <Box
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
      overflow="hidden"
      fontSize="xs"
    >
      {/* Toggle header */}
      <HStack
        px={3}
        py={2}
        bg={cardBg}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: hoverBg }}
        transition="background 0.15s"
        spacing={2}
      >
        <Icon as={MdMenuBook} color="brand.500" boxSize={3.5} />
        <Text fontWeight={600} color={textColor} flex={1}>
          {t("sourcesTitle")} ({sources.length})
        </Text>
        <Icon
          as={isExpanded ? MdExpandLess : MdExpandMore}
          color={textColor}
          boxSize={4}
        />
      </HStack>

      {/* Expanded content */}
      {isExpanded && (
        <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px" borderColor={borderColor} />}>
          {sources.map((source, index) => (
            <HStack
              key={`${source.collection}-${index}`}
              px={3}
              py={2}
              spacing={2}
              _hover={{ bg: hoverBg }}
              transition="background 0.15s"
            >
              <Badge
                colorScheme={COLLECTION_COLORS[source.collection] ?? "gray"}
                fontSize="2xs"
                px={1.5}
                borderRadius="sm"
                flexShrink={0}
              >
                {t(COLLECTION_LABELS[source.collection] ?? "sourcesFromChunk")}
              </Badge>
              <Text color={textColor} flex={1} noOfLines={1}>
                {source.refLink ? (
                  <Link
                    href={source.refLink}
                    isExternal
                    color="brand.500"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {source.title}
                  </Link>
                ) : (
                  source.title
                )}
              </Text>
              {source.score > 0 && (
                <Badge
                  variant="outline"
                  colorScheme="brand"
                  fontSize="2xs"
                  flexShrink={0}
                >
                  {(source.score * 100).toFixed(0)}%
                </Badge>
              )}
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
