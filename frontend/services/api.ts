import axios from "axios";
import { cache } from "react";

// Finnhub "quote" response shape (simplified)
type QuoteData = {
  c: number; // current price
  h: number; // high price of the day
  l: number; // low price of the day
  o: number; // open price of the day
  pc: number; // previous close price
};

export type StockRecord = {
  symbol: string;
  data: QuoteData;
};

export type StockNews = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";
const BASE_URL = "https://finnhub.io/api/v1";

const symbols = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "NFLX",
  "TSLA",
  "NVDA",
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
      console.log("sending request...");
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

export const fetchCompanyNews = async (
  symbol: string
): Promise<StockNews[] | null> => {
  try {
    console.log("sending request...");
    const response = await axios.get<StockNews[]>(
      `${BASE_URL}/company-news?symbol=${symbol}&from=2025-11-15&to=2025-11-20&token=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Error in fetching data.", error);
    return null;
  }
};
