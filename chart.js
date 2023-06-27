import {
  convertToTimeframe,
  getBarsPerTimeframe,
  load,
  TIMEFRAMES,
  timeToTimestamp,
} from "./dataLoader.js";

// chart is a giant canvas
let canvasContainer = document.getElementById("chartContainer");

let canvas = document.getElementById("chart");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.95;
canvas.height = window.innerHeight * 0.9;

const years = [
  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012,
  2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
];
// const years = [2008];
let selectedYear = 8;

let timeframe = "1m";
let timeframeSelector = document.getElementById("timeframeSelector");

let priceRangeLow = 1.49;
let priceRangeHigh = 1.53;

let dateRangeEnd = 7800000;
let displayedCandles = 100;

let canvasHeight = ctx.canvas.height;
let canvasWidth = ctx.canvas.width;

let maxCandles = 0;
let candleWidth = 0;

let lines = []; // [[x1,y1,x2,y2]]
let boxes = []; // [[x1,y1,x2,y2]]
let rays = [];
let brush = [];
let lineStarted = false;

// initialize side price bar, 15 prices
let pricesParentDiv = document.getElementById("priceRangeContainer");
let prices = document.getElementById("priceRange");

let autoBtn = document.getElementById("auto");
let auto = true;

let dates = document.getElementById("dateRangeContainer");

// canvas dragging
let mouseDown = false;
let mousePos = [];
let mousePosOnClick = [];
let priceRangeHighOnClick = priceRangeHigh;
let priceRangeLowOnClick = priceRangeLow;
// let dateRangeStartOnClick = dateRangeStart;
let dateRangeEndOnClick = dateRangeEnd;

let mousePosOverCandle = 0;
let dateOverCandle = 0;
let firstCandleDate = 0;

let measuring = false;
let shiftDown = false;

let hoverPrice = document.createElement("div");
hoverPrice.id = "hoverPrice";
document.body.appendChild(hoverPrice);

let hoverDate = document.createElement("div");
hoverDate.id = "hoverDate";
document.body.appendChild(hoverDate);

let replayBtn = document.getElementById("replay");
let pausePlayBtn = document.getElementById("play");
let nextBtn = document.getElementById("next");
let speedBtn = document.getElementById("speed");
let randomBtn = document.getElementById("random");

let barsPerSecReplay = [1, 3, 5, 10, 30, 50];
let barsPerSecIndex = 0;
let replayMode = false;
let replayPlaying = false;
let replayStartSelected = false;
let replayDateRange = 0;

let displayedCandleHigh = -1000000;
let displayedCandleLow = 1000000;

let candleI = 0;

const maxScrollAhead = 0.75;

// let oneMinData = await load("EUR/USD", 2008, 0);

// let data = convertToTimeframe(oneMinData, timeframe);
let oneMinData = [];
let data = [];

const loadAll = async () => {
  let progress = document.createElement("div");
  progress.id = "progress";
  progress.innerHTML = "Loading Data 0%";
  document.body.appendChild(progress);
  let count = 0;
  for (const y of years) {
    let yearData = await load("EUR/USD", y, 0);
    let convertedData = convertToTimeframe(yearData, timeframe);

    yearData.forEach((e) => {
      oneMinData.push(e);
    });
    convertedData.forEach((e) => {
      data.push(e);
    });
    // console.log(data.length);
    count += 1;
    progress.innerHTML = `Loading Data ${((count / years.length) * 100).toFixed(
      0
    )}%`;
  }
  document.body.removeChild(progress);
};
await loadAll();

autoBtn.style.color = "rgb(67, 143, 249)";
autoBtn.addEventListener("click", () => {
  auto = !auto;
  if (auto) {
    autoBtn.style.color = "rgb(67, 143, 249)";
  } else {
    autoBtn.style.color = "white";
  }
});

replayBtn.innerHTML = "Replay";
replayBtn.addEventListener("click", () => {
  replayMode = !replayMode;
  replayBtn.style.color = "white";

  if (replayMode) {
    replayBtn.style.color = "rgb(67, 143, 249)";
  }
  if (!replayMode) {
    replayStartSelected = false;
  }
});

