import { NextResponse } from "next/server";
import axios from "axios";
import { cache } from "react";
import type {
  QuoteData,
  StockRecord,
  StockNewsRecord,
  MarketNewsRecord,
} from "@/types";

export const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";
export const BASE_URL = "https://finnhub.io/api/v1";
export const symbols = [
  "NVDA",
  "AAPL",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "NFLX",
  "TSLA",
  "AMD",
  "INTC",
  "IBM",
  "ORCL",
  "CRM",
  "ADBE",
  "PYPL",
  "UBER",
  "BABA",
  "SHOP",
  "SQ",
  "BAC",
];

export const fetchStockData = cache(
  async (symbol: string): Promise<StockRecord | null> => {
    try {
      console.log("Sending request to external API...");
      const { data } = await axios.get<QuoteData>(
        `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
      );
      // Finnhub returns c: 0 for invalid symbols
      if (data.c === 0) {
        return null;
      }
      return { symbol, data };
    } catch (error) {
      console.error("Error in fetching data.", error);
      return null;
    }
  }
);

// Cache the multi-stock fetch to deduplicate requests across components
export const fetchMultiStocksData = cache(async (): Promise<StockRecord[]> => {
  const multiData = await Promise.all(
    symbols.slice(0, 5).map((symbol) => fetchStockData(symbol))
  );

  // Filter out null values (invalid symbols)
  return multiData.filter((stock): stock is StockRecord => stock !== null);
});

export const fetchCompanyNews = cache(
  async (symbol: string): Promise<StockNewsRecord[] | null> => {
    try {
      console.log("Sending request to external API...");
      const response = await axios.get<StockNewsRecord[]>(
        `${BASE_URL}/company-news?symbol=${symbol}&from=2025-11-15&to=2025-11-20&token=${API_KEY}`
      );
      return response.data;
    } catch (error) {
      console.error("Error in fetching data from external API.", error);
      return null;
    }
  }
);

export const fetchMarketNews = async (): Promise<MarketNewsRecord[] | null> => {
  try {
    console.log("Sending request to external API...");
    const response = await axios.get(
      `${BASE_URL}/news?category=general&minId=10&token=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Error in fetching data from external API.", error);
    return null;
  }
};

export async function GET() {
  try {
    const allStocks = await fetchMultiStocksData();
    if (allStocks.length === 0) {
      return NextResponse.json(
        { error: "No stock data available" },
        { status: 503 }
      );
    }

    return NextResponse.json(allStocks);
  } catch (error) {
    console.error("Error in GET /api:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
