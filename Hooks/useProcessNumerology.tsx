import { useMemo } from "react";
import { getMission, getWalksOfLife } from "../Functions";

export const useProcessNumerology = (fullName: string, birthDay: string) => {
   const data = useMemo(() => {
      const txtName = fullName.trim();
      const walksOfLife = getWalksOfLife(birthDay);
      const mission = getMission(txtName);
      return {
         walksOfLife,
         mission,
      };
   }, [fullName, birthDay]);
   return data;
};
