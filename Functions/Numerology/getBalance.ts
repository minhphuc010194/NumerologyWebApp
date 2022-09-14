import { getValueInAlphabets } from "./getValueInAlphabets";
import { sumAdjacent } from "./sumAdjacent";

export const getBalance = (completedName: string) => {
   const strArrayName = completedName.split(" ");
   let balance = 0;
   strArrayName.map((str) => {
      const startChar = str.charAt(0);
      balance += getValueInAlphabets(startChar);
   });
   const strSum = balance.toString().split("");
   const str1 = strSum[0];
   const str2 = strSum
      .splice(1, strSum.length - 1)
      .toString()
      .replace(/\,/g, "");

   return sumAdjacent(str1, str2);
};
