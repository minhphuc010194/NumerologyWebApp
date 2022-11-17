import {
   FC,
   useId,
   useRef,
   useState,
   ChangeEvent,
   useDeferredValue,
} from "react";
import {
   Box,
   Wrap,
   Input,
   VStack,
   Heading,
   InputDate,
   useColorModeValue,
} from "../";
import { Numerology as NumerologyTxt } from "../../Utils/constaints";
import { RenderItem } from "./RenderItem";
import { useProcessNumerology } from "../../Hooks";

export const Numerology: FC = () => {
   const id = useId();
   const color = useColorModeValue("black", "gray.500");
   const refInputName = useRef<HTMLInputElement>(null);
   const [name, setName] = useState<string>("Lê Phạm Thanh Nga");
   const [birth, setBirth] = useState<string>("1982-10-12");
   const deferredName = useDeferredValue(name);
   const deferredBirth = useDeferredValue(birth);
   const data = useProcessNumerology(deferredName, deferredBirth);

   // console.log(birth);
   return (
      <Box>
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
                  placeholder="Your full name, ex: 'Nguyen Van A'"
                  w={{ md: "50%", xs: "100%" }}
                  textAlign="center"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                     setName(e.target.value)
                  }
                  color={color}
               />
            </Box>
            {/* <Box bg="gray.50">
               <Input
                  type="date"
                  placeholder="Ngày tháng năm sinh"
                  w={{ md: "50%", xs: "100%" }}
                  defaultValue={moment(birth).format("YYYY-MM-DD")}
                  textAlign="center"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                     setBirth(e.target.value)
                  }
               />
            </Box> */}
            <Box bg="gray.50">
               <InputDate
                  getValue={(date) => setBirth(date)}
                  defaultValue={birth}
                  color={color}
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
                  Index (Chỉ Số)
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
