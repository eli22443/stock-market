"use client";

import { useEffect, useState } from "react";
import PortfolioView from "@/components/portfolios/PortfolioView";

export default function PortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [portfolioId, setPortfolioId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setPortfolioId(p.id));
  }, [params]);

  if (!portfolioId) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return <PortfolioView portfolioId={portfolioId} />;
}
