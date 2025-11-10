"use client";

import { type FC, useRef, useState, useEffect, type ChangeEvent } from "react";
import { Input, InputGroup, useToast } from "./";
import { InputProps } from "../Utils/types";

type PropTypes = InputProps & {
   // eslint-disable-next-line no-unused-vars
   getValue?: (dateTime: string) => void;
   //    value?: string;
   defaultValue?: string;
};

const parseDefaultValue = (defaultValue: string) => {
   if (defaultValue) {
      const splitDate = defaultValue.split("-");
      if (splitDate.length === 3) {
         return {
            date: splitDate[2] || "01",
            month: splitDate[1] || "01",
            year: splitDate[0] || "1982",
         };
      }
   }
   return { date: "01", month: "01", year: "1982" };
};

export const InputDate: FC<PropTypes> = (props) => {
   const { getValue, defaultValue = "", ...rest } = props;
   const refDate = useRef<HTMLInputElement>(null);
   const refMonth = useRef<HTMLInputElement>(null);
   const refYear = useRef<HTMLInputElement>(null);
   const toast = useToast();
   const initialValues = parseDefaultValue(defaultValue);
   const [date, setDate] = useState<string>(initialValues.date);
   const [month, setMonth] = useState<string>(initialValues.month);
   const [year, setYear] = useState<string>(initialValues.year);

   useEffect(() => {
      if (defaultValue) {
         const parsed = parseDefaultValue(defaultValue);
         setDate(parsed.date);
         setMonth(parsed.month);
         setYear(parsed.year);
      }
   }, [defaultValue]);

   useEffect(() => {
      const currentDate = year + "-" + month + "-" + date;
      if (typeof getValue === "function") {
         getValue(currentDate);
      }
   }, [date, month, year, getValue]);

   return (
      <InputGroup>
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               setDate(value || "01");
               // auto select to month
               if (value.length >= 2) {
                  refMonth.current?.select();
               }
            }}
            onFocus={(e) => e.target.select()}
            ref={refDate}
            textAlign="center"
            type="number"
            defaultValue={date}
            min={1}
            max={31}
            placeholder="Date(ngày sinh)..."
            {...rest}
         />
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               setMonth(value || "01");
               // auto select to year
               if (value.length >= 2) {
                  refYear.current?.select();
               }
            }}
            onFocus={(e) => e.target.select()}
            ref={refMonth}
            type="number"
            defaultValue={month}
            textAlign="center"
            placeholder="Month(tháng sinh)..."
            min={1}
            max={12}
            {...rest}
         />
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               setYear(value || "1982");
            }}
            onFocus={(e) => e.target.select()}
            ref={refYear}
            defaultValue={year}
            textAlign="center"
            type="number"
            placeholder="Year(năm sinh)..."
            {...rest}
         />
      </InputGroup>
   );
};
