"use client";
import { StockCandle } from "@/types";
import StockPriceChart from "./StockPriceChart";
import { useState } from "react";

type Period = "1D" | "5D" | "1M" | "6M" | "1Y";

export default function ChartContainer({
  candleD,
  candle1,
}: {
  candleD: StockCandle;
  candle1: StockCandle;
}) {
  /* Add controls for chart */
  /** Add time period selector (1D, 5D, 1M, 6M, 1Y) */
  const [period, setPeriod] = useState<Period>("1D");

  // First, handle zero-value data modifications
  for (let i = candle1.data.t.length - 1; i >= 0; i--) {
    let noZeroIndex = i;
    // Modify N/A 0-value data for graph to be the prev value
    while (candle1.data.c[noZeroIndex] == 0) {
      candle1.data.c[i] = candle1.data.c[noZeroIndex - 1];
      candle1.data.h[i] = candle1.data.h[noZeroIndex - 1];
      candle1.data.l[i] = candle1.data.l[noZeroIndex - 1];
      candle1.data.o[i] = candle1.data.o[noZeroIndex - 1];
      candle1.data.v[i] = candle1.data.v[noZeroIndex - 1];
      noZeroIndex--;
    }
  }

  // Find the LAST day starting from 4:00 AM EST/EDT
  // Iterate backwards to find the most recent 4:00 AM
  let dayIndex = candle1.data.t.length - 1;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  // Find the most recent 4:00 AM by iterating backwards
  for (let i = candle1.data.t.length - 1; i >= 0; i--) {
    const timestamp = candle1.data.t[i];
    const date = new Date(timestamp * 1000);
    const timeParts = formatter.format(date).split(":");
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);

    // Find the most recent candle at exactly 4:00 AM EST/EDT
    if (hour === 4 && minute === 0) {
      dayIndex = i;
      break;
    } else if (
      hour === 4 &&
      minute > 0 &&
      dayIndex === candle1.data.t.length - 1
    ) {
      // Found a 4:xx candle but not exactly 4:00, use it as fallback
      dayIndex = i;
    } else if (hour < 4 && dayIndex === candle1.data.t.length - 1) {
      // We've gone past 4:00 AM, check if next candle (forward) is at 4:00 AM
      if (i < candle1.data.t.length - 1) {
        const nextTimestamp = candle1.data.t[i + 1];
        const nextDate = new Date(nextTimestamp * 1000);
        const nextTimeParts = formatter.format(nextDate).split(":");
        const nextHour = parseInt(nextTimeParts[0]);
        const nextMinute = parseInt(nextTimeParts[1]);
        if (nextHour === 4 && nextMinute === 0) {
          dayIndex = i + 1;
          break;
        } else if (nextHour === 4) {
          dayIndex = i + 1;
        }
      }
    }
  }

  const candle1D: StockCandle = {
    symbol: candle1.symbol,
    resolution: candle1.resolution,
    data: {
      c: candle1.data.c.slice(dayIndex),
      h: candle1.data.h.slice(dayIndex),
      l: candle1.data.l.slice(dayIndex),
      o: candle1.data.o.slice(dayIndex),
      s: candle1.data.s,
      t: candle1.data.t.slice(dayIndex),
      v: candle1.data.v.slice(dayIndex),
    },
  };

  // showing in interval of 10 minutes
  const candle5D = {
    symbol: candle1.symbol,
    resolution: candle1.resolution,
    data: {
      c: candle1.data.c.filter((_, index) => index % 10 == 0),
      h: candle1.data.h.filter((_, index) => index % 10 == 0),
      l: candle1.data.l.filter((_, index) => index % 10 == 0),
      o: candle1.data.o.filter((_, index) => index % 10 == 0),
      s: candle1.data.s,
      t: candle1.data.t.filter((_, index) => index % 10 == 0),
      v: candle1.data.v.filter((_, index) => index % 10 == 0),
    },
  };

  // Filter data for 1 month (approximately 30 days)
  const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const oneMonthIndex = candleD.data.t.findIndex(
    (timestamp) => timestamp >= oneMonthAgo
  );
  const candle1M: StockCandle = {
    symbol: candleD.symbol,
    resolution: candleD.resolution,
    data: {
      c: candleD.data.c.slice(oneMonthIndex >= 0 ? oneMonthIndex : 0),
      h: candleD.data.h.slice(oneMonthIndex >= 0 ? oneMonthIndex : 0),
      l: candleD.data.l.slice(oneMonthIndex >= 0 ? oneMonthIndex : 0),
      o: candleD.data.o.slice(oneMonthIndex >= 0 ? oneMonthIndex : 0),
      s: candleD.data.s,
      t: candleD.data.t.slice(oneMonthIndex >= 0 ? oneMonthIndex : 0),
      v: candleD.data.v.slice(oneMonthIndex >= 0 ? oneMonthIndex : 0),
    },
  };

  // Filter data for 6 months (approximately 180 days)
  const sixMonthsAgo = Math.floor(Date.now() / 1000) - 180 * 24 * 60 * 60;
  const sixMonthIndex = candleD.data.t.findIndex(
    (timestamp) => timestamp >= sixMonthsAgo
  );
  const candle6M: StockCandle = {
    symbol: candleD.symbol,
    resolution: candleD.resolution,
    data: {
      c: candleD.data.c.slice(sixMonthIndex >= 0 ? sixMonthIndex : 0),
      h: candleD.data.h.slice(sixMonthIndex >= 0 ? sixMonthIndex : 0),
      l: candleD.data.l.slice(sixMonthIndex >= 0 ? sixMonthIndex : 0),
      o: candleD.data.o.slice(sixMonthIndex >= 0 ? sixMonthIndex : 0),
      s: candleD.data.s,
      t: candleD.data.t.slice(sixMonthIndex >= 0 ? sixMonthIndex : 0),
      v: candleD.data.v.slice(sixMonthIndex >= 0 ? sixMonthIndex : 0),
    },
  };

  // Filter data for 1 year (approximately 365 days)
  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  const oneYearIndex = candleD.data.t.findIndex(
    (timestamp) => timestamp >= oneYearAgo
  );
  const candle1Y: StockCandle = {
    symbol: candleD.symbol,
    resolution: candleD.resolution,
    data: {
      c: candleD.data.c.slice(oneYearIndex >= 0 ? oneYearIndex : 0),
      h: candleD.data.h.slice(oneYearIndex >= 0 ? oneYearIndex : 0),
      l: candleD.data.l.slice(oneYearIndex >= 0 ? oneYearIndex : 0),
      o: candleD.data.o.slice(oneYearIndex >= 0 ? oneYearIndex : 0),
      s: candleD.data.s,
      t: candleD.data.t.slice(oneYearIndex >= 0 ? oneYearIndex : 0),
      v: candleD.data.v.slice(oneYearIndex >= 0 ? oneYearIndex : 0),
    },
  };

  const chartMap = {
    "1D": candle1D,
    "5D": candle5D,
    "1M": candle1M,
    "6M": candle6M,
    "1Y": candle1Y,
  };

  const btnStyle = "bg-gray-700 mx-2 px-2 rounded-sm hover:bg-gray-600 text-sm";
  return (
    <section className="container h-90">
      <div className="tab-list ml-6 my-2">
        <button
          className={btnStyle + (period === "1D" ? " text-blue-500 " : "")}
          onClick={() => setPeriod("1D")}
        >
          <strong>1D</strong>
        </button>
        <button
          className={btnStyle + (period === "5D" ? " text-blue-500 " : "")}
          onClick={() => setPeriod("5D")}
        >
          <strong>5D</strong>
        </button>
        <button
          className={btnStyle + (period === "1M" ? " text-blue-500 " : "")}
          onClick={() => setPeriod("1M")}
        >
          <strong>1M</strong>
        </button>
        <button
          className={btnStyle + (period === "6M" ? " text-blue-500 " : "")}
          onClick={() => setPeriod("6M")}
        >
          <strong>6M</strong>
        </button>
        <button
          className={btnStyle + (period === "1Y" ? " text-blue-500 " : "")}
          onClick={() => setPeriod("1Y")}
        >
          <strong>1Y</strong>
        </button>
      </div>
      <StockPriceChart candle={chartMap[period]} />,
    </section>
  );
}
