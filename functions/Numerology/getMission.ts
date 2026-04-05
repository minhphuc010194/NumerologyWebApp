import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "../";
export const getMission = (fullName: string): number => {
   if (!fullName.trim()) return 0;
   const arrStrs = fullName.split(" ");
   let sum = 0;

   arrStrs.map((arrStr) => {
      const arr = arrStr.replace(/\s/g, "").split("");
      let sumCharactor = 0;
      for (const charactor of arr) {
         sumCharactor = sumAdjacent(
            sumCharactor,
            getValueInAlphabets(charactor)
         );
      }
      sum += sumCharactor;
   });

   return sumAdjacent(sum, 0, "mission");
};
