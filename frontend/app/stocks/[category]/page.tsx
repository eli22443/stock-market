import { notFound } from "next/navigation";
import { StockCategorized } from "@/types";
import StocksTable from "@/components/StocksTable";

const validCategories = ["most-active", "trending", "gainers", "losers"];

export default async function StocksCategory({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!validCategories.includes(category)) {
    notFound();
  }

  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api/stocks?category=${category}`
    : `http://localhost:3000/api/stocks?category=${category}`;

  /**show logs on console (browser) */
  // console.log("Fetching from API:", apiUrl);
  const response = await fetch(apiUrl);
  // console.log("API response status:", response.status);

  const data: StockCategorized = await response.json();

  return (
    <div className="flex justify-center">
      <StocksTable data={data} />
    </div>
  );
}
