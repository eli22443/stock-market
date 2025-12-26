import WorldIndicesTable from "@/components/WorldIndicesTable";

type WorldIndicesData = {
  indices: Array<{
    symbol: string;
    name: string;
    data: {
      c: number;
      d: number;
      dp: number;
      h: number;
      l: number;
      o: number;
      pc: number;
      t: number;
    };
    changePercent: number;
    priceRange: number;
    priceChange: number;
  }>;
  count: number;
};

export default async function WorldIndices() {
  const apiUrl = process.env.NEXT_URL
    ? `${process.env.NEXT_URL}/api/world-indices`
    : `http://localhost:3000/api/world-indices`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch indices data: ${response.statusText}`);
    }

    const data: WorldIndicesData = await response.json();

    if (!data || !data.indices || data.indices.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No indices data available</p>
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <WorldIndicesTable data={data} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching world indices:", error);
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">
          Failed to load indices data. Please try again later.
        </p>
      </div>
    );
  }
}
