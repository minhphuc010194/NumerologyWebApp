import _ from "lodash";
import { getValueInAlphabets } from "./getValueInAlphabets";

type GroupType = { [key: string]: number[] };
export const getPassion = (strArray: string[]): number | string => {
   const arrNum: number[] = [];
   strArray.map((a) => {
      arrNum.push(getValueInAlphabets(a));
   });
   const group: GroupType = _.groupBy(arrNum);
   return getMax(group);
};

type ItemMaxType = {
   name: string;
   value: number;
};
function getMax(group: GroupType): string | number {
   let max = 0;
   let arrMax: ItemMaxType[] = [];

   Object.keys(group).map((num) => {
      if (group[num].length >= max) {
         max = group[num].length;
         arrMax.push({ name: num, value: Number(group[num].length) });
      }
   });

   if (max === 1) return 0;
   let strPassion = "";

   arrMax.map((item) => {
      if (item.value === max) {
         strPassion += ` ${item.name} `;
      }
   });
   return strPassion;
}
