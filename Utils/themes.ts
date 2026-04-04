"use client";
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
const config: ThemeConfig = {
   initialColorMode: "system",
   useSystemColorMode: true,
};
const colors = {
   brand: {
      50: "#fffaf0",
      100: "#feebc8",
      200: "#fbd38d",
      300: "#f6ad55",
      400: "#ed8936",
      500: "#dd6b20",
      600: "#c05621",
      700: "#9c4221",
      800: "#7b341e",
      900: "#652b19",
   },
};

export const theme = extendTheme({ colors, config });
