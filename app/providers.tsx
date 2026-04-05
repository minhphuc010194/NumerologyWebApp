"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { EmotionCacheProvider } from "./EmotionCache";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "utils/themes";

const COLOR_MODE_SCRIPT = `!function(){try{var m="${theme.config?.initialColorMode || "light"}";var e=localStorage.getItem("chakra-ui-color-mode")||m;if(e==="system"){e=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement;d.style.colorScheme=e;d.dataset.theme=e}catch(e){}}()`;

export function Providers({ children }: { children: React.ReactNode }) {
  const isServerInserted = useRef(false);

  useServerInsertedHTML(() => {
    if (isServerInserted.current) return null;
    isServerInserted.current = true;

    return (
      <script
        key="chakra-color-mode"
        dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }}
      />
    );
  });

  return (
    <EmotionCacheProvider>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </EmotionCacheProvider>
  );
}
