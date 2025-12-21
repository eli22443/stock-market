/**
 * Stock Candles API Route
 * Uses yahoo-finance2 for all candle data (free, no API key needed)
 */
import { NextResponse } from "next/server";
import {
  fetchYahooFinanceCandles,
  convertYahooToCandleData,
} from "@/services/yahooFinance";
import { CandleData } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const resolution = searchParams.get("resolution") || "D";
    const from = searchParams.get("from")
      ? parseInt(searchParams.get("from")!)
      : undefined;
    const to = searchParams.get("to")
      ? parseInt(searchParams.get("to")!)
      : undefined;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Validate resolution
    const validResolutions = ["1", "5", "15", "30", "60", "D", "W", "M"];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        {
          error: `Invalid resolution. Must be one of: ${validResolutions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate date range if provided
    if (from && to && from > to) {
      return NextResponse.json(
        {
          error: "Invalid date range: 'from' must be less than 'to'",
        },
        { status: 400 }
      );
    }

    // Fetch candles from Yahoo Finance
    const candles = await fetchYahooFinanceCandles(
      symbol.toUpperCase(),
      resolution,
      from,
      to
    );

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        {
          error: "No candle data found",
          symbol: symbol.toUpperCase(),
          resolution,
          suggestion:
            "Check that the symbol is valid and data is available for the requested time range.",
        },
        { status: 404 }
      );
    }

    // Convert to CandleData format for compatibility with existing code
    const candleData: CandleData = convertYahooToCandleData(candles);

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      resolution,
      data: candleData,
    });
  } catch (error) {
    console.error("Error in GET /api/candles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cache for 1 hour for daily/weekly/monthly data
// For intraday data, consider shorter cache times (5-15 minutes)
export const revalidate = 3600;
