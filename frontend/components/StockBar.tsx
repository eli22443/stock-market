"use client";

import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import { ComprehensiveStockData } from "@/types";
import { useEffect } from "react";

export function StockBar({
  symbol,
  stockData,
}: {
  symbol: string;
  stockData: ComprehensiveStockData;
}) {
  const { subscribe, unsubscribe, priceUpdates, isConnected, getPrice } =
    useStockWebSocket({
      onConnect: () => console.log("Connected!"),
      onDisconnect: () => console.log("Disconnected"),
    });

  useEffect(() => {
    // Subscribe to symbols when component mounts
    subscribe([symbol]);

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe([symbol]);
    };
  }, []);

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get latest price for a symbol

  const currentPrice = getPrice(symbol)?.price || stockData.currentPrice;

  const priceChange = currentPrice - stockData.previousClose;

  const priceChangePercent = (priceChange / currentPrice) * 100;

  return (
    <div className="border hover:border-indigo-900 rounded-lg px-6 py-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Current Price</div>
          <div className="text-3xl font-bold ">
            {formatNumber(currentPrice)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Change</div>
          <div
            className={`text-2xl font-semibold ${
              priceChange >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {priceChange >= 0 ? "+" : ""}
            {formatNumber(priceChange)}({priceChangePercent >= 0 ? "+" : ""}
            {formatNumber(priceChangePercent)}%)
          </div>
        </div>
      </div>
    </div>
  );
}
