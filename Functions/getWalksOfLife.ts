import moment from "moment";
export const getWalksOfLife = (
   birthDay: string = new Date().toISOString()
): number => {
   const date = moment(birthDay).format("DD").split(""); // Array string
   const month = moment(birthDay).format("MM");
   const year = moment(birthDay).format("YYYY");
   console.log(date, month, year);
   let sumAll = 0;
   let sumDate = sumAdjacent(date[0], date[1]);

   return sumAll;
};

// cong 2 so lien ke
function sumAdjacent(strFirst: string, strNext: string): number {
   let num = 0;
   const sumDate = "spending";
   return num;
}
