import { sumAdjacent } from "./sumAdjacent";

// cong 2 so lien ke
export function substractAdjacent(
   strFirst: string | number,
   strNext: string | number
): number {
   const substractDate = Number(strFirst) - Number(strNext);
   if (substractDate >= 10) {
      const strSubstractDate = String(substractDate).split("");
      const str1 = strSubstractDate[0];
      const str2 = strSubstractDate
         .splice(1, strSubstractDate.length - 1)
         .toString()
         .replace(/\,/g, "");
      return sumAdjacent(str1, str2);
   }
   return Math.abs(substractDate);
}
