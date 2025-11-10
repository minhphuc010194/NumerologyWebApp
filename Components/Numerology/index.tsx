"use client";
import {
   type FC,
   useId,
   useRef,
   useState,
   ChangeEvent,
   FormEvent,
   useCallback,
   useEffect,
} from "react";
import {
   Box,
   Wrap,
   Input,
   VStack,
   InputDate,
   Button,
   FormControl,
   FormErrorMessage,
   useColorModeValue,
} from "Components";
import { RenderItem } from "./RenderItem";
import { useProcessNumerology } from "Hooks";
import moment from "moment";

const NumerologyComponent: FC = () => {
   const id = useId();
   const color = useColorModeValue("black", "white");
   const colorBorder = useColorModeValue("gray.200", "gray.600");
   const errorColor = useColorModeValue("red.500", "red.400");
   const refInputName = useRef<HTMLInputElement>(null);
   const [localName, setLocalName] = useState<string>("Dương Văn Nghĩa");
   const [localBirth, setLocalBirth] = useState<string>("1976-06-11");
   const [submittedName, setSubmittedName] =
      useState<string>("Dương Văn Nghĩa");
   const [submittedBirth, setSubmittedBirth] = useState<string>("1976-06-11");
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const [birthError, setBirthError] = useState<string>("");
   const [isMounted, setIsMounted] = useState<boolean>(false);
   const data = useProcessNumerology(submittedName, submittedBirth);

   useEffect(() => {
      setIsMounted(true);
   }, []);

   const formatBirthDate = useCallback((birthDate: string): string => {
      if (!birthDate || !birthDate.trim()) {
         return "";
      }

      const parts = birthDate.split("-");
      if (parts.length !== 3) {
         return birthDate;
      }

      const [year, month, date] = parts;
      const paddedYear = year.padStart(4, "0");
      const paddedMonth = month.padStart(2, "0");
      const paddedDate = date.padStart(2, "0");

      return `${paddedYear}-${paddedMonth}-${paddedDate}`;
   }, []);

   const validateBirthDate = useCallback(
      (birthDate: string): string => {
         if (!birthDate || !birthDate.trim()) {
            return "Vui lòng nhập ngày sinh";
         }

         const datePattern = /^\d{4}-\d{2}-\d{2}$/;
         if (!datePattern.test(birthDate)) {
            return "Định dạng ngày sinh không hợp lệ. Vui lòng nhập theo định dạng YYYY-MM-DD";
         }

         if (!isMounted) {
            return "";
         }

         const date = moment(birthDate, "YYYY-MM-DD", true);
         if (!date.isValid()) {
            return "Ngày sinh không hợp lệ";
         }

         const today = moment();
         if (date.isAfter(today)) {
            return "Ngày sinh không được ở tương lai";
         }

         const minYear = 1900;
         const maxYear = moment().year();
         const year = date.year();
         if (year < minYear || year > maxYear) {
            return `Năm sinh phải từ ${minYear} đến ${maxYear}`;
         }

         return "";
      },
      [isMounted]
   );

   const handleSubmit = useCallback(
      async (e: FormEvent) => {
         e.preventDefault();

         const formattedBirth = formatBirthDate(localBirth);
         const error = validateBirthDate(formattedBirth);
         if (error) {
            setBirthError(error);
            return;
         }

         setBirthError("");
         setIsLoading(true);

         try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            setSubmittedName(localName.trim());
            setSubmittedBirth(formattedBirth);
         } finally {
            setIsLoading(false);
         }
      },
      [localName, localBirth, formatBirthDate, validateBirthDate]
   );
   return (
      <Box>
         <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={3} align="stretch">
               <Box h="40px">
                  <Input
                     autoFocus={isMounted}
                     rounded={50}
                     onClick={() => refInputName.current?.select()}
                     ref={refInputName}
                     value={localName}
                     placeholder="Your full name, ex: 'Nguyen Van A'"
                     w={{ md: "50%", xs: "100%" }}
                     textAlign="center"
                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setLocalName(e.target.value)
                     }
                     color={color}
                  />
               </Box>

               <FormControl isInvalid={!!birthError}>
                  <Box>
                     <InputDate
                        rounded={50}
                        getValue={(date) => {
                           setLocalBirth(date);
                        }}
                        defaultValue={localBirth}
                        color={color}
                     />
                  </Box>
                  {birthError && (
                     <FormErrorMessage
                        mt={1}
                        fontSize="sm"
                        textAlign="center"
                        justifyContent="center"
                     >
                        {birthError}
                     </FormErrorMessage>
                  )}
               </FormControl>

               <Box textAlign="center" py={2}>
                  <Button
                     type="submit"
                     colorScheme="orange"
                     size="md"
                     w={{ md: "50%", xs: "100%" }}
                     borderRadius="full"
                     fontSize="md"
                     fontWeight={700}
                     isLoading={isLoading}
                     loadingText="Đang xử lý..."
                     disabled={isLoading}
                     _hover={{
                        transform: isLoading ? "none" : "translateY(-2px)",
                        boxShadow: isLoading ? "md" : "lg",
                     }}
                     _active={{
                        transform: "translateY(0)",
                     }}
                     _disabled={{
                        opacity: 0.6,
                        cursor: "not-allowed",
                     }}
                     transition="all 0.2s"
                  >
                     Xem kết quả (View result)
                  </Button>
               </Box>
            </VStack>
         </Box>

         <Box
            py={4}
            px={2}
            as="fieldset"
            textAlign="center"
            borderRadius={5}
            border="1px solid"
            borderColor={colorBorder}
         >
            <Box as="legend" fontSize={20} fontWeight={800} color="red.400">
               Chỉ Số (Index)
            </Box>

            <Wrap spacing="10px" justify="center" pb={2}>
               {data.map((item, index: number) => (
                  <RenderItem key={id + index} item={item} />
               ))}
            </Wrap>
         </Box>
      </Box>
   );
};

// React 19 compatible component type - workaround for FC type incompatibility
// Using any type to bypass React 19 JSX type strictness
export const Numerology: any = NumerologyComponent;
