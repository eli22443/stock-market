/**
 * Centralized type definitions for the stock market application
 */

// Finnhub quote response shape (simplified)
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

// Comprehensive stock data similar to Yahoo Finance
export type ComprehensiveStockData = {
  // Basic quote data
  previousClose: number;
  open: number;
  bid?: number;
  bidSize?: number;
  ask?: number;
  askSize?: number;
  dayRange: {
    low: number;
    high: number;
  };
  week52Range: {
    low: number;
    high: number;
  };
  volume: number;
  avgVolume: number;

  // Company metrics
  marketCap?: number;
  beta?: number;
  peRatio?: number;
  eps?: number;
  earningsDate?: string;
  forwardDividend?: number;
  forwardDividendYield?: number;
  exDividendDate?: string;
  targetEstimate?: number;

  // Additional data
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
};

export type CandleData = {
  c: number[]; // List of close prices for returned candles.
  h: number[]; //List of high prices for returned candles.
  l: number[]; //List of low prices for returned candles.
  o: number[]; //List of open prices for returned candles.
  s: number[]; //Status of the response. This field can either be ok or no_data.
  t: number[]; //List of timestamp for returned candles.
  v: number[]; //List of volume data for returned candles.
};

export type StockNewsRecord = {
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

export type MarketNewsRecord = {
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
