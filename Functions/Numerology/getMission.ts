import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "../";
export const getMission = (strArray: string[]): number => {
   let sum = 0;
   for (const name of strArray) {
      sum += getValueInAlphabets(name);
   }
   const strSum = sum.toString().split("");
   const str1 = strSum[0];
   const str2 = strSum.splice(1, strSum.length - 1).toString();

   return sumAdjacent(str1, str2);
};
