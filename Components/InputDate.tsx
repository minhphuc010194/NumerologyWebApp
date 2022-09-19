import { FC, useRef, useEffect } from "react";
import { Input, InputGroup } from "./";

type PropTypes = {
   // eslint-disable-next-line no-unused-vars
   getValue?: (dateTime: string) => void;
   //    value?: string;
   defaultValue?: string;
};
export const InputDate: FC<PropTypes> = (props) => {
   const { getValue, defaultValue = "" } = props;
   const refDate = useRef<HTMLInputElement>(null);
   const refMonth = useRef<HTMLInputElement>(null);
   const refYear = useRef<HTMLInputElement>(null);

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
   }, [defaultValue]);

   const handleChange = () => {
      const date: string = refDate.current?.value ?? "";
      const month: string = refMonth.current?.value ?? "";
      const year: string = refYear.current?.value ?? "";

      if (date.length >= 2) {
         refMonth.current?.select();
      }
      if (month.length >= 2) {
         refYear.current?.select();
      }
      console.log(date, month, year);
      if (typeof getValue === "function") {
         getValue(year + "-" + month + "-" + date);
      }
   };
   return (
      <InputGroup>
         <Input
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            ref={refDate}
            textAlign="center"
            type="number"
            defaultValue={1}
            min={1}
            max={31}
         />
         <Input
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            ref={refMonth}
            type="number"
            defaultValue={1}
            textAlign="center"
            min={1}
            max={12}
         />
         <Input
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            ref={refYear}
            defaultValue={1982}
            textAlign="center"
            type="number"
         />
      </InputGroup>
   );
};
