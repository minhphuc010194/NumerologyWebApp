"use client";
import { FC } from "react";
import { Box, Text, VStack, useColorModeValue } from "Components";

export const Disclaimer: FC = () => {
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
               📌 Disclaimer / Tuyên bố miễn trừ trách nhiệm
            </Text>
            <Text fontSize="xs" color={textColor} textAlign="center">
               <strong>Tiếng Việt:</strong> Đây là ứng dụng chỉ mang tính chất
               tham khảo, giải trí. Không phục vụ mục đích bói toán, mê tín và
               trái với thuần phong mỹ tục.
            </Text>
            <Text fontSize="xs" color={textColor} textAlign="center">
               <strong>English:</strong> This application is for reference and
               entertainment purposes only. It is not intended for fortune
               telling, superstition, or any purpose contrary to good morals and
               customs.
            </Text>
         </VStack>
      </Box>
   );
};
