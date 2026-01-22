import WorldIndicesTable from "@/components/WorldIndicesTable";

// Force dynamic rendering for real-time indices data
export const dynamic = 'force-dynamic';

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
  try {
    const apiUrl = process.env.NEXT_URL
      ? `${process.env.NEXT_URL}/api/world-indices`
      : `http://localhost:3000/api/world-indices`;

    const response = await fetch(apiUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch indices data: ${response.statusText}`);
    }

    const data: WorldIndicesData = await response.json();

    if (!data || !data.indices || data.indices.length === 0) {
      return (
        <div className="flex justify-center items-center h-64 p-6">
          <p className="text-muted-foreground">No indices data available</p>
        </div>
      );
    }

    return (
      <div className="flex justify-center p-2">
        <div className="w-full max-w-7xl">
          <WorldIndicesTable data={data} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching world indices:", error);
    return (
      <div className="flex justify-center items-center h-64 p-6">
        <p className="text-muted-foreground">
          No indices data available. Please try again later.
        </p>
      </div>
    );
  }
}
