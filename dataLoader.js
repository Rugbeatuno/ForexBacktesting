export const PAIRS = [
  "AUD/CAD",
  "AUD/CHF",
  "AUD/JPY",
  "AUD/NZD",
  "AUD/USD",
  "AUX/AUD",
  "BCO/USD",
  "CAD/CHF",
  "CAD/JPY",
  "CHF/JPY",
  "ETX/EUR",
  "EUR/AUD",
  "EUR/CAD",
  "EUR/CHF",
  "EUR/CZK",
  "EUR/DKK",
  "EUR/GBP",
  "EUR/HUF",
  "EUR/JPY",
  "EUR/NOK",
  "EUR/NZD",
  "EUR/PLN",
  "EUR/SEK",
  "EUR/TRY",
  "EUR/USD",
  "FRX/EUR",
  "GBP/AUD",
  "GBP/CAD",
  "GBP/CHF",
  "GBP/JPY",
  "GBP/NZD",
  "GBP/USD",
  "GRX/EUR",
  "HKX/HKD",
  "JPX/JPY",
  "NSX/USD",
  "NZD/CAD",
  "NZD/CHF",
  "NZD/JPY",
  "NZD/USD",
  "SGD/JPY",
  "SPX/USD",
  "UDX/USD",
  "UKX/GBP",
  "USD/CAD",
  "USD/CHF",
  "USD/CZK",
  "USD/DKK",
  "USD/HKD",
  "USD/HUF",
  "USD/JPY",
  "USD/MXN",
  "USD/NOK",
  "USD/PLN",
  "USD/SEK",
  "USD/SGD",
  "USD/TRY",
  "USD/ZAR",
  "WTI/USD",
  "XAG/USD",
  "XAU/AUD",
  "XAU/CHF",
  "XAU/EUR",
  "XAU/GBP",
  "XAU/USD",
  "ZAR/JPY",
];

export const TIMEFRAMES = new Map([
  ["1m", 1],
  ["3m", 180],
  ["5m", 300],
  ["15m", 900],
  ["30m", 1800],
  ["1h", 3600],
  ["4h", 14400],
  ["D", 86400],
]);

// let d = new Date
let dateToTimestamp = new Map();
export const timeToTimestamp = (date, time) => {
  let yearMonthDay = 0;

  if (dateToTimestamp.has(date)) {
    yearMonthDay = dateToTimestamp.get(date);
  } else {
    yearMonthDay = Math.floor(new Date(date).getTime() / 1000);
    dateToTimestamp.set(date, yearMonthDay);
  }
  // 17:20
  // 00:03
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  return yearMonthDay + hours * 3600 + minutes * 60;
};

const findPairPath = (pairName) => {
  return pairName.replace("/", "");
};

const getCurrentYear = () => {
  const currentDate = new Date();
  return currentDate.getFullYear();
};

const formatYearMonthPath = (year, month) => {
  const currentYear = getCurrentYear();
  if (year < currentYear) {
    return year;
  }

  // format month
  if (month < 10) {
    return String.toString(year) + "0" + String.toString(month);
  }
  return String.toString(year) + String.toString(month);
};

export const load = async (pairName, year, month) => {
  const forexPair = findPairPath(pairName);
  const yearMonth = formatYearMonthPath(year, month);
  const path = `./historicalData/${forexPair}/${yearMonth}.csv`;
  // const path = `historicalData/EURUSD.csv`;

  let file = await fetch(path);
  let text = await file.text();
  let returnVal = processCsv(text);
  return returnVal;
};

let weekends = [];
// 2008.01.01,19:00,1.462100,1.462100,1.462100,1.462100,0
// Date,Time,Open,High,Low,Close,Volume
const processCsv = (csvData) => {
  let firstTrade = 0;
  let prevIndex = 1;
  let lastOpen = 0;
  let lastCandleDrawn = 0;

  let lines = csvData.split("\n");
  lines = lines.slice(0, lines.length - 1);
  let formattedData = [];
  firstTrade = parseInt(lines[0].split(",")[4]);

  for (let i = 0; i < lines.length; i++) {
    // -1 to skip over newline at end of file
    const line = lines[i];

    let ochl = line.split(",");
    ochl[4] = parseInt(ochl[4]);

    let currentTrade = (ochl[4] - firstTrade) / 60;
    if (currentTrade - prevIndex !== 1) {
      for (let j = 1; j < currentTrade - prevIndex; j++) {
        if (currentTrade - prevIndex > 2000) {
          weekends.push(ochl[4]);
          break;
        }
        let ochlPlaceholder = [
          lastOpen,
          lastOpen,
          lastOpen,
          lastOpen,
          lastCandleDrawn + 60 * j,
        ];
        formattedData.push(ochlPlaceholder);
      }
    }
    lastOpen = ochl[0];
    lastCandleDrawn = ochl[4];
    prevIndex = currentTrade;

    formattedData.push(ochl);
  }
  formattedData = formattedData.slice(0, formattedData.length - 1);
  return formattedData;
};

export const getWeekends = () => {
  return weekends;
};

const getOpenHighLowClose = (bars) => {
  // console.log(bars);

  let high = 0;
  let low = 1000000;
  let open = bars[0][0];
  let close = bars[bars.length - 1][3];
  let time = bars[0][4];

  if (close === 0) {
    return [0, 0, 0, 0, time];
  }
  bars.forEach((bar) => {
    if (bar[1] > high) {
      high = bar[1];
    }
    if (bar[2] < low && bar[2] !== 0) {
      low = bar[2];
    }
  });

  return [close, high, low, open, time];
};

export const getBarsPerTimeframe = (timeframe) => {
  if (timeframe === "1m") {
    return 1;
  }
  if (timeframe === "3m") {
    return 3;
  }
  if (timeframe === "5m") {
    return 5;
  }
  if (timeframe === "10m") {
    return 10;
  }
  if (timeframe === "15m") {
    return 15;
  }
  if (timeframe === "30m") {
    return 30;
  }
  if (timeframe === "45m") {
    return 45;
  }
  if (timeframe === "1h") {
    return 60;
  }
  if (timeframe === "2h") {
    return 120;
  }
  if (timeframe === "3h") {
    return 180;
  }
  if (timeframe === "4h") {
    return 240;
  }
  if (timeframe === "D") {
    return 1440;
  }
  if (timeframe === "W") {
    return 10080;
  }
  return 1;
};

export const convertToTimeframe = (oneMinTimeframe, timeframe) => {
  if (timeframe === "1m") {
    return oneMinTimeframe;
  }
  let res = [];
  let bars = getBarsPerTimeframe(timeframe);

  for (let index = bars - 1; index < oneMinTimeframe.length; index += bars) {
    let barsConsidered = [];
    for (let i = 0; i < bars; i++) {
      barsConsidered.push(oneMinTimeframe[index - i]);
    }
    res.push(getOpenHighLowClose(barsConsidered));
  }
  return res;
};

/**
 *   Array.from(document.getElementsByTagName('a')).forEach(e=> {
    if (e.innerHTML.includes("Year Data")) {
      e.click()
    }
  })
 */
