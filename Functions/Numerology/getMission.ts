import { removeAccents, sumAdjacent } from "../";
import { Data_numbers_Alphabets } from "../../data/mooks";
export const getMission = (fullName: string): number => {
   const name = removeAccents(fullName.toLocaleUpperCase());
   const arrName = name.replace(/\s/g, "").split("");
   let sum = 0;
   for (const name of arrName) {
      for (const itemAplpabet of Data_numbers_Alphabets) {
         const itemCheck = itemAplpabet.key.indexOf(name);
         if (itemCheck >= 0) {
            sum += itemAplpabet.value;
         }
      }
   }
   const strSum = sum.toString().split("");
   return sumAdjacent(strSum[0], strSum[strSum.length - 1]);
};
