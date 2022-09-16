import {
   FC,
   useDeferredValue,
   useState,
   ChangeEvent,
   useId,
   useRef,
} from "react";
import moment from "moment";
import { Box, Heading, Input, VStack, Wrap } from "../";
import { Numerology as NumerologyTxt } from "../../Utils/constaints";
import { RenderItem } from "./RenderItem";
import { useProcessNumerology } from "../../Hooks";

export const Numerology: FC = () => {
   const id = useId();
   const refInputName = useRef<HTMLInputElement>(null);
   const [name, setName] = useState<string>("Lê Phạm Thanh Nga");
   const [birth, setBirth] = useState<string>(new Date().toISOString());
   const deferredName = useDeferredValue(name);
   const deferredBirth = useDeferredValue(birth);
   const data = useProcessNumerology(deferredName, deferredBirth);

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
                  onClick={() => refInputName.current?.select()}
                  ref={refInputName}
                  defaultValue={deferredName}
                  placeholder="Nhập họ tên đầy đủ, vd: 'Nguyen Van A'"
                  w={{ md: "50%", xs: "100%" }}
                  textAlign="center"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                     setName(e.target.value)
                  }
               />
            </Box>
            <Box bg="gray.50">
               <Input
                  autoFocus
                  type="date"
                  placeholder="Ngày tháng năm sinh"
                  w={{ md: "50%", xs: "100%" }}
                  defaultValue={moment().format("YYYY-MM-DD")}
                  textAlign="center"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                     setBirth(e.target.value)
                  }
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
               borderRadius={5}
            >
               <Box as="legend" fontSize={20} fontWeight={800} color="red.400">
                  Chỉ Số
               </Box>

               <Wrap spacing="10px" justify="center" pb={2}>
                  {data.map((item, index: number) => (
                     <RenderItem key={id + index} item={item} />
                  ))}
               </Wrap>
            </Box>
         </Box>
      </Box>
   );
};
