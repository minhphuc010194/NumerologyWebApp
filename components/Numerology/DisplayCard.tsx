import { FC, ReactNode } from "react";
import { Box, Heading, Text } from "../";
import { BoxProps } from "../../utils/types";

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
      <Box 
         p={{ base: 2, md: 3 }} 
         w="100%"
         h="100%"
         shadow="base" 
         borderWidth="1px" 
         display="flex"
         flexDirection="column"
         justifyContent="center"
         alignItems="center"
         {...rest}
      >
         <Heading fontSize={{ base: "xs", md: "sm" }} fontWeight={700} lineHeight="1.3" title={title}>
            {title}
         </Heading>
         {name && (
            <Text fontSize="xs" color="gray.400" mt={1}>
               {name}
            </Text>
         )}
         {typeof content === 'string' || typeof content === 'number' ? (
            <Text mt={{ base: 1, md: 2 }} fontSize={{ base: "2xl", md: "3xl" }} color="red.400" fontWeight={800}>
               {content}
            </Text>
         ) : (
            <Box mt={{ base: 1, md: 2 }} fontSize={{ base: "2xl", md: "3xl" }} color="red.400" fontWeight={800}>
               {content}
            </Box>
         )}
      </Box>
   );
};
