import ChartContainer from "@/components/charts/ChartContainer";
import { StockBar } from "@/components/StockBar";
import StockList from "@/components/StockList";
import NewsTable from "@/components/StockNews";
import { StockNewsRecord, ComprehensiveStockData, StockCandle } from "@/types";
import { notFound } from "next/navigation";

/**
 * The main page of a stock.
 * Hhow stock graph, table data, news, stats...
 */

export default async function QuotePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  // Validate symbol exists by fetching stock data first
  // const stockData = await fetchStockData(symbol.toUpperCase());
  // if (!stockData) {
  //   notFound();
  // }

  // const stockNews: StockNews[] | null = await fetchCompanyNews(
  //   symbol.toUpperCase()
  // );
  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api/quote?symbol=${symbol}`
    : `http://localhost:3000/api/quote?symbol=${symbol}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    console.log(await response.json());
    notFound();
  }

  const {
    stockData,
    stockNews,
  }: { stockData: ComprehensiveStockData; stockNews: StockNewsRecord[] } =
    await response.json();

  if (!stockData) {
    notFound();
  }

  console.log(stockNews);
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  //Fetching candle data
  let from = Date.now() / 1000 - 86400 * 365;
  let to = from + 25 * 60 * 60;
  let res = await fetch(
    `${
      process.env.NEXT_URL
    }/api/candles?symbol=${symbol}&resolution=D&from=${from}&to=${null}`
  );
  if (!res.ok) {
    console.log(await res.json());
  }
  const candleD: StockCandle = await res.json();

  from = Date.now() / 1000 - 86400 * 7;
  to = from + 25 * 60 * 60;
  res = await fetch(
    `${
      process.env.NEXT_URL
    }/api/candles?symbol=${symbol}&resolution=1&from=${from}&to=${null}`
  );
  if (!res.ok) {
    console.log(await res.json());
  }
  const candle1: StockCandle = await res.json();

  return (
    <div className="stock-page px-6">
      <h2 className="text-2xl font-bold my-5">{symbol} Data</h2>

      {/* Current Price & Change */}
      <StockBar symbol={symbol} stockData={stockData} />

      {/* stock graph */}
      <div className="stock-graph border  mb-8">
        <ChartContainer candleD={candleD} candle1={candle1} />
      </div>

      {/* Comprehensive data */}
      <StockList data={stockData} symbol={symbol} />

      {/* Stock news */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mt-10 mb-5">News</h2>
        <NewsTable symbol={symbol} stockNews={stockNews} />
      </div>
    </div>
  );
}
