import { FC, ReactNode } from "react";
import { Box, HStack, Heading, Text } from "../";
import { BoxProps } from "../../Utils/types";

type PropTypes = BoxProps & {
   title: string;
   content: string | number | ReactNode;
   name: string;
};
export const DisplayCard: FC<PropTypes> = ({
   title,
   content,
   name,
   ...rest
}) => {
   return (
      <HStack spacing={4}>
         <Box p={3} shadow="base" borderWidth="1px" {...rest}>
            <Heading fontSize="md">{title}</Heading>
            <Text fontSize="small" color="gray.400">
               {name}
            </Text>
            {typeof content === 'string' || typeof content === 'number' ? (
               <Text mt={2} fontSize="3xl" color="red.400" fontWeight={600}>
                  {content}
               </Text>
            ) : (
               <Box mt={2} fontSize="3xl" color="red.400" fontWeight={600}>
                  {content}
               </Box>
            )}
         </Box>
      </HStack>
   );
};