pausePlayBtn.style.backgroundImage = 'url("./assets/play.png")';
pausePlayBtn.addEventListener("click", () => {
  replayPlaying = !replayPlaying;
  if (replayPlaying) {
    pausePlayBtn.style.backgroundImage = 'url("./assets/pause.png")';
    if (replayMode) {
      // console.log(1000 / barsPerSecReplay[barsPerSecIndex]);
      const update = () => {
        dateRangeEnd += 1;
        replayDateRange += 1;
        plotChart();
        if (replayPlaying) {
          setTimeout(update, 1000 / barsPerSecReplay[barsPerSecIndex]);
        }
      };
      setTimeout(update, 1000 / barsPerSecReplay[barsPerSecIndex]);
    }
  } else {
    pausePlayBtn.style.backgroundImage = 'url("./assets/play.png")';
  }
});

nextBtn.style.backgroundImage = 'url("./assets/next.png")';
nextBtn.addEventListener("click", () => {
  if (replayMode) {
    dateRangeEnd += 1;
    replayDateRange += 1;
    plotChart();
  }
});

speedBtn.innerHTML = `${barsPerSecReplay[barsPerSecIndex]}X`;
speedBtn.addEventListener("click", () => {
  if (barsPerSecIndex === barsPerSecReplay.length - 1) {
    barsPerSecIndex = 0;
  } else {
    barsPerSecIndex += 1;
  }
  speedBtn.innerHTML = `${barsPerSecReplay[barsPerSecIndex]}X`;
});

randomBtn.style.backgroundImage = 'url("./assets/random.png")';
randomBtn.addEventListener("click", () => {
  let rand = Math.random() * data.length;
  dateRangeEnd = Math.round(rand);
  plotChart();
});

Array.from(TIMEFRAMES.keys()).forEach((key) => {
  let timeframeBtn = document.createElement("div");
  timeframeBtn.className = "timeframeButton";
  timeframeBtn.innerHTML = key;
  timeframeSelector.appendChild(timeframeBtn);

  timeframeBtn.addEventListener("click", () => {
    if (timeframe === key) {
      return;
    }
    timeframe = key;
    // adjust timescale
    // let currentDateRange = dateRangeEnd - dateRangeStart;
    // load new data
    let dataPrevLength = data.length;
    data = convertToTimeframe(oneMinData, timeframe);
    let scaleFactor = dataPrevLength / data.length;
    dateRangeEnd = Math.round(dateRangeEnd / scaleFactor);
    replayDateRange = Math.round(replayDateRange / scaleFactor);
    plotChart();

    Array.from(document.getElementsByClassName("timeframeButton")).forEach(
      (btn) => {
        btn.className = "timeframeButton";
      }
    );
    timeframeBtn.className = "timeframeButton selected";
  });
  if (key === timeframe) {
    timeframeBtn.className = "timeframeButton selected";
  }
});

let activeTool = "";
// initialize drawing tools
for (const urlpath of [
  [`url('./assets/lineTool.png')`, "line"],
  [`url('./assets/boxTool.png')`, "box"],
  [`url('./assets/rayTool.png')`, "ray"],
  [`url('./assets/brushTool.png')`, "brush"],
  [`url('./assets/longTool.png')`, "long"],
  [`url('./assets/shortTool.png')`, "short"],
]) {
  let tool = document.createElement("div");
  tool.className = "tool";
  tool.style.backgroundImage = urlpath[0];
  tool.style.backgroundSize = `cover`;
  timeframeSelector.appendChild(tool);

  tool.addEventListener("click", () => {
    activeTool = urlpath[1];
    Array.from(document.getElementsByClassName("tool")).forEach((e) => {
      e.className = "tool";
    });
    tool.className = "tool selected";
  });
}

const findLastDatasetCandle = () => {
  return data[data.length - 1][4];
};
const findFirstDatasetCandle = () => {
  return data[0][4];
};
const calculateCandleWidth = () => {
  return canvasWidth / displayedCandles;
};

