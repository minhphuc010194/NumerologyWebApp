import { FC, useDeferredValue, useState } from "react";
import { Box, Heading, Input } from "../";
import { Numerology as NumerologyTxt } from "../../Utils/constaints";

export const Numerology: FC = () => {
   const [name, setName] = useState<string>("");
   const deferredName = useDeferredValue(name);

   return (
      <Box>
         <Heading textAlign="center">{NumerologyTxt}</Heading>
         <Box as="br" />
         <Box textAlign="center">
            <Input
               placeholder="Nhập họ tên đầy đủ"
               w={{ md: "50%", xs: "100%" }}
               onChange={(e) => setName(e.target.value)}
            />
         </Box>
      </Box>
   );
};
