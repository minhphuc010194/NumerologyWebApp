import { FC } from "react";
import { Box, Heading, Input } from "../";
import { Numerology as NumerologyTxt } from "../../Utils/constaints";

export const Numerology: FC = () => {
   return (
      <Box>
         <Heading textAlign="center">{NumerologyTxt}</Heading>
         <Input placeholder="họ tên đầy đủ" />
      </Box>
   );
};
