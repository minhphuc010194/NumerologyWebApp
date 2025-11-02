"use client";
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
const config: ThemeConfig = {
   initialColorMode: "system",
   useSystemColorMode: true,
};
const colors = {
   brand: {
      900: "#1a365d",
      800: "#153e75",
      700: "#2a69ac",
   },
};

export const theme = extendTheme({ colors, config });
