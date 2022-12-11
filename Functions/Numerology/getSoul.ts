import { DataVowels } from "../../data/mooks";
import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "./sumAdjacent";

export const getSoul = (fullName: string): number => {
   if (!fullName?.trim()) return 0;
   const splitName = fullName.split(" ");
   // console.log(splitName);
   // const strArray = fullName.replace(/\s/g, "").split("");
   let soulNumber = 0;
   splitName.map((strs) => {
      const strArray = strs.replace(/\s/g, "").split("");

      soulNumber += strArray.reduce(
         (prevValue: number, currentValue: string, index: number) => {
            const isVowel =
               DataVowels.indexOf(currentValue) >= 0 ||
               (currentValue === "Y" && index === strArray.length - 1);
            if (isVowel) {
               return prevValue + getValueInAlphabets(currentValue);
            }
            return prevValue;
         },
         0
      );
   });
   const strSum = soulNumber.toString().split("");
   const str1 = strSum[0];
   const str2 = strSum.splice(1, strSum.length - 1).toString();
   return sumAdjacent(str1, str2, "soul");
};
