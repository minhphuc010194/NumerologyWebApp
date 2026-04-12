import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "../";
export const getMission = (fullName: string): number => {
   if (!fullName.trim()) return 0;
   const arr = fullName.replace(/\s/g, "").split("");
   let sum = 0;

   for (const charactor of arr) {
      sum += getValueInAlphabets(charactor);
   }

   return sumAdjacent(sum, 0, "mission");
};
