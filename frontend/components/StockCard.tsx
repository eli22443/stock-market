"use client";

import Link from "next/link";
import type { StockRecord } from "@/types";
import { useContext, useEffect, useRef, useState } from "react";
import { useStockWebSocketContext } from "@/context/WebSocketContext";

export default function StockCard({ stock }: { stock: StockRecord }) {
  const ws = useStockWebSocketContext();

  const prevPrice = useRef(stock.data.c);
  const priceBgStyle = useRef("");
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to symbols when component mounts
    // console.log("subscribing...");

    ws?.subscribe([stock.symbol]);

    // Cleanup: unsubscribe on unmount
    return () => {
      // console.log("unsubscribing...");
      ws?.unsubscribe([stock.symbol]);
    };
  }, []);

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Force rerender every 0.75 seconds
  useEffect(() => {
    if (ws?.connectionState != "disconnected") {
      const interval = setInterval(() => {
        setTick((prev) => prev + 1);
        priceBgStyle.current = "";
        // console.log("executed delay");
      }, 750);

      return () => {
        clearInterval(interval);
        // console.log("cancelled delay");
      };
    }
  });

  // Get latest price for a symbol
  const currentPrice = ws?.getPrice(stock.symbol)?.price || stock.data.c;
  const priceDiff = currentPrice - prevPrice.current;

  // Update prevPrice after render to avoid stale comparisons
  useEffect(() => {
    prevPrice.current = currentPrice;
  }, [currentPrice]);

  // Get latest price for a symbol
  priceBgStyle.current =
    priceDiff > 0
      ? "bg-green-900"
      : priceDiff < 0
      ? "bg-red-900"
      : priceBgStyle.current;

  return (
    <div className="hover:border-indigo-900 w-60 rounded-2xl border-y-2 px-2 py-4">
      <div className="stock-info">
        <div className="flex justify-center my-4">
          <h1 className="text-2xl font-bold font-mono mr-6">{stock.symbol}</h1>
          <span
            className={`text-2xl font-bold font-mono ${priceBgStyle.current}`}
          >
            ${formatNumber(currentPrice)}
          </span>
        </div>
        <div className="mx-2">
          <div className="flex justify-between">
            <span>High:</span>
            <span>
              <strong>${stock.data.h}</strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Low:</span>
            <span>
              <strong>${stock.data.l}</strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Open:</span>
            <span>
              <strong>${stock.data.o.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Close:</span>
            <span>
              <strong>${stock.data.pc}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="stock-graph py-4">
        {/* Placeholder for stock chart - to be implemented */}
      </div>
      <div className="stock-overlay mb-2 ml-6">
        <Link
          href={`/quote/${stock.symbol}`}
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
        >
          $$$
        </Link>
      </div>
    </div>
  );
}
