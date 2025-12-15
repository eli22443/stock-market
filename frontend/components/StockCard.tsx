"use client";

import Link from "next/link";
import type { StockRecord } from "@/types";
import { useEffect } from "react";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

export default function StockCard({ stock }: { stock: StockRecord }) {
  const { subscribe, unsubscribe, priceUpdates, isConnected, getPrice } =
    useStockWebSocket({
      onConnect: () => console.log("Connected!"),
      onDisconnect: () => console.log("Disconnected"),
    });

  useEffect(() => {
    // Subscribe to symbols when component mounts
    subscribe([stock.symbol]);

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe([stock.symbol]);
    };
  }, []);

  // Get latest price for a symbol
  const price: number | string = isConnected
    ? getPrice(stock.symbol)?.price.toFixed(2) || "-"
    : stock.data.c;

  return (
    <div className="hover:border-indigo-900 w-60 rounded-2xl border-2  px-2 py-4">
      <div className="stock-info">
        <div className="flex justify-center my-4">
          <h1 className="text-2xl font-bold font-mono mr-6">{stock.symbol}</h1>
          <span className="text-2xl font-bold font-mono">${price}</span>
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