const updatePriceRangeLabels = () => {
  const labels = Array.from(document.getElementsByClassName("priceRangeLabel"));
  const priceRange = priceRangeHigh - priceRangeLow;
  const step = priceRange / labels.length;
  let count = 0;
  labels.forEach((label) => {
    let labelPrice = (priceRangeHigh - step * count).toFixed(5);
    label.innerHTML = labelPrice;
    const trueHeightPx =
      canvasHeight -
      ((labelPrice - priceRangeLow) / (priceRangeHigh - priceRangeLow)) *
        canvasHeight;
    label.style.top = `${trueHeightPx}px`;
    count += 1;
  });
};

prices.addEventListener("wheel", (e) => {
  auto = false;
  autoBtn.style.color = "white";
  let scroll = e.deltaY;
  // zoom out
  let delta = priceRangeHigh - priceRangeLow;
  let speed = 0.03;
  if (scroll > 0) {
    priceRangeHigh += delta * speed;
    priceRangeLow -= delta * speed;
  }
  // zoom in
  if (scroll < 0) {
    priceRangeHigh -= delta * speed;
    priceRangeLow += delta * speed;
  }
  updatePriceRangeLabels();
  plotChart();
});

const formatTimestamp = (unixTimestamp, withSpecificDate) => {
  let a = new Date(unixTimestamp * 1000);

  let date = a.getDate();
  let hour = a.getHours();
  let min = a.getMinutes();

  let amPm = "am";
  if (hour === 0) {
    hour = 12;
  }
  if (hour > 11) {
    amPm = "pm";
  }
  if (hour > 12) {
    hour -= 12;
  }
  if (min < 10) {
    min = `0${min}`;
  }

  date = a.toLocaleDateString("en-US");
  let formattedRes = `${date}   ${hour}:${min}${amPm}`;
  if (!withSpecificDate) {
    formattedRes = `${hour}:${min}${amPm}`;
  }
  //   let time =
  //     date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
  return formattedRes;
};

const findStartingDateLabel = (stepAmount) => {
  let ts = firstCandleDate;
  while (ts > 10000000000) {
    ts /= 10;
  }
  // console.log(ts);
  while (true) {
    let a = new Date(ts * 1000);
    let date = a.getDate();
    let hour = a.getHours();
    let min = a.getMinutes();
    if (stepAmount === 60) {
      return ts;
    }
    if (stepAmount === 300 && min % 5 === 0) {
      return ts;
    }
    if (stepAmount === 600 && min % 10 === 0) {
      return ts;
    }
    if (stepAmount === 900 && min % 15 === 0) {
      return ts;
    }
    if (stepAmount === 1800 && min % 30 === 0) {
      return ts;
    }
    if (stepAmount >= 3600 && min % 60 === 0) {
      return ts;
    }
    ts += 60;
  }
  return dateRangeEnd;
};

const updateDateRangeLabels = () => {
  let stepAmounts = [
    60, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 86400, 172800,
    345600, 691200, 1209600, 2419200,
  ];

  const labels = Array.from(document.getElementsByClassName("dateRangeLabel"));
  if (data.length <= 0) {
    return;
  }

  const dateRange = displayedCandles * 60 * getBarsPerTimeframe(timeframe);
  // firstCandleDate;
  let unit = stepAmounts[0];
  for (const amt of stepAmounts) {
    let total = amt * 15;
    if (total / dateRange >= 1) {
      unit = amt;
      break;
    }
  }
  let start = findStartingDateLabel(unit);
  let count = 0;
  labels.forEach((label) => {
    const timestamp = start + count * unit;
    const pixelValue = convertTimestampToX(timestamp);
    label.style.left = `${pixelValue}px`;
    label.innerHTML = formatTimestamp(timestamp, false);
    count += 1;
  });
};

const dateRangeScroll = (scroll) => {
  let maxCandles = 2500;
  let minCandles = 10;
  // zoom out
  // sourcery skip: dont-reassign-parameters
  scroll = Math.round(scroll / 4);
  if (scroll > 0 && displayedCandles < maxCandles) {
    // ~1000 bars
    displayedCandles += Math.abs(scroll);
  }
  // zoom in
  if (scroll < 0 && displayedCandles > minCandles) {
    // ~10 bars
    displayedCandles -= Math.abs(scroll);
  }
  displayedCandles = Math.max(displayedCandles, minCandles);
  displayedCandles = Math.min(displayedCandles, maxCandles);

  updateDateRangeLabels();
  plotChart();
};

