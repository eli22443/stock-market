"use client";

import { useSearchParams } from "next/navigation";
import PortfolioList from "@/components/portfolios/PortfolioList";
import PortfolioView from "@/components/portfolios/PortfolioView";

// Middleware already protects this route - if we reach here, user is authenticated
export default function Portfolio() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolio") || searchParams.get("id");

  // If a specific portfolio ID is provided, show the portfolio view
  if (portfolioId) {
    return <PortfolioView portfolioId={portfolioId} />;
  }

  // Otherwise, show the list of all portfolios
  return <PortfolioList />;
}
