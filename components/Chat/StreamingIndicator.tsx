"use client";
import { Box, HStack, Text, useColorModeValue } from "@chakra-ui/react";

type Phase = "searching" | "generating";

interface StreamingIndicatorProps {
  phase: Phase;
  t: (key: string) => string;
}

export function StreamingIndicator({ phase, t }: StreamingIndicatorProps) {
  const bubbleBg = useColorModeValue("white", "gray.800");
  const bubbleBorder = useColorModeValue("brand.200", "brand.700");
  const dotColor = useColorModeValue("brand.400", "brand.300");
  const textColor = useColorModeValue("gray.600", "gray.400");

  const label =
    phase === "searching" ? t("searchingKnowledge") : t("generatingResponse");

  return (
    <Box display="flex" justifyContent="flex-start" maxW={{ base: "90%", md: "75%" }}>
      <Box
        p={4}
        bg={bubbleBg}
        borderRadius="2xl"
        borderWidth={1}
        borderColor={bubbleBorder}
        shadow="sm"
      >
        <HStack spacing={3}>
          <HStack spacing={1.5}>
            {[0, 0.2, 0.4].map((delay) => (
              <Box
                key={delay}
                w={2}
                h={2}
                bg={dotColor}
                borderRadius="full"
                sx={{
                  animation: `pulse 1.4s ease-in-out ${delay}s infinite`,
                }}
              />
            ))}
          </HStack>
          <Text fontSize="xs" color={textColor} fontWeight={500}>
            {label}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
}
