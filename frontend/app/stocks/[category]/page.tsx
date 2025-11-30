import { notFound } from "next/navigation";

export default async function StocksCategory({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  /**
   * Show tables of all stocks based on category
   */

  const { category } = await params;
  // Validate category exists by fetching from server
  const response = await fetch(`${process.env.NEXT_URL}/api/stocks`, {
    method: "GET",
    headers: {
      "Content-type": "application/table",
    },
  });

  const data: { categories: string[] } = await response.json();
  console.log(data.categories);
  if (!data.categories.includes(category)) {
    notFound();
  }

  return <div className=" flex justify-center">Stocks table of {category}</div>;
}
