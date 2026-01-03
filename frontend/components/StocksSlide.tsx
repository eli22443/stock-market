import StockCard from "./StockCard";
import type { StockRecord } from "@/types";

export default function StocksSlide({ stocks }: { stocks: StockRecord[] }) {
  /**
   * Implement sliding windows of stocks
   */

  // Ensure stocks is an array and handle empty/undefined cases
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return (
      <div className="mx-4 my-4 text-center text-gray-500">
        <p>No stock data available at the moment.</p>
        <p className="text-sm mt-2">Please try again later.</p>
      </div>
    );
  }

  const rendered_stocks = stocks.slice(0, 4).map((stock, index) => (
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
