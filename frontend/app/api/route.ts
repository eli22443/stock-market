import { NextResponse } from "next/server";
import axios from "axios";
import { cache } from "react";
import type {
  QuoteData,
  StockRecord,
  StockNewsRecord,
  MarketNewsRecord,
  ComprehensiveStockData,
  CandleData,
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

// Comprehensive stock data fetch - similar to Yahoo Finance
export const fetchComprehensiveStockData = cache(
  async (symbol: string): Promise<ComprehensiveStockData | null> => {
    try {
      console.log(`Fetching comprehensive data for ${symbol}...`);

      // Fetch all data in parallel
      const [
        quoteRes,
        profileRes,
        financialsRes,
        recommendationRes,
        candlesRes,
      ] = await Promise.allSettled([
        // Basic quote data
        axios.get<QuoteData>(
          `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
        ),
        // Company profile (market cap, etc.)
        axios.get(
          `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`
        ),
        // Company financials (PE ratio, EPS, etc.)
        axios.get(
          `${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`
        ),
        // Analyst recommendations (target estimates)
        axios.get(
          `${BASE_URL}/stock/recommendation?symbol=${symbol}&token=${API_KEY}`
        ),
        // 52-week range (using candles for 1 year)
        axios.get(
          `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${
            Math.floor(Date.now() / 1000) - 31536000
          }&to=${Math.floor(Date.now() / 1000)}&token=${API_KEY}`
        ),
      ]);

      const quoteData =
        quoteRes.status === "fulfilled" ? quoteRes.value.data : null;
      const profileData =
        profileRes.status === "fulfilled" ? profileRes.value.data : null;
      const financialsData =
        financialsRes.status === "fulfilled" ? financialsRes.value.data : null;
      const recommendationData =
        recommendationRes.status === "fulfilled"
          ? recommendationRes.value.data
          : null;
      const candlesData: CandleData =
        candlesRes.status === "fulfilled" ? candlesRes.value.data : null;

      if (!quoteData || quoteData.c === 0) {
        return null;
      }

      // Calculate 52-week range from candles
      let week52Low = quoteData.l;
      let week52High = quoteData.h;
      if (candlesData && candlesData.l && candlesData.l.length > 0) {
        week52Low = Math.min(...candlesData.l);
        week52High = Math.max(...candlesData.h);
      }

      // Get volume from candles (latest day)
      let volume = 0;
      let avgVolume = 0;
      if (candlesData && candlesData.v && candlesData.v.length > 0) {
        volume = candlesData.v[candlesData.v.length - 1] || 0;
        // Calculate average volume from last 30 days
        const recentVolumes = candlesData.v.slice(-30);
        if (recentVolumes.length > 0) {
          avgVolume = Math.round(
            recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length
          );
        }
      }

      // Get target estimate from recommendations
      let targetEstimate: number | undefined;
      if (
        recommendationData &&
        Array.isArray(recommendationData) &&
        recommendationData.length > 0
      ) {
        // Finnhub recommendation provides target price in some cases
        const latest = recommendationData[0];
        // Note: Finnhub recommendation endpoint structure may vary
        // You might need to use a different endpoint for target estimates
      }

      // Try to fetch additional data (bid/ask, dividends, earnings)
      const [tickRes, dividendsRes, earningsRes] = await Promise.allSettled([
        // Tick data for bid/ask (if available)
        axios.get(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`),
        // Dividends
        axios.get(
          `${BASE_URL}/stock/dividend?symbol=${symbol}&from=2024-01-01&to=2025-12-31&token=${API_KEY}`
        ),
        // Earnings calendar
        axios.get(
          `${BASE_URL}/calendar/earnings?from=2025-01-01&to=2025-12-31&symbol=${symbol}&token=${API_KEY}`
        ),
      ]);

      const tickData =
        tickRes.status === "fulfilled" ? tickRes.value.data : null;
      const dividendsData =
        dividendsRes.status === "fulfilled" ? dividendsRes.value.data : null;
      const earningsData =
        earningsRes.status === "fulfilled" ? earningsRes.value.data : null;

      // Extract dividend info
      let forwardDividend: number | undefined;
      let forwardDividendYield: number | undefined;
      let exDividendDate: string | undefined;
      if (
        dividendsData &&
        Array.isArray(dividendsData) &&
        dividendsData.length > 0
      ) {
        const latestDividend = dividendsData[0];
        forwardDividend = latestDividend.amount;
        exDividendDate = latestDividend.date;
        // Calculate yield if we have current price
        if (quoteData.c > 0 && forwardDividend) {
          forwardDividendYield = (forwardDividend / quoteData.c) * 100;
        }
      }

      // Extract earnings date
      let earningsDate: string | undefined;
      if (
        earningsData &&
        earningsData.earningsCalendar &&
        Array.isArray(earningsData.earningsCalendar)
      ) {
        const upcomingEarnings = earningsData.earningsCalendar
          .filter((e: any) => new Date(e.date) >= new Date())
          .sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          )[0];
        if (upcomingEarnings) {
          earningsDate = upcomingEarnings.date;
        }
      }

      // Calculate price change
      const priceChange = quoteData.c - quoteData.pc;
      const priceChangePercent =
        quoteData.pc !== 0 ? (priceChange / quoteData.pc) * 100 : 0;

      const comprehensiveData: ComprehensiveStockData = {
        // Basic quote data
        previousClose: quoteData.pc,
        open: quoteData.o,
        dayRange: {
          low: quoteData.l,
          high: quoteData.h,
        },
        week52Range: {
          low: week52Low,
          high: week52High,
        },
        volume,
        avgVolume,

        // Company metrics from profile
        marketCap: profileData?.marketCapitalization,

        // Financial metrics
        beta: financialsData?.metric?.beta52WeekHigh,
        peRatio: financialsData?.metric?.peNormalizedAnnual,
        eps: financialsData?.metric?.epsNormalizedAnnual,

        // Dividends and dates
        forwardDividend,
        forwardDividendYield,
        exDividendDate,
        earningsDate,
        targetEstimate,

        // Additional data
        currentPrice: quoteData.c,
        priceChange,
        priceChangePercent,
      };

      return comprehensiveData;
    } catch (error) {
      console.error(`Error fetching comprehensive data for ${symbol}:`, error);
      return null;
    }
  }
);

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
