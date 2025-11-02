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
            const isVowel = DataVowels.indexOf(currentValue) >= 0;
            if (isVowel && currentValue !== "Y") {
               return prevValue + getValueInAlphabets(currentValue);
            } else if (currentValue === "Y") {
               const prevY = DataVowels.indexOf(strArray[index - 1]) >= 0;
               const nextY = DataVowels.indexOf(strArray[index + 1]) >= 0;
               return (
                  prevValue +
                  (!prevY && !nextY ? getValueInAlphabets(currentValue) : 0)
               );
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
