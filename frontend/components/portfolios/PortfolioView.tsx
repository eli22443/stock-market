"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import AddHoldingForm from "./AddHoldingForm";

interface Holding {
  id: string;
  symbol: string;
  shares: number;
  avg_price: number;
  purchased_at: string;
  notes: string | null;
  current_price?: number | null;
  current_value?: number | null;
  cost_basis?: number | null;
  gain_loss?: number | null;
  gain_loss_percent?: number | null;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  holdings: Holding[];
  total_value: number;
  total_cost_basis: number;
  total_gain_loss: number;
  total_gain_loss_percent: number;
}

export default function PortfolioView({
  portfolioId,
}: {
  portfolioId: string;
}) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPortfolio();
    // Refresh portfolio every 30 seconds to update prices
    // const interval = setInterval(fetchPortfolio, 30000);
    // return () => clearInterval(interval);
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/portfolios/${portfolioId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Portfolio not found");
          return;
        }
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch portfolio");
      }

      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
      setError("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!confirm("Remove this holding from the portfolio?")) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/holdings`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ holding_id: holdingId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove holding");
      }

      // Refresh portfolio
      await fetchPortfolio();
    } catch (err) {
      console.error("Error removing holding:", err);
      setError("Failed to remove holding");
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="portfolio-view p-6">
        <div className="text-center">Loading portfolio...</div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="portfolio-view p-6">
        <div className="text-center text-red-600">{error}</div>
        <Link
          href="/portfolio"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Back to Portfolios
        </Link>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="portfolio-view p-6">
      <div className="mb-6">
        <Link
          href="/portfolio"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Portfolios
        </Link>
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-gray-600">{portfolio.description}</p>
            )}
          </div>
          {!showAddForm && !editingHolding && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="border-2 border-indigo-600"
            >
              + Add Holding
            </Button>
          )}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="mb-6 p-6 border border-indigo-950 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Value</div>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolio.total_value)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Cost Basis</div>
            <div className="text-xl font-semibold">
              {formatCurrency(portfolio.total_cost_basis)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Gain/Loss</div>
            <div
              className={`text-xl font-semibold ${
                portfolio.total_gain_loss >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {portfolio.total_gain_loss >= 0 ? "+" : ""}
              {formatCurrency(portfolio.total_gain_loss)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Gain/Loss %</div>
            <div
              className={`text-xl font-semibold ${
                portfolio.total_gain_loss_percent >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {portfolio.total_gain_loss_percent >= 0 ? "+" : ""}
              {portfolio.total_gain_loss_percent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {(showAddForm || editingHolding) && (
        <div className="mb-6">
          <AddHoldingForm
            portfolioId={portfolioId}
            holding={editingHolding}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingHolding(null);
              fetchPortfolio();
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingHolding(null);
            }}
          />
        </div>
      )}

      {portfolio.holdings.length === 0 ? (
        <div className="text-center py-12 border border-indigo-950 rounded-lg">
          <p className="text-gray-600 mb-4">This portfolio is empty.</p>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            >
              Add Your First Holding
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-indigo-950 rounded-lg">
            <thead className="">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Symbol</th>
                <th className="px-4 py-3 text-right font-semibold">Shares</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Avg Price
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Current Price
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Current Value
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Cost Basis
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Gain/Loss
                </th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <tr
                  key={holding.id}
                  className="border-t border-indigo-950 hover"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/quote/${holding.symbol}`}
                      className="font-bold text-indigo-500 hover:text-indigo-600"
                    >
                      {holding.symbol}
                    </Link>
                    {holding.notes && (
                      <div className="text-xs text-gray-500 italic mt-1">
                        {holding.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(holding.shares)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(holding.avg_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {holding.current_price !== null &&
                    holding.current_price !== undefined
                      ? formatCurrency(holding.current_price)
                      : "Loading..."}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {holding.current_value !== null &&
                    holding.current_value !== undefined
                      ? formatCurrency(holding.current_value)
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {holding.cost_basis !== null &&
                    holding.cost_basis !== undefined
                      ? formatCurrency(holding.cost_basis)
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {holding.gain_loss !== null &&
                    holding.gain_loss !== undefined ? (
                      <div>
                        <div
                          className={`font-semibold ${
                            holding.gain_loss >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {holding.gain_loss >= 0 ? "+" : ""}
                          {formatCurrency(holding.gain_loss)}
                        </div>
                        {holding.gain_loss_percent !== null &&
                          holding.gain_loss_percent !== undefined && (
                            <div
                              className={`text-sm ${
                                holding.gain_loss_percent >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              ({holding.gain_loss_percent >= 0 ? "+" : ""}
                              {holding.gain_loss_percent.toFixed(2)}%)
                            </div>
                          )}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => setEditingHolding(holding)}
                        className="px-2 py-1 text-xs rounded hover:bg-indigo-200 border-2 border-indigo-600"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteHolding(holding.id)}
                        className="px-2 py-1 text-xs rounded hover:bg-red-200 border-2 border-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
