import { DataConsonants } from "../../data/mooks";
import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "./sumAdjacent";
export const getPersonality = (strArray: string[]): number => {
   const soulNumber = strArray.reduce(
      (prevValue: number, currentValue: string) => {
         const isConsonant = DataConsonants.indexOf(currentValue) >= 0;
         if (isConsonant) {
            return prevValue + getValueInAlphabets(currentValue);
         }
         return prevValue;
      },
      0
   );
   return sumAdjacent(soulNumber, 0);
};
