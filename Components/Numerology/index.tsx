import { FC, useDeferredValue, useState } from "react";
import moment from "moment";
import { Box, Heading, Input, VStack } from "../";
import { Numerology as NumerologyTxt } from "../../Utils/constaints";
import { RenderItem } from "./RenderItem";

export const Numerology: FC = () => {
   const [name, setName] = useState<string>("");
   const [birth, setBirth] = useState<string>(new Date().toISOString());
   const deferredName = useDeferredValue(name);
   const deferredBirth = useDeferredValue(birth);

   return (
      <Box h="90vh">
         <Heading textAlign="center" fontFamily="fantasy" pt={4}>
            {NumerologyTxt}
         </Heading>
         <Box as="br" />
         <VStack spacing={2} align="stretch">
            <Box h="40px" bg="gray.50">
               <Input
                  autoFocus
                  placeholder="Nhập họ tên đầy đủ, vd: 'Nguyen Van An'"
                  w={{ md: "50%", xs: "100%" }}
                  onChange={(e) => setName(e.target.value)}
               />
            </Box>
            <Box bg="gray.50">
               <Input
                  autoFocus
                  type="date"
                  placeholder="Ngày tháng năm sinh"
                  w={{ md: "50%", xs: "100%" }}
                  defaultValue={moment().format("YYYY-MM-DD")}
                  onChange={(e) => setBirth(e.target.value)}
               />
            </Box>
         </VStack>

         <Box as="form">
            <Box
               as="fieldset"
               border="1px solid red"
               textAlign="center"
               py={4}
               px={2}
               borderRadius={3}
            >
               <Box as="legend" fontSize={20} fontWeight={800} color="red.400">
                  Chỉ Số
               </Box>
               <RenderItem name={deferredName} birth={deferredBirth} />
            </Box>
         </Box>
      </Box>
   );
};
