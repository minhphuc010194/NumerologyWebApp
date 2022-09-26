// cong 2 so lien ke
export function sumAdjacent(
   strFirst: string | number,
   strNext: string | number,
   flagNumerology?: "walksOfLife"
): number {
   const sumDate = Number(strFirst) + Number(strNext);
   if (sumDate >= 10) {
      if (
         flagNumerology === "walksOfLife" &&
         (sumDate === 10 || sumDate === 11 || sumDate === 22)
      ) {
         return sumDate;
      }
      const strSumDate = String(sumDate).split("");
      const str1 = strSumDate[0];
      const str2 = strSumDate
         .splice(1, strSumDate.length - 1)
         .toString()
         .replace(/\,/g, "");

      return sumAdjacent(str1, str2);
   }
   return sumDate;
}
