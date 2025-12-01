import { notFound } from "next/navigation";

const validCategories = ["most-active", "trending", "gainers", "losers"];

export default async function StocksCategory({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  /**
   * Show tables of all stocks based on category
   */

  const { category } = await params;

  // Validate category exists
  if (!validCategories.includes(category)) {
    notFound();
  }

  return <div className=" flex justify-center">Stocks table of {category}</div>;
}
