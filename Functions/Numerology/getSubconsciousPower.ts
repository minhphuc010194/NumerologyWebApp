import { Data_numbers_Alphabets } from "../../data/mooks";
export const getSubconsciousPower = (arrString: string[]) => {
   let value: string[] = [];
   for (const itemAplpabet of Data_numbers_Alphabets) {
      for (const charactor of itemAplpabet.key) {
         const itemCheck = arrString.indexOf(charactor);
         if (itemCheck < 0) {
            const checkExistValue = value.indexOf(String(itemAplpabet.value));
            // console.log(checkExistValue);
            if (checkExistValue < 0) {
               value.push(String(itemAplpabet.value));
            }
         }
      }
   }
   //    console.log(value);
   return "";
   //    arrString.map((str) => {
   //       value += getValueNotInAlphabets(str).toString();
   //    });
   //    console.log(value);
   //    return 9 - value.split("").length;
};
