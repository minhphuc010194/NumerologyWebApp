// cong 2 so lien ke
export function sumAdjacent(
   strFirst: string | number,
   strNext: string | number
): number {
   const sumDate = Number(strFirst) + Number(strNext);
   if (sumDate >= 10) {
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
