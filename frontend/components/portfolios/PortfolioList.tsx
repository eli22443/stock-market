"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  total_value?: number;
  total_gain_loss?: number;
  total_gain_loss_percent?: number;
  holdings_count?: number;
}

export default function PortfolioList() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDescription, setNewPortfolioDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Fetch portfolios
  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/portfolios");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch portfolios");
      }

      const data = await response.json();

      // Fetch detailed data for each portfolio (to get totals and holdings count)
      const portfoliosWithDetails = await Promise.all(
        data.map(async (portfolio: Portfolio) => {
          try {
            const detailResponse = await fetch(
              `/api/portfolios/${portfolio.id}`
            );
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              return {
                ...portfolio,
                total_value: detailData.total_value || 0,
                total_gain_loss: detailData.total_gain_loss || 0,
                total_gain_loss_percent:
                  detailData.total_gain_loss_percent || 0,
                holdings_count: detailData.holdings?.length || 0,
              };
            }
          } catch {
            // If fetching details fails, just use 0
          }
          return {
            ...portfolio,
            total_value: 0,
            total_gain_loss: 0,
            total_gain_loss_percent: 0,
            holdings_count: 0,
          };
        })
      );

      setPortfolios(portfoliosWithDetails);
    } catch (err) {
      console.error("Error fetching portfolios:", err);
      setError("Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPortfolioName.trim()) {
      setError("Portfolio name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPortfolioName.trim(),
          description: newPortfolioDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create portfolio");
      }

      const newPortfolio = await response.json();

      // Reset form
      setNewPortfolioName("");
      setNewPortfolioDescription("");
      setShowCreateForm(false);

      // Refresh list
      await fetchPortfolios();

      // Navigate to the new portfolio
      router.push(`/portfolio/${newPortfolio.id}`);
    } catch (err: any) {
      console.error("Error creating portfolio:", err);
      setError(err.message || "Failed to create portfolio");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this portfolio? All holdings will be removed."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete portfolio");
      }

      // Refresh list
      await fetchPortfolios();
    } catch (err) {
      console.error("Error deleting portfolio:", err);
      setError("Failed to delete portfolio");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="portfolio-list p-6">
        <div className="text-center">Loading portfolios...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-list p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Portfolios</h1>
        {!showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="border-2 border-indigo-600"
          >
            + Create New Portfolio
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreatePortfolio}
          className="mb-6 p-4 border border-indigo-950 rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Create New Portfolio</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Retirement Portfolio"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={newPortfolioDescription}
                onChange={(e) => setNewPortfolioDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Long-term investments"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPortfolioName("");
                  setNewPortfolioDescription("");
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {portfolios.length === 0 ? (
        <div className="text-center py-12 border border-indigo-950 rounded-lg">
          <p className="text-gray-600 mb-4">
            You don't have any portfolios yet.
          </p>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            >
              Create Your First Portfolio
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="border border-indigo-950 rounded-lg p-4 hover:border-indigo-800 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="mb-2">
                    <Link
                      href={`/portfolio/${portfolio.id}`}
                      className="text-xl font-semibold text-indigo-500 hover:text-indigo-600"
                    >
                      {portfolio.name}
                    </Link>
                  </div>
                  {portfolio.description && (
                    <p className="text-gray-600 mb-3">
                      {portfolio.description}
                    </p>
                  )}
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Total Value: </span>
                      <span className="font-semibold">
                        {formatCurrency(portfolio.total_value || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Gain/Loss: </span>
                      <span
                        className={`font-semibold ${
                          (portfolio.total_gain_loss || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(portfolio.total_gain_loss || 0) >= 0 ? "+" : ""}
                        {formatCurrency(portfolio.total_gain_loss || 0)} (
                        {(portfolio.total_gain_loss_percent || 0) >= 0
                          ? "+"
                          : ""}
                        {(portfolio.total_gain_loss_percent || 0).toFixed(2)}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Holdings: </span>
                      <span className="font-semibold">
                        {portfolio.holdings_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="px-3 py-1 text-sm rounded hover:bg-indigo-200 border-2 border-indigo-600">
                    <Link href={`/portfolio/${portfolio.id}`}>View</Link>
                  </Button>
                  <Button
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    className="px-3 py-1 text-sm rounded hover:bg-red-200 border-2 border-red-600"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
