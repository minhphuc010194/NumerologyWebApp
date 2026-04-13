"use client";

import { useTranslations } from "next-intl";
import { type FC, useRef, useState, useEffect, useCallback, type ChangeEvent } from "react";
import { Input, InputGroup, useToast } from "./";
import { InputProps } from "../utils/types";

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
   const t = useTranslations("InputDate");
   const { getValue, defaultValue = "", ...rest } = props;
   const refDate = useRef<HTMLInputElement>(null);
   const refMonth = useRef<HTMLInputElement>(null);
   const refYear = useRef<HTMLInputElement>(null);
   const toast = useToast();
   const initialValues = parseDefaultValue(defaultValue);
   const [date, setDate] = useState<string>(initialValues.date);
   const [month, setMonth] = useState<string>(initialValues.month);
   const [year, setYear] = useState<string>(initialValues.year);

   // Stable ref for getValue to avoid inline function issues
   const getValueRef = useRef(getValue);
   getValueRef.current = getValue;

   // Notify parent with composed date string
   const notifyParent = useCallback((d: string, m: string, y: string) => {
      const currentDate = y + "-" + m + "-" + d;
      if (typeof getValueRef.current === "function") {
         getValueRef.current(currentDate);
      }
   }, []);

   // Sync from parent's defaultValue (e.g., profile switch)
   // Only fires on external change, does NOT call getValue back
   const prevDefaultValueRef = useRef(defaultValue);
   useEffect(() => {
      if (defaultValue && defaultValue !== prevDefaultValueRef.current) {
         prevDefaultValueRef.current = defaultValue;
         const parsed = parseDefaultValue(defaultValue);
         setDate(parsed.date);
         setMonth(parsed.month);
         setYear(parsed.year);
         // NOT calling notifyParent here — parent already knows this value
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [defaultValue]);

   return (
      <InputGroup>
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               const newDate = value || "01";
               setDate(newDate);
               notifyParent(newDate, month, year);
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
            placeholder={t("datePlaceholder")}
            {...rest}
         />
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               const newMonth = value || "01";
               setMonth(newMonth);
               notifyParent(date, newMonth, year);
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
            placeholder={t("monthPlaceholder")}
            min={1}
            max={12}
            {...rest}
         />
         <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               const newYear = value || "1982";
               setYear(newYear);
               notifyParent(date, month, newYear);
            }}
            onFocus={(e) => e.target.select()}
            ref={refYear}
            defaultValue={year}
            textAlign="center"
            type="number"
            placeholder={t("yearPlaceholder")}
            {...rest}
         />
      </InputGroup>
   );
};
