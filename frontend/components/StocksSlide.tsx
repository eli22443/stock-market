import StockCard from "./StockCard";
import type { StockRecord } from "@/types";
import { Card, CardContent } from "./ui/card";

export default function StocksSlide({ stocks }: { stocks: StockRecord[] }) {
  /**
   * Implement sliding windows of stocks
   */

  // Ensure stocks is an array and handle empty/undefined cases
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return (
      <Card className="mx-4 my-4">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No stock data available at the moment.</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rendered_stocks = stocks.slice(0, 5).map((stock, index) => (
    <div className="flex justify-center" key={index}>
      <StockCard stock={stock} />
    </div>
  ));

  return (
    <div className="grid grid-cols-1 mx-4 my-4 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {rendered_stocks}
    </div>
  );
}
