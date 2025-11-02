// Type compatibility fix for Chakra UI v2 and Next.js with React 19
// This resolves type conflicts between React 18 types and React 19

import "react";

declare module "@chakra-ui/react" {
   // Override Modal and other components to be compatible with React 19
   export const Modal: any;
   export const ModalOverlay: any;
   export const ModalContent: any;
   export const ModalHeader: any;
   export const ModalBody: any;
   export const ModalCloseButton: any;
   export const ChakraProvider: any;
}

declare module "next/link" {
   // Override Next.js Link component to be compatible with React 19
   // Using any type to bypass React 19 JSX type strictness
   const Link: any;
   export default Link;
}
