/**
 * Centralized type definitions for the stock market application
 */

// Finnhub "quote" response shape (simplified)
export type QuoteData = {
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

export type StocksMetrics = {
  symbol: string;
  data: QuoteData;
  changePercent: number;
  priceRange: number;
  priceChange: number;
};

export type StockCategorized = {
  category: string;
  stocks: StocksMetrics[];
  count: number;
};

