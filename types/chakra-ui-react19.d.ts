// Type compatibility fix for Chakra UI v2 with React 19
// This resolves type conflicts between Chakra UI's React 18 types and React 19

import "react";

declare module "@chakra-ui/react" {
   // Override Modal and other components to be compatible with React 19
   export const Modal: any;
   export const ModalOverlay: any;
   export const ModalContent: any;
   export const ModalHeader: any;
   export const ModalBody: any;
   export const ModalCloseButton: any;
}
