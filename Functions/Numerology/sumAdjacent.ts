// cong 2 so lien ke
export function sumAdjacent(
   strFirst: string | number,
   strNext: string | number
): number {
   const sumDate = Number(strFirst) + Number(strNext);
   if (sumDate >= 10) {
      const strSumDate = String(sumDate).split("");
      return sumAdjacent(strSumDate[0], strSumDate?.[1]);
   }
   return sumDate;
}
