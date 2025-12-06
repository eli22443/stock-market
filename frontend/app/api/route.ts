import { NextResponse } from "next/server";
import axios from "axios";
import { cache } from "react";
import {
  type QuoteData,
  type StockRecord,
  type StockNewsRecord,
  type MarketNewsRecord,
  type ComprehensiveStockData,
  type CandleData,
  type FinancialData,
  type ProfileData,
  RecommendationData,
  EarningsCalendarData,
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
        earningsRes,
        // recommendationRes,
        // candlesRes,
      ] = await Promise.allSettled([
        // Basic quote data
        axios.get<QuoteData>(
          `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
        ),
        // Company profile (market cap, etc.)
        axios.get<ProfileData>(
          `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`
        ),
        // Company financials (PE ratio, EPS, etc.)
        axios.get<FinancialData>(
          `${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`
        ),
        // Earnings calendar
        axios.get<EarningsCalendarData>(
          `${BASE_URL}/calendar/earnings?from=2025-01-01&to=2025-12-31&symbol=${symbol}&token=${API_KEY}`
        ),

        // // Analyst recommendations (target estimates)
        // axios.get<RecommendationData>(
        //   `${BASE_URL}/stock/recommendation?symbol=${symbol}&token=${API_KEY}`
        // ),
        // 52-week range (using candles for 1 year)
        // axios.get(
        //   `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${
        //     Math.floor(Date.now() / 1000) - 31536000
        //   }&to=${Math.floor(Date.now() / 1000)}&token=${API_KEY}`
        // ),
      ]);

      if (
        quoteRes.status === "rejected" ||
        profileRes.status === "rejected" ||
        financialsRes.status === "rejected" ||
        earningsRes.status === "rejected"
      ) {
        console.log("REJECTED");
        return null;
      }

      const [quoteData, profileData, financialsData, earningsData] = [
        quoteRes.value.data,
        profileRes.value.data,
        financialsRes.value.data,
        earningsRes.value.data,
      ];
      // const candlesData: CandleData =
      //   candlesRes.status === "fulfilled" ? candlesRes.value.data : null;

      // if (!quoteData || quoteData.c === 0) {
      //   return null;
      // }

      // Calculate 52-week range from candles
      // if (candlesData && candlesData.l && candlesData.l.length > 0) {
      //   week52Low = Math.min(...candlesData.l);
      //   week52High = Math.max(...candlesData.h);
      // }

      // Get volume from candles (latest day)
      // if (candlesData && candlesData.v && candlesData.v.length > 0) {
      //   volume = candlesData.v[candlesData.v.length - 1] || 0;
      //   // Calculate average volume from last 30 days
      //   const recentVolumes = candlesData.v.slice(-30);
      //   if (recentVolumes.length > 0) {
      //     avgVolume = Math.round(
      //       recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length
      //     );
      //   }
      // }

      // Get target estimate from recommendations
      // let targetEstimate: number | undefined;
      // if (
      //   recommendationData &&
      //   Array.isArray(recommendationData) &&
      //   recommendationData.length > 0
      // ) {
      //   // Finnhub recommendation provides target price in some cases
      //   const latest = recommendationData[0];
      //   // Note: Finnhub recommendation endpoint structure may vary
      //   // You might need to use a different endpoint for target estimates
      // }

      // Try to fetch additional data (bid/ask, dividends, earnings)
      // const [] = await Promise.allSettled([
      //   // Dividends
      //   // axios.get(
      //   //   `${BASE_URL}/stock/dividend?symbol=${symbol}&from=2024-01-01&to=2025-12-31&token=${API_KEY}`
      //   // ),
      // ]);

      // const dividendsData =
      //   dividendsRes.status === "fulfilled" ? dividendsRes.value.data : null;

      // console.log(earningsData);

      // // Extract dividend info
      // let forwardDividend: number | undefined;
      // let forwardDividendYield: number | undefined;
      // let exDividendDate: string | undefined;
      // if (
      //   dividendsData &&
      //   Array.isArray(dividendsData) &&
      //   dividendsData.length > 0
      // ) {
      //   const latestDividend = dividendsData[0];
      //   forwardDividend = latestDividend.amount;
      //   exDividendDate = latestDividend.date;
      //   // Calculate yield if we have current price
      //   if (quoteData.c > 0 && forwardDividend) {
      //     forwardDividendYield = (forwardDividend / quoteData.c) * 100;
      //   }
      // }

      // Extract earnings date
      let earningsDate: string;
      const upcomingEarnings = earningsData.earningsCalendar.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];
      earningsDate = upcomingEarnings ? upcomingEarnings.date : "0";

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
          low: financialsData.metric["52WeekLow"],
          high: financialsData.metric["52WeekLow"],
        },
        volume: financialsData.metric["10DayAverageTradingVolume"],
        avgVolume: financialsData.metric["3MonthAverageTradingVolume"],

        // Company metrics from profile
        marketCap: profileData.marketCapitalization,

        // Financial metrics
        beta: financialsData.metric.beta,
        peRatio: financialsData.metric.peTTM,
        eps: financialsData.metric.epsTTM,

        //Ask/bid
        bid: -1,
        bidSize: 100,
        ask: -1,
        askSize: 100,

        // Dividends and dates
        earningsDate,
        forwardDividendYield: 0,
        exDividendDate: "0",
        targetEstimate: -1,

        // Additional data
        currentPrice: quoteData.c,
        priceChange: quoteData.d,
        priceChangePercent: quoteData.dp,
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
