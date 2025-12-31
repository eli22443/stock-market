import yahooFinance from "yahoo-finance2";
import {
  CandleData,
  StockNewsRecord,
  MarketNewsRecord,
  ComprehensiveData,
} from "@/types";

/**
 * Yahoo Finance candle data type
 */
export type YahooFinanceCandle = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
};

/**
 * Convert resolution code to Yahoo Finance interval
 */
function getYahooInterval(resolution: string): string {
  const intervalMap: Record<string, string> = {
    "1": "1m", // 1 minute
    "5": "5m", // 5 minutes
    "15": "15m", // 15 minutes
    "30": "30m", // 30 minutes
    "60": "1h", // 1 hour
    D: "1d", // Daily
    W: "1wk", // Weekly
    M: "1mo", // Monthly
  };
  return intervalMap[resolution] || "1d";
}

/**
 * Fetch stock candles from Yahoo Finance
 * @param symbol Stock symbol (e.g., "AAPL")
 * @param resolution Time resolution ("1", "5", "15", "30", "60", "D", "W", "M")
 * @param from Optional Unix timestamp for start date
 * @param to Optional Unix timestamp for end date
 * @returns Array of candle data or null if error
 */
export async function fetchYahooFinanceCandles(
  symbol: string,
  resolution: string = "D",
  from?: number,
  to?: number
): Promise<YahooFinanceCandle[] | null> {
  try {
    const yh = new yahooFinance({ suppressNotices: ["yahooSurvey"] });
    const interval = getYahooInterval(resolution);

    // Convert Unix timestamps to Date objects
    // Default to 1 week ago if from not provided
    const period1 = from
      ? new Date(from * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const period2 = to ? new Date(to * 1000) : new Date();

    // Validate dates
    if (period1 > period2) {
      console.error("Invalid date range: period1 > period2");
      return null;
    }

    // Use chart module for intraday, historical module for daily/weekly/monthly
    // const isIntraday = ["1m", "5m", "15m", "30m", "1h"].includes(interval);

    let quote: YahooFinanceCandle[] = [];

    // Use chart module for intraday data and historical data (returns array format by default)
    const chartResult = await yh.chart(symbol, {
      period1,
      period2,
      interval: interval as
        | "1m"
        | "5m"
        | "15m"
        | "30m"
        | "1h"
        | "1d"
        | "1wk"
        | "1mo",
    });

    // Chart module returns ChartResultArray with quotes array
    if (chartResult?.quotes && Array.isArray(chartResult.quotes)) {
      quote = chartResult.quotes.map((item) => ({
        date: item.date,
        open: item.open ?? 0,
        high: item.high ?? 0,
        low: item.low ?? 0,
        close: item.close ?? 0,
        volume: item.volume ?? 0,
        adjClose: item.adjclose ?? undefined,
      }));
    }

    if (!quote || quote.length === 0) {
      console.warn(`No data found for symbol: ${symbol}`);
      return null;
    }

    // Ensure quote is an array
    const quoteArray = quote;

    // Convert to our format
    return quoteArray.map((item: any) => ({
      date: item.date,
      open: item.open ?? 0,
      high: item.high ?? 0,
      low: item.low ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
      adjClose: item.adjClose,
    }));
  } catch (error) {
    console.error("Error fetching Yahoo Finance candles:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for invalid symbol errors
      if (
        error.message.includes("Invalid symbol") ||
        error.message.includes("not found")
      ) {
        console.error(`Invalid symbol: ${symbol}`);
        return null;
      }
    }

    return null;
  }
}

/**
 * Fetch comprehensive stock data from Yahoo Finance
 * Works for both stocks and indices
 */
export async function fetchYahooComprehensiveData(
  symbol: string
): Promise<ComprehensiveData | null> {
  console.log("Fetching comprehensive data from Yahoo Finance...");

  try {
    const yh = new yahooFinance({ suppressNotices: ["yahooSurvey"] });

    // Fetch quote and quoteSummary in parallel
    const [quote, quoteSummary] = await Promise.all([
      yh.quote(symbol).catch(() => {
        console.error("quote promise rejected.");
        return null;
      }),
      yh
        .quoteSummary(symbol, {
          modules: [
            "summaryProfile",
            "summaryDetail",
            "defaultKeyStatistics",
            "calendarEvents",
            "financialData",
          ],
        })
        .catch(() => {
          console.error("quote-summary promise rejected.");
          return null;
        }),
    ]);

    if (!quote) {
      return null;
    }

    const summary = quoteSummary?.summaryDetail;
    const profile = quoteSummary?.summaryProfile;
    const keyStats = quoteSummary?.defaultKeyStatistics;
    const calendar = quoteSummary?.calendarEvents;
    const financial = quoteSummary?.financialData;

    // Calculate price change
    const currentPrice = quote.regularMarketPrice || 0;
    const previousClose = quote.regularMarketPreviousClose || currentPrice;
    const priceChange = currentPrice - previousClose;
    const priceChangePercent =
      previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;

    // Extract 52-week range
    const week52Low = quote.fiftyTwoWeekLow || currentPrice;
    const week52High = quote.fiftyTwoWeekHigh || currentPrice;

    // Extract day range
    const dayLow = quote.regularMarketDayLow || currentPrice;
    const dayHigh = quote.regularMarketDayHigh || currentPrice;

    // Extract earnings date
    let earningsDate: string = "0";
    if (calendar?.earnings?.earningsDate) {
      const dates = calendar.earnings.earningsDate;
      if (dates && dates.length > 0 && dates[0]) {
        // dates[0] is already a Date object, not a timestamp
        earningsDate = dates[0].toISOString().split("T")[0];
      }
    }

    const comprehensiveData: ComprehensiveData = {
      symbol: quote.symbol,
      name: quote.longName || quote.shortName,
      previousClose,
      open: quote.regularMarketOpen || currentPrice,
      bid: summary?.bid,
      bidSize: summary?.bidSize,
      ask: summary?.ask,
      askSize: summary?.askSize,
      dayRange: {
        low: dayLow,
        high: dayHigh,
      },
      week52Range: {
        low: week52Low,
        high: week52High,
      },
      volume: quote.regularMarketVolume,
      avgVolume: summary?.averageVolume,
      marketCap: quote.marketCap || keyStats?.marketCap,
      beta: keyStats?.beta,
      peRatio:
        (typeof summary?.trailingPE === "number"
          ? summary.trailingPE
          : undefined) ||
        (typeof keyStats?.trailingPE === "number"
          ? keyStats.trailingPE
          : undefined),
      eps:
        (typeof summary?.trailingEps === "number"
          ? summary.trailingEps
          : undefined) ||
        (typeof keyStats?.trailingEps === "number"
          ? keyStats.trailingEps
          : undefined),
      earningsDate,
      forwardDividend: summary?.dividendRate,
      forwardDividendYield:
        typeof summary?.dividendYield === "number"
          ? summary.dividendYield * 100
          : undefined,
      exDividendDate: summary?.exDividendDate
        ? summary.exDividendDate.toISOString().split("T")[0]
        : undefined,
      targetEstimate:
        typeof financial?.targetMeanPrice === "number"
          ? financial.targetMeanPrice
          : undefined,
      currentPrice,
      priceChange,
      priceChangePercent,
    };

    return comprehensiveData;
  } catch (error) {
    console.error(
      `Error fetching Yahoo Finance comprehensive data for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * Fetch company news from Yahoo Finance
 * @param symbol Stock symbol (e.g., "AAPL")
 * @returns Array of news articles or null if error
 */
export async function fetchYahooCompanyNews(
  symbol: string
): Promise<StockNewsRecord[] | null> {
  console.log("Fetching company news from Yahoo Finance...");
  try {
    const yh = new yahooFinance({ suppressNotices: ["yahooSurvey"] });

    // Fetch news for the symbol
    const newsResult = await yh.search(symbol, {
      newsCount: 50,
      quotesCount: 0,
    });

    if (!newsResult?.news || !Array.isArray(newsResult.news)) {
      return null;
    }

    // Convert Yahoo Finance news format to StockNewsRecord format
    const news: StockNewsRecord[] = newsResult.news.map((article) => {
      // Get image URL from thumbnail if available
      let imageUrl = "";
      if (
        article.thumbnail?.resolutions &&
        article.thumbnail.resolutions.length > 0
      ) {
        // Get the largest resolution
        const sortedResolutions = [...article.thumbnail.resolutions].sort(
          (a, b) => b.width * b.height - a.width * a.height
        );
        imageUrl = sortedResolutions[0].url;
      }

      return {
        category: article.type || "general",
        datetime: Math.floor(article.providerPublishTime.getTime() / 1000), // Convert to milliseconds
        headline: article.title,
        id: parseInt(article.uuid.replace(/-/g, "").substring(0, 10), 16) || 0, // Convert UUID to number
        image: imageUrl,
        related: symbol,
        source: article.publisher,
        summary: article.title, // Yahoo Finance doesn't provide summary in search results
        url: article.link,
      };
    });

    return news;
  } catch (error) {
    console.error(
      `Error fetching Yahoo Finance company news for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * Fetch general market news from Yahoo Finance
 * @returns Array of news articles or null if error
 */
export async function fetchYahooMarketNews(): Promise<
  MarketNewsRecord[] | null
> {
  try {
    const yh = new yahooFinance({ suppressNotices: ["yahooSurvey"] });

    // Fetch general market news (using a broad search term)
    const newsResult = await yh.search("market", {
      newsCount: 50,
      quotesCount: 0,
    });

    if (!newsResult?.news || !Array.isArray(newsResult.news)) {
      return null;
    }

    // Convert Yahoo Finance news format to MarketNewsRecord format
    const news: MarketNewsRecord[] = newsResult.news.map((article) => {
      // Get image URL from thumbnail if available
      let imageUrl = "";
      if (
        article.thumbnail?.resolutions &&
        article.thumbnail.resolutions.length > 0
      ) {
        // Get the largest resolution
        const sortedResolutions = [...article.thumbnail.resolutions].sort(
          (a, b) => b.width * b.height - a.width * a.height
        );
        imageUrl = sortedResolutions[0].url;
      }

      return {
        category: article.type || "general",
        datetime: Math.floor(article.providerPublishTime.getTime() / 1000), // Convert to milliseconds
        headline: article.title,
        id: parseInt(article.uuid.replace(/-/g, "").substring(0, 10), 16) || 0, // Convert UUID to number
        image: imageUrl,
        related: "",
        source: article.publisher,
        summary: article.title, // Yahoo Finance doesn't provide summary in search results
        url: article.link,
      };
    });

    return news;
  } catch (error) {
    console.error("Error fetching Yahoo Finance market news:", error);
    return null;
  }
}