const canvasScroll = (scroll) => {
  // console.log(scroll);
  let delta = (scroll / 4 / candleWidth) * 60 * getBarsPerTimeframe(timeframe);
  // if ()
  dateRangeEnd += scroll / 5;
  // dateRangeEnd = Math.min(
  //   dateRangeEnd,
  //   findLastDatasetCandle() +
  //     (findLastDatasetCandle() - findFirstDatasetCandle()) * maxScrollAhead
  // );

  updateDateRangeLabels();
  plotChart();
};

dates.addEventListener("wheel", (e) => {
  dateRangeScroll(e.deltaY);
});
canvas.addEventListener("wheel", (e) => {
  let { deltaX, deltaY } = e;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    canvasScroll(deltaX);
  }
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    dateRangeScroll(e.deltaY);
  }
});

const convertYToPrice = (y) => {
  return (
    ((canvasHeight - y) / canvasHeight) * (priceRangeHigh - priceRangeLow) +
    priceRangeLow
  ).toFixed(5);
};

const drawCurrentPrice = () => {
  let x = mousePosOverCandle - candleWidth / 2;
  let y = mousePos[1];
  let price = convertYToPrice(y);
  hoverPrice.innerHTML = price;
  hoverPrice.style.top = `${y}px`;
  //   console.log(date);
  let date = formatTimestamp(dateOverCandle, true);
  hoverDate.innerHTML = date;
  hoverDate.style.left = `${mousePosOverCandle - candleWidth / 2}px`;
  ctx.strokeStyle = "#D3D3D3";
  ctx.setLineDash([4, 4]); /*dashes are 5px and spaces are 3px*/
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvasHeight);
  ctx.moveTo(0, y);
  ctx.lineTo(canvasWidth, y);
  ctx.stroke();
  ctx.setLineDash([0, 0]); /*dashes are 5px and spaces are 3px*/
};

const adjustPriceRangeToAuto = () => {
  let delta = displayedCandleHigh - displayedCandleLow; // the delta should be 80% of screen, so 10/10 split top and bottom
  let full = delta / 0.8;

  priceRangeHigh = parseFloat(displayedCandleHigh * 1.001);
  priceRangeLow = parseFloat(displayedCandleLow - displayedCandleLow * 0.001);

  displayedCandleHigh = -1000000;
  displayedCandleLow = 1000000;
};

