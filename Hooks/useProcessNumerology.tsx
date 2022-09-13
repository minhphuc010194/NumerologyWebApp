import { useMemo } from "react";
import { getWalksOfLife } from "../Functions";

export const useProcessNumerology = (fullName: string, birthDay: string) => {
   //    console.log(fullName, birthDay);
   const data = useMemo(() => {
      const txtName = fullName.trim();
      const walksOfLife = getWalksOfLife(birthDay);

      return {
         walksOfLife,
      };
   }, [fullName, birthDay]);
   return data;
};
