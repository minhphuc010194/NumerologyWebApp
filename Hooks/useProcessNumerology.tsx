import { useMemo } from "react";
import {
   getMission,
   getWalksOfLife,
   getSoul,
   removeAccents,
} from "../Functions";

export const useProcessNumerology = (fullName: string, birthDay: string) => {
   const data = useMemo(() => {
      const txtName = fullName.trim();
      const walksOfLife = getWalksOfLife(birthDay);

      const name = removeAccents(txtName.toLocaleUpperCase());
      const arrName = name.replace(/\s/g, "").split("");
      const mission = getMission(arrName);
      const soul = getSoul(arrName);
      const connect = Math.abs(walksOfLife - mission);
      return {
         walksOfLife,
         mission,
         soul,
         connect,
      };
   }, [fullName, birthDay]);
   return data;
};
