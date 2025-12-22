import { CandleData } from "@/types";
import StockPriceChart from "./StockPriceChart";

export default function ChartContainer({
  candle,
}: {
  candle: {
    symbol: string;
    resolution: `1` | `15` | `60` | `D` | `M`;
    data: CandleData;
  };
}) {
  /* Add controls for chart */
  /** Add time period selector (1D, 5D, 1M, 6M, 1Y) */
  return <StockPriceChart candle={candle} />;
}
