/**
 * Centralized type definitions for the stock market application
 */

/** Quote data response shape (generic format) */
export type QuoteData = {
  /** current price */
  c: number;
  /** change */
  d: number;
  /** percent change */
  dp: number;
  /** high price of the day */
  h: number;
  /** low price of the day */
  l: number;
  /** open price of the day */
  o: number;
  /** previous close price */
  pc: number;
  /** time */
  t: number;
};

export type StockRecord = {
  symbol: string;
  name?: string;
  data: QuoteData;
};

/** Comprehensive stock data similar to Yahoo Finance */
export type ComprehensiveData = {
  /** Basic quote data */
  symbol: string;
  name: string;
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
  volume?: number;
  avgVolume?: number;

  /** Company metrics */
  marketCap?: number;
  beta?: number;
  peRatio?: number;
  eps?: number;
  earningsDate?: string;
  forwardDividend?: number;
  forwardDividendYield?: number;
  exDividendDate?: string;
  targetEstimate?: number;

  /** Additional data */
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
};

export type StockCandle = {
  symbol: string;
  resolution: `1` | `15` | `60` | `D` | `M`;
  data: CandleData;
};

export type CandleData = {
  /** List of close prices for returned candles */
  c: number[];
  /** List of high prices for returned candles */
  h: number[];
  /** List of low prices for returned candles */
  l: number[];
  /** List of open prices for returned candles */
  o: number[];
  /** Status of the response. This field can either be ok or no_data */
  s: string;
  /** List of timestamp for returned candles */
  t: number[];
  /** List of volume data for returned candles */
  v: number[];
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
  name?: string;
  data: QuoteData;
  changePercent: number;
  priceRange: number;
  priceChange: number;
  // Additional comprehensive data fields
  volume?: number;
  avgVolume?: number;
  marketCap?: number;
  peRatio?: number;
  week52ChangePercent?: number;
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

/** WebSocket Types for Real-time Stock Data */

/** WebSocket connection state */
export type WebSocketConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/** Client to Server message types */
export type ClientToServerMessage = {
  action: "subscribe" | "unsubscribe";
  symbols: string[];
};

/** Server to Client message types */
export type ServerToClientMessage =
  | ConnectionMessage
  | SubscriptionMessage
  | PriceUpdateMessage
  | ErrorMessage;

/** Connection confirmation message */
export type ConnectionMessage = {
  type: "connection";
  status: "connected";
  client_id: string;
};

/** Subscription confirmation message */
export type SubscriptionMessage = {
  type: "subscription";
  status: "subscribed" | "unsubscribed";
  symbols: string[];
};

/** Real-time price update message */
export type PriceUpdateMessage = {
  type: "price_update";
  symbol: string;
  data: {
    price: number;
    volume: number;
    timestamp: number;
  };
};

/** Error message from server */
export type ErrorMessage = {
  type: "error";
  message: string;
};

/** Real-time stock price data (used in components) */
export type RealtimeStockPrice = {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
};