// console.log(maxCandles);
const plotChart = () => {
  if (auto) {
    adjustPriceRangeToAuto();
  }
  // console.log(data.length);

  let s = new Date();
  canvasHeight = ctx.canvas.height;
  canvasWidth = ctx.canvas.width;
  ctx.lineWidth = 1;

  if (priceRangeHigh < priceRangeLow) {
    let c = priceRangeHigh;
    priceRangeHigh = priceRangeLow;
    priceRangeLow = c;
  }

  candleWidth = calculateCandleWidth();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  let left = canvasWidth;
  let candlesDrawn = 0;

  // prevent you from scrolling past data
  if (dateRangeEnd > data.length) {
    let min = Math.min(
      displayedCandles * maxScrollAhead,
      dateRangeEnd - data.length
    );
    left -= min;
    dateRangeEnd = data.length + min;
  }

  // prevent you from scroll too far back to before data
  if (dateRangeEnd < displayedCandles) {
    let min = Math.max(displayedCandles * (1 - maxScrollAhead), dateRangeEnd);
    dateRangeEnd = min;
  }

  // same stuff but for replay
  if (replayMode && replayStartSelected && dateRangeEnd > replayDateRange) {
    let min = Math.min(
      displayedCandles * maxScrollAhead,
      dateRangeEnd - replayDateRange
    );
    dateRangeEnd = replayDateRange + min;
  }
  let weekendGaps = 0;
  let prevClose = 0;
  for (
    let i = dateRangeEnd;
    i > dateRangeEnd - displayedCandles - weekendGaps;
    i--
  ) {
    if (i < 0 || i >= data.length) {
      continue;
    }
    const candle = data[Math.round(i)];
    let open = candle[0];
    let high = candle[1];
    let low = candle[2];
    let close = candle[3];
    let candlePrintTime = candle[4];

    let bullish = close >= open;
    let bearish = close < open;

    // if (candlePrintTime <= dateRangeEnd) {
    firstCandleDate = candlePrintTime + 60 * getBarsPerTimeframe(timeframe);

    let scaledOpen = scalePriceToCanvasHeight(open);
    let scaledClose = scalePriceToCanvasHeight(close);
    let scaledHigh = scalePriceToCanvasHeight(high);
    let scaledLow = scalePriceToCanvasHeight(low);

    if (scaledOpen === scaledClose) {
      scaledClose += 2;
    }

    if (scaledOpen === -1) {
      weekendGaps += 1;
      continue;
    }

    // console.log(scaledOpen, scaledClose, scaledHigh, scaledLow);
    // console.log(open, scaledClose, scaledHigh, scaledLow);

    if (bearish) {
      ctx.fillStyle = "#EE3542";
      ctx.strokeStyle = "#EE3542";
    } else {
      ctx.fillStyle = "#158E75";
      ctx.strokeStyle = "#158E75";
    }

    if (scaledOpen !== 0) {
      if (high > displayedCandleHigh) {
        displayedCandleHigh = high;
      }
      if (low < displayedCandleLow) {
        displayedCandleLow = low;
      }
    }

    if (
      replayMode &&
      replayStartSelected &&
      candlePrintTime > data[replayDateRange][4]
    ) {
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#000000";
    }

    // body
    // console.log(close, Math.round(scaledClose));
    if (prevClose === 0) {
      prevClose = scaledOpen;
    }
    if (bearish) {
      ctx.fillRect(
        Math.round(left + candleWidth * 0.1),
        Math.round(scaledOpen),
        Math.round(candleWidth * 0.8),
        Math.round(scaledClose - scaledOpen)
      );
    } else {
      ctx.fillRect(
        Math.round(left + candleWidth * 0.1),
        Math.round(scaledOpen),
        Math.round(candleWidth * 0.8),
        Math.round(scaledClose - scaledOpen)
      );
    }

    prevClose = scaledOpen + scaledClose - scaledOpen;
    // wick
    ctx.beginPath();
    ctx.moveTo(
      Math.round(left + candleWidth / 2) + 0.5,
      Math.round(scaledHigh) + 0.5
    );
    ctx.lineTo(
      Math.round(left + candleWidth / 2) + 0.5,
      Math.round(scaledLow) + 0.5
    );
    ctx.stroke();

    // lines
    if (mousePos[0] >= left - candleWidth && mousePos[0] <= left) {
      mousePosOverCandle = left;
      candleI = i;
      dateOverCandle = candlePrintTime;
    }
    left -= candleWidth;
    candlesDrawn += 1;
  }

  // if (replayMode && replayStartSelected) {
  //   let x = convertTimestampToX(data[replayDateRange][4]) - candleWidth / 2;
  //   console.log(x, data[replayDateRange][4]);
  //   ctx.fillStyle = "black";
  //   ctx.fillRect(x, 0, 10000000, 10000000);
  // }

  drawLines();
  drawBoxes();
  drawRays();
  drawBrush();

  // dateRangeEnd = originalDateRangeEnd;

  // console.log((new Date() - s) / 1000);
};

