// cong 2 so lien ke
export function sumAdjacent(
   strFirst: string | number,
   strNext: string | number,
   flagNumerology?:
      | "walksOfLife"
      | "mission"
      | "soul"
      | "mature"
      | "finalWay"
      | "connect"
): number {
   const sumDate = Number(strFirst) + Number(strNext);
   const joinStrDate = String(strFirst) + String(strNext);
   const checkIsMaster = joinStrDate === "11" || joinStrDate === "22";
   const flagMaster =
      flagNumerology === "walksOfLife" ||
      flagNumerology === "mission" ||
      flagNumerology === "soul" ||
      flagNumerology === "mature" ||
      flagNumerology === "finalWay";
   if (flagMaster && checkIsMaster) return Number(joinStrDate);
   if (flagNumerology === "finalWay" && sumDate === 11)
      return Number(joinStrDate);
   if (sumDate >= 10) {
      if (sumDate === 10 || sumDate === 11 || sumDate === 22) {
         return sumDate;
      }
      const strSumDate = String(sumDate).split("");
      const str1 = strSumDate[0];
      const str2 = strSumDate
         .splice(1, strSumDate.length - 1)
         .join("");

      return sumAdjacent(str1, str2, flagNumerology);
   }
   return sumDate;
}
