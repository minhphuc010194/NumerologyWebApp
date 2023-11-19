"use client";

import moment from "moment";
import { type FC, useRef, useEffect, type ChangeEvent } from "react";
import { Input, InputGroup, useToast } from "./";
import { InputProps } from "../Utils/types";

type PropTypes = InputProps & {
   // eslint-disable-next-line no-unused-vars
   getValue?: (dateTime: string) => void;
   //    value?: string;
   defaultValue?: string;
};
export const InputDate: FC<PropTypes> = (props) => {
   const { getValue, defaultValue = "", ...rest } = props;
   const refDate = useRef<HTMLInputElement>(null);
   const refMonth = useRef<HTMLInputElement>(null);
   const refYear = useRef<HTMLInputElement>(null);
   const toast = useToast();

   useEffect(() => {
      if (
         defaultValue &&
         refDate.current &&
         refMonth.current &&
         refYear.current
      ) {
         const splitDate = defaultValue.split("-");
         refDate.current.value = splitDate[2];
         refMonth.current.value = splitDate[1];
         refYear.current.value = splitDate[0];
      }
   }, []);

   const handleChange = () => {
      const date = !!(refDate.current?.value ?? "")
         ? refDate.current?.value
         : "01";
      const month = !!(refMonth.current?.value ?? "")
         ? refMonth.current?.value
         : "01";
      let year = !!(refYear.current?.value ?? "")
         ? refYear.current?.value
         : "1982";

      if (typeof getValue === "function") {
         if ((year?.length ?? 0) < 3) {
            year += "00";
         }
         const currentDate = moment(year + "-" + month + "-" + date).format(
            "YYYY-MM-DD"
         );
         if (currentDate === "Invalid date") {
            return toast({
               status: "warning",
               title: "Sai định dạng ngày, tháng, năm",
               description: `Vui lòng kiểm tra lại định dạng vừa nhập (giá trị hiện tại ${
                  date + "-" + month + "-" + year
               } chưa chính xác)`,
               duration: 3000,
               position: "bottom",
               isClosable: true,
            });
         }
         getValue(currentDate);
      }
   };

   return (
      <InputGroup>
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               // auto select to month
               if (value.length >= 2) {
                  refMonth.current?.select();
               }
               handleChange();
            }}
            onFocus={(e) => e.target.select()}
            ref={refDate}
            textAlign="center"
            type="number"
            defaultValue={1}
            min={1}
            max={31}
            placeholder="Date(ngày sinh)..."
            {...rest}
         />
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               // auto select to year
               if (value.length >= 2) {
                  refYear.current?.select();
               }
               handleChange();
            }}
            onFocus={(e) => e.target.select()}
            ref={refMonth}
            type="number"
            defaultValue={1}
            textAlign="center"
            placeholder="Month(tháng sinh)..."
            min={1}
            max={12}
            {...rest}
         />
         <Input
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            ref={refYear}
            defaultValue={1982}
            textAlign="center"
            type="number"
            placeholder="Year(năm sinh)..."
            {...rest}
         />
      </InputGroup>
   );
};
