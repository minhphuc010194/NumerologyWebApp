import { useMemo } from "react";
import { NumerologyHookType } from "../Utils/types";
import {
   getSoul,
   getBalance,
   getMission,
   getPassion,
   sumAdjacent,
   removeAccents,
   getWalksOfLife,
   getPersonality,
   getMissingNumbers,
   substractAdjacent,
   getRationalThinking,
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
      const mission = getMission(name);
      const soul = getSoul(name);
      const resumWalksOfLife = String(walksOfLife).split("");
      const resumMission = String(mission).split("");
      const connect = Math.abs(
         sumAdjacent(resumWalksOfLife[0], resumWalksOfLife?.[1] ?? 0) -
            sumAdjacent(resumMission[0], resumMission?.[1] ?? 0)
         // walksOfLife - mission
      );
      const personality = getPersonality(arrName);
      const passion = getPassion(arrName);

      const mature = sumAdjacent(walksOfLife, mission, "mature"); // walksOfLife + mission; 36 - walksOfLife = đỉnh đầu của chặng đầu tiên
      const balance = getBalance(completedName);
      const missingNumber = getMissingNumbers(arrName).map(
         (item) => item.value
      );
      const subconsciousPower = 9 - missingNumber.length;
      const rationalThinking = getRationalThinking(completedName, date);
      const way1 = sumAdjacent(month, date),
         way2 = sumAdjacent(year, date);
      const way3 = sumAdjacent(way1, way2),
         way4 = sumAdjacent(month, year, "finalWay");
      const way = ` ${way1} ${way2} ${way3} ${way4}`;
      const challenge1 = substractAdjacent(month, date);
      const challenge2 = substractAdjacent(year, date);
      const challenge3 = Math.abs(challenge1 - challenge2);
      const challenge4 = substractAdjacent(month, year);
      const challenges = ` ${challenge1} ${challenge2} ${challenge3} ${challenge4}`;
      const yearIndividual = sumAdjacent(Number(currentYear), date + month);
      const monthIndividual = sumAdjacent(yearIndividual, Number(currentMonth));
      const linkPersonalityAndSoul = substractAdjacent(personality, soul);
      const dateOfBirth = sumAdjacent(date, 0);
      return [
         {
            key: "walksOfLife",
            value: walksOfLife,
            name: "Đường đời",
            name_en: "Path of life",
         },
         {
            key: "mission",
            value: mission,
            name: "Sứ mệnh",
            name_en: "Mission",
         },
         { key: "soul", value: soul, name: "Linh hồn", name_en: "Soul" },
         {
            key: "connect",
            value: connect,
            name: "Kết nối",
            name_en: "Connection",
         },
         {
            key: "personality",
            value: personality,
            name: "Nhân cách",
            name_en: "Personality",
         },
         { key: "passion", value: passion, name: "Đam mê", name_en: "Passion" },
         {
            key: "mature",
            value: mature,
            name: "Trưởng thành",
            name_en: "Mature",
         },
         {
            key: "balance",
            value: balance,
            name: "Cân bằng",
            name_en: "Balance",
         },
         {
            key: "subconsciousPower",
            value: subconsciousPower,
            name: "Sức mạnh tiềm thức",
            name_en: "Subconscious Power",
         },
         {
            key: "missingNumbers",
            value: missingNumber.toString().replace(/\,/g, " "),
            name: "Số thiếu",
            name_en: "Missing Numbers",
         },
         {
            key: "rationalThinking",
            value: rationalThinking,
            name: "Tư duy lý trí",
            name_en: "Rational Thinking",
         },
         {
            key: "way",
            value: way,
            name: "Chặng",
            name_en: "Way",
         },
         {
            key: "challenges",
            value: challenges,
            name: "Thách thức",
            name_en: "Challenges",
         },
         {
            key: "dateOfBirth",
            value: dateOfBirth,
            name: "Ngày sinh",
            name_en: "Date Of Birth",
         },
         {
            key: "yearIndividual",
            value: yearIndividual,
            name: "Năm cá nhân",
            name_en: "Individual Year",
         },
         {
            key: "monthIndividual",
            value: monthIndividual,
            name: "Tháng cá nhân",
            name_en: "Individual Month",
         },
         {
            key: "linkPersonalityAndSoul",
            value: linkPersonalityAndSoul,
            name: "Liên kết nhân cách và linh hồn",
            name_en: "Link Personality And Soul",
         },
      ];
   }, [fullName, birthDay]);
   return data;
};
