import { Data_numbers_Alphabets } from "../../data/mooks";

export const getValueInAlphabets = (charactor: string): number => {
   let value = 0;
   for (const itemAplpabet of Data_numbers_Alphabets) {
      const itemCheck = itemAplpabet.key.indexOf(charactor);
      if (itemCheck >= 0) {
         value = itemAplpabet.value;
         return value;
      }
   }
   return value;
};
