import dayjs from 'dayjs';

export const getWalksOfLife = (
  birthDay: string = new Date().toISOString()
): number => {
  const dateStr = dayjs(birthDay).format('DDMMYYYY');
  let sum = 0;
  for (let i = 0; i < dateStr.length; i++) {
    sum += parseInt(dateStr[i], 10);
  }

  while (sum >= 10 && sum !== 10 && sum !== 11 && sum !== 22) {
    const strSum = String(sum);
    let tempSum = 0;
    for (let i = 0; i < strSum.length; i++) {
      tempSum += parseInt(strSum[i], 10);
    }
    sum = tempSum;
  }
  return sum;
};