const drawLines = () => {
  // let color = "#FFFF00";
  ctx.strokeStyle = "#FFFF00";
  ctx.lineWidth = 3;
  lines.forEach((line) => {
    let [x1, y1, x2, y2] = line;
    x1 = convertTimestampToX(x1);
    x2 = convertTimestampToX(x2);
    y1 = scalePriceToCanvasHeight(y1);
    y2 = scalePriceToCanvasHeight(y2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
};

const drawBoxes = () => {
  ctx.fillStyle = "#A9A9A9";
  ctx.globalAlpha = 0.4;
  boxes.forEach((box) => {
    let [x1, y1, x2, y2] = box;
    x1 = convertTimestampToX(x1);
    x2 = convertTimestampToX(x2);
    y1 = scalePriceToCanvasHeight(y1);
    y2 = scalePriceToCanvasHeight(y2);
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  });
  ctx.globalAlpha = 1;
};

const drawRays = () => {
  ctx.strokeStyle = "#FFFF00";
  ctx.lineWidth = 3;
  rays.forEach((ray) => {
    let [x1, y1] = ray;
    x1 = convertTimestampToX(x1);
    y1 = scalePriceToCanvasHeight(y1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(10000000, y1);
    ctx.stroke();
  });
};

const drawBrush = () => {
  ctx.strokeStyle = "#FFFF00";
  ctx.lineWidth = 3;
  brush.forEach((points) => {
    let first = true;
    for (let i = 1; i < points.length; i += 2) {
      let x = points[i - 1];
      let y = points[i];

      x = convertTimestampToX(x);
      y = scalePriceToCanvasHeight(y);
      if (first) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        first = false;
        continue;
      }

      ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
};

const drawMeasuringTool = () => {
  let [startX, startY] = mousePosOnClick;
  let [x, y] = mousePos;

  let deltaX = x - startX;
  let deltaY = y - startY;

  let infoWidth = 200;
  let infoHeight = 70;
  let infoX = startX + deltaX / 2 - infoWidth / 2;
  let infoY = y + 10;

  let color = "#D61422"; // red
  if (deltaY < 0) {
    color = "rgba(56, 97, 246)"; // blue
    infoY = y - infoHeight - 10;
  }

  // measuring area
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(startX, startY, deltaX, deltaY);
  ctx.globalAlpha = 1;

  // info box
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(infoX, infoY, infoWidth, infoHeight, [5]);
  ctx.fill();
  ctx.stroke();

  // info box text, actual price delta, pip delta, bars (next line)
  let currentPrice = convertYToPrice(y);
  let startingPrice = convertYToPrice(startY);
  let priceDelta = -1 * (startingPrice - currentPrice);
  let barsHighlighted = Math.round(
    Math.abs(((-1 * (startX - x)) / canvasWidth) * displayedCandles)
  );
  let pipDelta = (priceDelta / 0.0001).toFixed(1);
  priceDelta = priceDelta.toFixed(5);
  let text = `${priceDelta}      ${pipDelta} pips`;
  let text2 = `${barsHighlighted} bars`;

  ctx.font = "18px serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, infoX + 15, infoY + 30);
  ctx.fillText(text2, infoX + infoWidth / 2 - 25, infoY + infoHeight - 15);
};

const convertTimestampToX = (timestamp) => {
  let dateRangeStart =
    data[
      Math.max(
        0,
        Math.round(Math.min(dateRangeEnd, data.length - 1)) - displayedCandles
      )
    ][4];
  while (dateRangeStart > 10000000000) {
    dateRangeStart /= 10;
  }
  let candlesFromLeft =
    (timestamp - dateRangeStart) / (60 * getBarsPerTimeframe(timeframe));

  // console.log("candles from left", candlesFromLeft);

  return candlesFromLeft * candleWidth - candleWidth / 2;
};

const downlistener = () => {
  if (measuring) {
    measuring = false;
  }
  mouseDown = true;
  mousePosOnClick = mousePos;
  priceRangeHighOnClick = priceRangeHigh;
  priceRangeLowOnClick = priceRangeLow;
  dateRangeEndOnClick = dateRangeEnd;
  measuring = shiftDown;

  // replay
  if (replayMode && !replayStartSelected) {
    dateRangeEnd = Math.round(
      dateRangeEnd - displayedCandles + mousePosOverCandle / candleWidth
    );
    replayDateRange = dateRangeEnd;
    replayStartSelected = true;
  }

  // drawing tools
  if (!lineStarted) {
    if (activeTool === "line") {
      lines.push([
        dateOverCandle,
        convertYToPrice(mousePosOnClick[1]),
        dateOverCandle,
        convertYToPrice(mousePosOnClick[1]),
      ]);
      lineStarted = true;
    } else if (activeTool === "box") {
      boxes.push([
        dateOverCandle,
        convertYToPrice(mousePosOnClick[1]),
        dateOverCandle,
        convertYToPrice(mousePosOnClick[1]),
      ]);
      lineStarted = true;
    } else if (activeTool === "ray") {
      rays.push([dateOverCandle, convertYToPrice(mousePosOnClick[1])]);
      unselectTool();
    } else if (activeTool === "brush") {
      brush.push([dateOverCandle, convertYToPrice(mousePosOnClick[1])]);
      lineStarted = true;
    }
  } else if (lineStarted) {
    lineStarted = false;
    unselectTool();
  }
  plotChart();
};

const unselectTool = () => {
  activeTool = "";
  Array.from(document.getElementsByClassName("tool")).forEach((e) => {
    e.className = "tool";
  });
};
const uplistener = () => {
  mouseDown = false;
};
const mouseMove = (e) => {
  mousePos = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];

  plotChart();
  drawCurrentPrice();

  if (measuring) {
    drawMeasuringTool();
  }

  if (replayMode && !replayStartSelected) {
    ctx.fillStyle = "rgba(56, 97, 246)";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(mousePosOverCandle, 0, canvasWidth, canvasHeight);
    ctx.globalAlpha = 1;
  }

  if (lineStarted) {
    if (activeTool === "line") {
      let activeLine = lines[lines.length - 1];
      activeLine[2] = dateOverCandle;
      activeLine[3] = convertYToPrice(mousePos[1]);
    }
    if (activeTool === "box") {
      let box = boxes[boxes.length - 1];
      box[2] = dateOverCandle;
      box[3] = convertYToPrice(mousePos[1]);
    }
    if (activeTool === "brush") {
      let b = brush[brush.length - 1];
      b.push(dateOverCandle);
      b.push(convertYToPrice(mousePos[1]));
    }
  }

  if (!mouseDown) {
    return;
  }
  let deltaX = mousePos[0] - mousePosOnClick[0];
  let deltaY = mousePos[1] - mousePosOnClick[1];
  priceRangeHigh =
    priceRangeHighOnClick +
    (deltaY / canvasHeight) * (priceRangeHigh - priceRangeLow);
  priceRangeLow =
    priceRangeLowOnClick +
    (deltaY / canvasHeight) * (priceRangeHigh - priceRangeLow);
  dateRangeEnd =
    dateRangeEndOnClick - (deltaX / canvasWidth) * displayedCandles;

  updatePriceRangeLabels();
  updateDateRangeLabels();
};

const keyPress = (e) => {
  shiftDown = e.shiftKey;
  if (e.key === "Escape") {
    measuring = false;
    unselectTool();
    plotChart();
  }
};

const keyUp = (e) => {
  shiftDown = e.shiftKey;
};
canvas.addEventListener("mousedown", downlistener);
canvas.addEventListener("mouseup", uplistener);
canvas.addEventListener("mousemove", mouseMove);
window.addEventListener("keydown", keyPress);
window.addEventListener("keyup", keyUp);

// 2008.01.01,19:00,1.462100,1.462100,1.462100,1.462100,0
// DateTime,Open,High,Low,Close,Volume

const scalePriceToCanvasHeight = (y) => {
  if (y === 0) {
    return -1;
  }
  // 1.2 - 1.6, 1.5
  const priceRange = priceRangeHigh - priceRangeLow;
  const pipRange = priceRange / 0.0001;
  const pixelsPerPip = canvasHeight / pipRange;
  // console.log("pixelsPerPip", pixelsPerPip, y - priceRangeLow);
  // return canvasHeight - ((y - priceRangeLow) / priceRange) * canvasHeight;
  return canvasHeight - ((y - priceRangeLow) / 0.0001) * pixelsPerPip;
};
// while (data.lenth === 0) {
//   data = await convertToTimeframe(oneMinData, timeframe);
// }
updatePriceRangeLabels();
updateDateRangeLabels();
// maxCandles = calculateMaxCandles();
candleWidth = calculateCandleWidth();
plotChart();
