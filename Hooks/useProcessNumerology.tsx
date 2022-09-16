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
} from "../Functions";
import moment from "moment";

export const useProcessNumerology = (
   fullName: string,
   birthDay: string
): NumerologyHookType[] => {
   const data = useMemo(() => {
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
      const missingNumber = getMissingNumbers(arrName);
      const subconsciousPower = 9 - missingNumber.length;
      const rationalThinking = getRationalThinking(
         completedName,
         moment(birthDay).format("DD")
      );
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
            value: missingNumber.map((item) => item.value + " "),
            name: "Số thiếu",
         },
         {
            key: "rationalThinking",
            value: rationalThinking,
            name: "Tư duy lý trí",
         },
      ];
   }, [fullName, birthDay]);
   return data;
};
