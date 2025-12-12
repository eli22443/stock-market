import StocksSlide from "@/components/StocksSlide";
import { StockRecord } from "@/types";

export default async function Home() {
  /**
   * Show market overview
   */
  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api`
    : `http://localhost:3000/api`;

  /**show logs on console (browser) */
  // console.log("Fetching from API:", apiUrl);
  const response = await fetch(apiUrl);
  // console.log("API response status:", response.status);

  const data: StockRecord[] = await response.json();

  return (
    <div className="main-page">
      <div className="stocks-slide mt-20">
        <StocksSlide stocks={data} />
      </div>
    </div>
  );
}
