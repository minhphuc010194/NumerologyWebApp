import { FC } from "react";
import { Box, HStack, Heading, Text } from "../";
import { BoxProps } from "../../Utils/types";

type PropTypes = BoxProps & {
   title: string;
   content: string;
};
export const DisplayCard: FC<PropTypes> = ({ title, content, ...rest }) => {
   return (
      <HStack spacing={4}>
         <Box p={5} shadow="md" borderWidth="1px" {...rest}>
            <Heading fontSize="xl">{title}</Heading>
            <Text mt={4}>{content}</Text>
         </Box>
      </HStack>
   );
};
