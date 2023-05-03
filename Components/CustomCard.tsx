import React from "react";
import { Box, type BoxProps } from "@chakra-ui/react";

type PropTypes = BoxProps & {
   children: React.ReactNode;
   href?: string;
   target?: "_blank" | "_self" | "_parent" | "_top" | "framename";
};
// eslint-disable-next-line react/display-name
export const CustomCard: React.FC<PropTypes> = React.forwardRef(
   ({ children, ...rest }, ref) => (
      <Box ref={ref} {...rest}>
         {children}
      </Box>
   )
);
