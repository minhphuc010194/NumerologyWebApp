import { getValueInAlphabets } from "./getValueInAlphabets";

type GroupType = { [key: string]: number };
export const getPassion = (strArray: string[]): number | string => {
   const group: GroupType = {};
   strArray.map((a) => {
      if (a in group) group[a]++;
      else group[a] = 1;
   });

   return getMax(group);
};

type ItemMaxType = {
   name: string;
   value: number;
   maxNumber: number;
};
function getMax(group: GroupType): string | number {
   let max = 0;

   const arrMax: ItemMaxType[] = [];
   Object.keys(group).map((fieldName) => {
      const count = group[fieldName];
      if (count >= max) {
         max = count;
         const valueMax: ItemMaxType = {
            name: "",
            value: 0,
            maxNumber: 0,
         };
         valueMax.maxNumber = count;
         valueMax.name = fieldName;
         valueMax.value = getValueInAlphabets(fieldName);
         arrMax.push(valueMax);
      }
   });

   if (max === 1) return 0;
   let strPassion = "";
   arrMax.map((item) => {
      if (item.maxNumber === max) {
         strPassion += ` ${item.value} `;
      }
   });
   // console.log(arrMax);
   return strPassion;
}
