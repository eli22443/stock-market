import StocksSlide from "@/components/StocksSlide";
import { StockRecord } from "@/types";

export default async function Home() {
  /**
   * Show market overview
   */
  let data: StockRecord[] = [];

  // Skip API calls during build (static generation)
  // The page will be hydrated with real data at runtime
  // if (process.env.NEXT_PHASE === 'phase-production-build') {
  //   // During build, return empty array
  //   // Data will be fetched client-side or on first request
  //   return (
  //     <div className="main-page">
  //       <div className="stocks-slide mt-20">
  //         <StocksSlide stocks={data} />
  //       </div>
  //     </div>
  //   );
  // }

  try {
    const apiUrl = process.env.NEXT_URL
      ? `${process.env.NEXT_URL}/api`
      : `http://localhost:3000/api`;

    const response = await fetch(apiUrl, {
      // Add cache control for build
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error fetching stocks:", errorData);
      // Use empty array as fallback
      data = [];
    } else {
      const jsonData = await response.json();
      // Ensure we have an array, not an error object
      if (Array.isArray(jsonData)) {
        data = jsonData;
      } else {
        console.error("API returned non-array data:", jsonData);
        data = [];
      }
    }
  } catch (error) {
    // Handle fetch errors (e.g., during build when server isn't running)
    console.error("Error fetching stocks:", error);
    data = [];
  }

  return (
    <div className="main-page">
      <div className="stocks-slide mt-20">
        <StocksSlide stocks={data} />
      </div>
    </div>
  );
}
