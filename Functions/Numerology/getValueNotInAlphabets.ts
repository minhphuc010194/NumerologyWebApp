import { Data_numbers_Alphabets } from "../../data/mooks";

export const getValueNotInAlphabets = (charactors: string[]): number => {
   let value = 0;
   for (const itemAplpabet of Data_numbers_Alphabets) {
      for (const charactor of itemAplpabet.key) {
         const itemCheck = charactors.indexOf(charactor);
         if (itemCheck < 0) {
            value = itemAplpabet.value;
            return value;
         }
      }
   }
   return value;
};
