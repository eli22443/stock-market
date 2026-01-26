"use client";

import { useStockWebSocketContext } from "@/context/WebSocketContext";
import { ComprehensiveData } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "./ui/card";

export function StockBar({
  symbol,
  stockData,
}: {
  symbol: string;
  stockData: ComprehensiveData;
}) {
  const ws = useStockWebSocketContext();

  const prevPrice = useRef(stockData.currentPrice);
  const priceBgStyle = useRef("");
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to symbols when component mounts
    ws?.subscribe([symbol]);

    // Cleanup: unsubscribe on unmount
    return () => {
      ws?.unsubscribe([symbol]);
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
      }, 750);

      return () => {
        clearInterval(interval);
      };
    }
  });

  // Get latest price for a symbol
  const currentPrice = ws?.getPrice(symbol)?.price || stockData.currentPrice;
  const priceDiff = currentPrice - prevPrice.current;

  // Update prevPrice after render to avoid stale comparisons
  useEffect(() => {
    prevPrice.current = currentPrice;
  }, [currentPrice]);

  priceBgStyle.current =
    priceDiff > 0
      ? "bg-green-900"
      : priceDiff < 0
        ? "bg-red-900"
        : priceBgStyle.current;

  const priceChange = currentPrice - stockData.previousClose;
  const priceChangePercent = (priceChange / currentPrice) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent >
        <div className="flex space-x-1">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Price</div>
            <div className={`text-3xl font-bold transition-colors ${priceBgStyle.current}`}>
              ${formatNumber(currentPrice)}
            </div>
          </div>
          <div className="col-span-3 flex justify-center">
            <div className="">
              <div className="text-sm text-muted-foreground mb-1">Change</div>
              <div
                className={`text-2xl font-semibold transition-colors ${priceBgStyle.current} ${priceChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
              >
                {priceChange >= 0 ? "+" : ""}
                ${formatNumber(priceChange)} ({priceChangePercent >= 0 ? "+" : ""}
                {formatNumber(priceChangePercent)}%)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
