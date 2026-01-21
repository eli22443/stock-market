"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PortfolioList from "@/components/portfolios/PortfolioList";
import PortfolioView from "@/components/portfolios/PortfolioView";

// Component that uses useSearchParams - must be wrapped in Suspense
function PortfolioContent() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolio") || searchParams.get("id");

  // If a specific portfolio ID is provided, show the portfolio view
  if (portfolioId) {
    return <PortfolioView portfolioId={portfolioId} />;
  }

  // Otherwise, show the list of all portfolios
  return <PortfolioList />;
}

// Middleware already protects this route - if we reach here, user is authenticated
export default function Portfolio() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
