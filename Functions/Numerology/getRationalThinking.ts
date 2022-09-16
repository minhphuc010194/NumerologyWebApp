import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "./sumAdjacent";

export const getRationalThinking = (fullName: string, dateOfBirth: string) => {
   const fullNameArray = fullName.split(" ");
   const firstNameArray = fullNameArray[fullNameArray.length - 1].split("");
   let sum = 0;
   firstNameArray.map((charactor) => {
      sum += getValueInAlphabets(charactor);
   });

   sum += Number(dateOfBirth);
   const strSum = sum.toString().split("");
   const str1 = strSum[0];
   const str2 = strSum.splice(1, strSum.length - 1).toString();
   return sumAdjacent(str1, str2);
};
