import ChartContainer from "@/components/charts/ChartContainer";
import { StockBar } from "@/components/StockBar";
import StockList from "@/components/StockList";
import NewsTable from "@/components/StockNews";
import { StockNewsRecord, ComprehensiveData, StockCandle } from "@/types";
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
  }: { stockData: ComprehensiveData; stockNews: StockNewsRecord[] } =
    await response.json();

  if (!stockData) {
    notFound();
  }

  /* Fetching candle data - hourly and daily */
  const lastYear = Date.now() / 1000 - 86400 * 365;
  const dailyRes = await fetch(
    `${process.env.NEXT_URL}/api/candles?symbol=${symbol}&resolution=D&from=${lastYear}`
  );
  if (!dailyRes.ok) {
    console.log(await dailyRes.json());
  }
  const candleD: StockCandle = await dailyRes.json();

  const lastWeek = Date.now() / 1000 - 86400 * 7;
  const hourlyRes = await fetch(
    `${process.env.NEXT_URL}/api/candles?symbol=${symbol}&resolution=1&from=${lastWeek}`
  );
  if (!hourlyRes.ok) {
    console.log(await hourlyRes.json());
  }
  const candle1: StockCandle = await hourlyRes.json();

  return (
    <div className="stock-page space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{stockData.name}</h2>
        <p className="text-muted-foreground text-lg">{stockData.symbol}</p>
      </div>

      {/* Current Price & Change */}
      <StockBar symbol={symbol} stockData={stockData} />

      {/* Stock graph */}
      <div className="stock-graph">
        <ChartContainer candleD={candleD} candle1={candle1} />
      </div>

      {/* Comprehensive data */}
      <StockList data={stockData} symbol={symbol} />

      {/* Stock news */}
      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold">Recent News: {symbol}</h2>
        <NewsTable symbol={symbol} stockNews={stockNews} />
      </div>
    </div>
  );
}
