"use client";

import Link from "next/link";
import type { StockRecord } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useStockWebSocketContext } from "@/context/WebSocketContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

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
    <Card className="w-80 hover:shadow-lg transition-shadow rounded-3xl hover:border-y-indigo-500">
      <CardHeader className="pb-1">
        <div className="flex justify-center items-center gap-4">
          <CardTitle className="text-2xl font-bold font-mono">
            {stock.symbol}
          </CardTitle>
          <span
            className={`text-2xl font-bold font-mono transition-colors ${priceBgStyle.current}`}
          >
            ${formatNumber(currentPrice)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">High:</span>
          <span className="font-semibold">${formatNumber(stock.data.h)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Low:</span>
          <span className="font-semibold">${formatNumber(stock.data.l)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-semibold">${formatNumber(stock.data.o)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Close:</span>
          <span className="font-semibold">${formatNumber(stock.data.pc)}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Button asChild variant={"secondary"} className="w-full">
          <Link href={`/quote/${stock.symbol}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
