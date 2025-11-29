import StockList from "@/components/StockList";
import { fetchMultiStocksData } from "@/services/api";

export default async function Home() {
  const stocks = await fetchMultiStocksData();

  return (
    <div>
      <StockList stocks={stocks} />
    </div>
  );
}
