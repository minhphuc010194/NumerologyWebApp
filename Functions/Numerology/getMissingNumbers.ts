import _ from "lodash";
import { Data_numbers_Alphabets } from "../../data/mooks";
import { getValueInAlphabets } from "./getValueInAlphabets";
export const getMissingNumbers = (arrNameString: string[]) => {
   let arrNumer: number[] = [];
   arrNameString.map((str) => {
      const getNumer = getValueInAlphabets(str);
      arrNumer.push(getNumer);
   });
   const groupNumer = _.groupBy(arrNumer);
   Data_numbers_Alphabets;
   const deficits = Data_numbers_Alphabets.filter((item) => {
      const checkExist = Object.keys(groupNumer).indexOf(item.value.toString());
      return checkExist < 0;
   });
   return deficits;
};
