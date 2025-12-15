import StockCard from "./StockCard";
import type { StockRecord } from "@/types";

export default function StocksSlide({ stocks }: { stocks: StockRecord[] }) {
  /**
   * Implement sliding windows of stocks
   */

  const rendered_stocks = stocks.slice(0, 5).map((stock, index) => (
    <div className="mx-0 flex justify-center" key={index}>
      <StockCard stock={stock} />
    </div>
  ));

  return (
    <div className="grid grid-cols-1 mx-4 my-4 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2x1:grid-cols-5 ">
      {rendered_stocks}
    </div>
  );
}
