import React from "react";
import { Box, type BoxProps } from "@chakra-ui/react";

type PropTypes = BoxProps & {
   children?: React.ReactNode;
   href?: string;
   target?: "_blank" | "_self" | "_parent" | "_top" | "framename";
};

// eslint-disable-next-line react/display-name
const CustomCardComponent = React.forwardRef<HTMLDivElement, PropTypes>(
   ({ children, ...rest }, ref) => (
      <Box ref={ref} {...rest}>
         {children}
      </Box>
   )
);

// React 19 compatible component type - workaround for FC type incompatibility
// Using any type to bypass React 19 JSX type strictness
export const CustomCard: any = CustomCardComponent;
