import { sumAdjacent } from "./sumAdjacent";

// cong 2 so lien ke
export function substractAdjacent(
   strFirst: string | number,
   strNext: string | number
): number {
   const sumStrFirst = sumAdjacent(strFirst, 0);
   const sumStrNext = sumAdjacent(strNext, 0);

   const substractDate = Math.abs(sumStrFirst - sumStrNext);

   if (substractDate >= 10) {
      const strSubstractDate = String(substractDate).split("");

      const separate = Math.floor(strSubstractDate.length / 2);
      const str1 = strSubstractDate
         .slice(0, separate)
         .toString()
         .replace(/\,/g, "");
      const str2 = strSubstractDate
         .slice(separate, strSubstractDate.length)
         .toString()
         .replace(/\,/g, "");
      const sum = sumAdjacent(str1, str2);

      return sum;
   }
   return substractDate;
}
