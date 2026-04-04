"use client";
import { FC } from "react";
import { Box, Text, VStack, useColorModeValue } from "components";
import { useTranslations } from "next-intl";

export const Disclaimer: FC = () => {
   const t = useTranslations("Disclaimer");
   const bgColor = useColorModeValue("yellow.50", "yellow.900");
   const borderColor = useColorModeValue("yellow.200", "yellow.700");
   const textColor = useColorModeValue("gray.700", "gray.200");

   return (
      <Box
         bg={bgColor}
         borderWidth="1px"
         borderColor={borderColor}
         borderRadius="md"
         p={4}
         my={4}
         mx="auto"
         maxW="container.md"
      >
         <VStack spacing={2} align="stretch">
            <Text
               fontSize="xs"
               fontWeight="semibold"
               color={textColor}
               textAlign="center"
            >
               {t("title")}
            </Text>
            <Text fontSize="xs" color={textColor} textAlign="center">
               {t("content")}
            </Text>
         </VStack>
      </Box>
   );
};
