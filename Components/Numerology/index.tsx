import { FC } from "react";
import { Box, Heading } from "../";
import { Numerology as NumerologyTxt } from "../../Utils/Constaints";

export const Numerology: FC = () => {
   return (
      <Box>
         <Heading textAlign="center">{NumerologyTxt}</Heading>
      </Box>
   );
};
