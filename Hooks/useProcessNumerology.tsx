import { useMemo } from "react";
import { NumerologyHookType } from "../Utils/types";
import {
   getSoul,
   getMission,
   getWalksOfLife,
   removeAccents,
   getPersonality,
   getPassion,
   sumAdjacent,
   getBalance,
   getMissingNumbers,
   getRationalThinking,
   substractAdjacent,
} from "../Functions";
import moment from "moment";

export const useProcessNumerology = (
   fullName: string,
   birthDay: string
): NumerologyHookType[] => {
   const data = useMemo(() => {
      const date = moment(birthDay).format("DD");
      const month = moment(birthDay).format("MM");
      const year = moment(birthDay).format("YYYY");
      const currentYear = moment().format("YYYY");
      const currentMonth = moment().format("MM");
      const txtName = fullName.trim();
      const name = removeAccents(txtName.toLocaleUpperCase());
      let completedName: string = "";
      const arrStrName = name.split("");
      arrStrName.map((char, index) => {
         if (
            (char === " " && arrStrName?.[index + 1] !== " ") ||
            char !== " "
         ) {
            completedName += char;
         }
      });

      const arrName = name.replace(/\s/g, "").split("");

      const walksOfLife = getWalksOfLife(birthDay);
      const mission = getMission(arrName);
      const soul = getSoul(arrName);
      const connect = Math.abs(walksOfLife - mission);
      const personality = getPersonality(arrName);
      const passion = getPassion(arrName);
      const mature = sumAdjacent(walksOfLife, mission); // walksOfLife + mission; 36 - walksOfLife = đỉnh đầu của chặng đầu tiên
      const balance = getBalance(completedName);
      const missingNumber = getMissingNumbers(arrName).map(
         (item) => item.value
      );
      const subconsciousPower = 9 - missingNumber.length;
      const rationalThinking = getRationalThinking(completedName, date);
      const way1 = sumAdjacent(month, date),
         way2 = sumAdjacent(year, date);
      const way3 = sumAdjacent(way1, way2),
         way4 = sumAdjacent(month, year);
      const way = ` ${way1} ${way2} ${way3} ${way4}`;
      const challenge1 = substractAdjacent(month, date);
      const challenge2 = substractAdjacent(year, date);
      const challenge3 = Math.abs(challenge1 - challenge2);
      const challenge4 = substractAdjacent(month, year);
      const challenges = ` ${challenge1} ${challenge2} ${challenge3} ${challenge4}`;
      const yearDividual = sumAdjacent(Number(currentYear), date + month);
      const monthDividual = sumAdjacent(yearDividual, Number(currentMonth));

      return [
         { key: "walksOfLife", value: walksOfLife, name: "Đường đời" },
         { key: "mission", value: mission, name: "Sứ mệnh" },
         { key: "soul", value: soul, name: "Linh hồn" },
         { key: "connect", value: connect, name: "Kết nối" },
         { key: "personality", value: personality, name: "Nhân cách" },
         { key: "passion", value: passion, name: "Đam mê" },
         { key: "mature", value: mature, name: "Trưởng thành" },
         { key: "balance", value: balance, name: "Cân bằng" },
         {
            key: "subconsciousPower",
            value: subconsciousPower,
            name: "Sức mạnh tiềm thức",
         },
         {
            key: "missingNumbers",
            value: missingNumber.toString().replace(/\,/g, " "),
            name: "Số thiếu",
         },
         {
            key: "rationalThinking",
            value: rationalThinking,
            name: "Tư duy lý trí",
         },
         {
            key: "way",
            value: way,
            name: "Chặng",
         },
         {
            key: "challenges",
            value: challenges,
            name: "Thách thức",
         },
         {
            key: "yearIndividual",
            value: yearDividual,
            name: "Năm cá nhân",
         },
         {
            key: "monthIndividual",
            value: monthDividual,
            name: "Tháng cá nhân",
         },
      ];
   }, [fullName, birthDay]);
   return data;
};
