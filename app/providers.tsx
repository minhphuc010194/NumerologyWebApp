"use client";

import { EmotionCacheProvider } from "./EmotionCache";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "utils/themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionCacheProvider>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </EmotionCacheProvider>
  );
}
