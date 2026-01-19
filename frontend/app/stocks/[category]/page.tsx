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

  const response = await fetch(apiUrl);
  if (!response.ok) {
    console.log(await response.json());
  }

  const data: StockCategorized = await response.json();

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-7xl">
        <StocksTable data={data} />
      </div>
    </div>
  );
}
