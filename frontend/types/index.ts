/**
 * Centralized type definitions for the stock market application
 */

/** Finnhub quote response shape (simplified) */
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
  data: QuoteData;
};

/** Comprehensive stock data similar to Yahoo Finance */
export type ComprehensiveStockData = {
  /** Basic quote data */
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

export type RecommendationData = {
  /** Number of recommendations that fall into the Buy category */
  buy: number;
  /** Number of recommendations that fall into the Hold category */
  hold: number;
  /** Updated period */
  period: string;
  /** Number of recommendations that fall into the Sell category */
  sell: number;
  /** Number of recommendations that fall into the Strong Buy category */
  strongBuy: number;
  /** Number of recommendations that fall into the Strong Sell category */
  strongSell: number;
  /** Company symbol */
  symbol: string;
}[];

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

export type ProfileData = {
  country: string;
  currency: string;
  estimateCurrency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
};

export type EarningsCalendarData = {
  earningsCalendar: {
    /** Date */
    date: string;
    /** EPS actual */
    epsActual: number;
    /** EPS estimate */
    epsEstimate: number;
    /** Indicates whether the earnings is announced before market open(bmo), after market close(amc), or during market hour(dmh) */
    hour: string;
    /** Earnings quarter */
    quarter: number;
    /** Revenue actual */
    revenueActual: number;
    /** Revenue estimate including Finnhub's proprietary estimates */
    revenueEstimate: number;
    /** Symbol */
    symbol: string;
    /** Earnings year */
    year: number;
  }[];
};

export type FinancialData = {
  metric: {
    "10DayAverageTradingVolume": number;
    "13WeekPriceReturnDaily": number;
    "26WeekPriceReturnDaily": number;
    "3MonthADReturnStd": number;
    "3MonthAverageTradingVolume": number;
    "52WeekHigh": number;
    "52WeekHighDate": string;
    "52WeekLow": number;
    "52WeekLowDate": string;
    "52WeekPriceReturnDaily": number;
    "5DayPriceReturnDaily": number;
    assetTurnoverAnnual: number;
    assetTurnoverTTM: number;
    beta: number;
    bookValuePerShareAnnual: number;
    bookValuePerShareQuarterly: number;
    bookValueShareGrowth5Y: number;
    capexCagr5Y: number;
    cashFlowPerShareAnnual: number;
    cashFlowPerShareQuarterly: number;
    cashFlowPerShareTTM: number;
    cashPerSharePerShareAnnual: number;
    cashPerSharePerShareQuarterly: number;
    currentDividendYieldTTM: number;
    "currentEv/freeCashFlowAnnual": number;
    "currentEv/freeCashFlowTTM": number;
    currentRatioAnnual: number;
    currentRatioQuarterly: number;
    dividendGrowthRate5Y: number;
    dividendIndicatedAnnual: number;
    dividendPerShareAnnual: number;
    dividendPerShareTTM: number;
    dividendYieldIndicatedAnnual: number;
    ebitdPerShareAnnual: number;
    ebitdPerShareTTM: number;
    ebitdaCagr5Y: number;
    ebitdaInterimCagr5Y: number;
    enterpriseValue: number;
    epsAnnual: number;
    epsBasicExclExtraItemsAnnual: number;
    epsBasicExclExtraItemsTTM: number;
    epsExclExtraItemsAnnual: number;
    epsExclExtraItemsTTM: number;
    epsGrowth3Y: number;
    epsGrowth5Y: number;
    epsGrowthQuarterlyYoy: number;
    epsGrowthTTMYoy: number;
    epsInclExtraItemsAnnual: number;
    epsInclExtraItemsTTM: number;
    epsNormalizedAnnual: number;
    epsTTM: number;
    evEbitdaTTM: number;
    evRevenueTTM: number;
    focfCagr5Y: number;
    forwardPE: number;
    grossMargin5Y: number;
    grossMarginAnnual: number;
    grossMarginTTM: number;
    inventoryTurnoverAnnual: number;
    inventoryTurnoverTTM: number;
    "longTermDebt/equityAnnual": number;
    "longTermDebt/equityQuarterly": number;
    marketCapitalization: number;
    monthToDatePriceReturnDaily: number;
    netIncomeEmployeeAnnual: number;
    netIncomeEmployeeTTM: number;
    netInterestCoverageAnnual: number;
    netInterestCoverageTTM: number;
    netMarginGrowth5Y: number;
    netProfitMargin5Y: number;
    netProfitMarginAnnual: number;
    netProfitMarginTTM: number;
    operatingMargin5Y: number;
    operatingMarginAnnual: number;
    operatingMarginTTM: number;
    payoutRatioAnnual: number;
    payoutRatioTTM: number;
    pb: number;
    pbAnnual: number;
    pbQuarterly: number;
    pcfShareAnnual: number;
    pcfShareTTM: number;
    peAnnual: number;
    peBasicExclExtraTTM: number;
    peExclExtraAnnual: number;
    peExclExtraTTM: number;
    peInclExtraTTM: number;
    peNormalizedAnnual: number;
    peTTM: number;
    pegTTM: number;
    pfcfShareAnnual: number;
    pfcfShareTTM: number;
    pretaxMargin5Y: number;
    pretaxMarginAnnual: number;
    pretaxMarginTTM: number;
    "priceRelativeToS&P50013Week": number;
    "priceRelativeToS&P50026Week": number;
    "priceRelativeToS&P5004Week": number;
    "priceRelativeToS&P50052Week": number;
    "priceRelativeToS&P500Ytd": number;
    psAnnual: number;
    psTTM: number;
    ptbvAnnual: number;
    ptbvQuarterly: number;
    quickRatioAnnual: number;
    quickRatioQuarterly: number;
    receivablesTurnoverAnnual: number;
    receivablesTurnoverTTM: number;
    revenueEmployeeAnnual: number;
    revenueEmployeeTTM: number;
    revenueGrowth3Y: number;
    revenueGrowth5Y: number;
    revenueGrowthQuarterlyYoy: number;
    revenueGrowthTTMYoy: number;
    revenuePerShareAnnual: number;
    revenuePerShareTTM: number;
    revenueShareGrowth5Y: number;
    roa5Y: number;
    roaRfy: number;
    roaTTM: number;
    roe5Y: number;
    roeRfy: number;
    roeTTM: number;
    roi5Y: number;
    roiAnnual: number;
    roiTTM: number;
    tangibleBookValuePerShareAnnual: number;
    tangibleBookValuePerShareQuarterly: number;
    tbvCagr5Y: number;
    "totalDebt/totalEquityAnnual": number;
    "totalDebt/totalEquityQuarterly": number;
    yearToDatePriceReturnDaily: number;
  };
  metricType: string;
  series: {
    annual: {
      bookValue: any[];
      cashRatio: any[];
      currentRatio: any[];
      ebitPerShare: any[];
      eps: any[];
      ev: any[];
      evEbitda: any[];
      evRevenue: any[];
      fcfMargin: any[];
      grossMargin: any[];
      inventoryTurnover: any[];
      longtermDebtTotalAsset: any[];
      longtermDebtTotalCapital: any[];
      longtermDebtTotalEquity: any[];
      netDebtToTotalCapital: any[];
      netDebtToTotalEquity: any[];
      netMargin: any[];
      operatingMargin: any[];
      payoutRatio: any[];
      pb: any[];
      pe: any[];
      pfcf: any[];
      pretaxMargin: any[];
      ps: any[];
      ptbv: any[];
      quickRatio: any[];
      receivablesTurnover: any[];
      roa: any[];
      roe: any[];
      roic: any[];
      rotc: any[];
      salesPerShare: any[];
      sgaToSale: any[];
      tangibleBookValue: any[];
      totalDebtToEquity: any[];
      totalDebtToTotalAsset: any[];
      totalDebtToTotalCapital: any[];
      totalRatio: any[];
    };
    quarterly: {
      assetTurnoverTTM: any[];
      bookValue: any[];
      cashRatio: any[];
      currentRatio: any[];
      ebitPerShare: any[];
      eps: any[];
      ev: any[];
      evEbitdaTTM: any[];
      evRevenueTTM: any[];
      fcfMargin: any[];
      fcfPerShareTTM: any[];
      grossMargin: any[];
      inventoryTurnoverTTM: any[];
      longtermDebtTotalAsset: any[];
      longtermDebtTotalCapital: any[];
      longtermDebtTotalEquity: any[];
      netDebtToTotalCapital: any[];
      netDebtToTotalEquity: any[];
      netMargin: any[];
      operatingMargin: any[];
      payoutRatioTTM: any[];
      pb: any[];
      peTTM: any[];
      pfcfTTM: any[];
      pretaxMargin: any[];
      psTTM: any[];
      ptbv: any[];
      quickRatio: any[];
      receivablesTurnoverTTM: any[];
      roaTTM: any[];
      roeTTM: any[];
      roicTTM: any[];
      rotcTTM: any[];
      salesPerShare: any[];
      sgaToSale: any[];
      tangibleBookValue: any[];
      totalDebtToEquity: any[];
      totalDebtToTotalAsset: any[];
      totalDebtToTotalCapital: any[];
      totalRatio: any[];
    };
  };
  symbol: string;
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
