"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";

interface WatchlistItem {
  id: string;
  symbol: string;
  added_at: string;
  notes: string | null;
}

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  items: WatchlistItem[];
}

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function WatchlistView({
  watchlistId,
}: {
  watchlistId: string;
}) {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWatchlist();
  }, [watchlistId]);

  const fetchStockPrices = useCallback(async () => {
    if (!watchlist?.items || watchlist.items.length === 0) return;

    try {
      const symbols = watchlist.items.map((item) => item.symbol);
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`/api/quote?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            const stockData = data.stockData;
            return {
              symbol,
              price: stockData.currentPrice,
              change: stockData.priceChange,
              changePercent: stockData.priceChangePercent,
            };
          }
        } catch {
          // If fetching fails for one symbol, continue with others
        }
        return null;
      });

      const prices = await Promise.all(pricePromises);
      const priceMap: Record<string, StockPrice> = {};

      prices.forEach((price) => {
        if (price) {
          priceMap[price.symbol] = price;
        }
      });

      setStockPrices(priceMap);
    } catch (err) {
      console.error("Error fetching stock prices:", err);
    }
  }, [watchlist?.items]);

  useEffect(() => {
    if (watchlist?.items && watchlist.items.length > 0) {
      // Fetch immediately
      fetchStockPrices();
      // Refresh prices every 30 seconds
      const interval = setInterval(fetchStockPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchStockPrices]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/watchlists/${watchlistId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Watchlist not found");
          return;
        }
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch watchlist");
      }

      const data = await response.json();
      setWatchlist(data);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
      setError("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSymbol.trim()) {
      setError("Symbol is required");
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      const response = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: newSymbol.trim().toUpperCase(),
          notes: newNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add stock");
      }

      // Reset form
      setNewSymbol("");
      setNewNotes("");
      setShowAddForm(false);

      // Refresh watchlist
      await fetchWatchlist();
    } catch (err: any) {
      console.error("Error adding stock:", err);
      setError(err.message || "Failed to add stock");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStock = async (symbol: string) => {
    if (!confirm(`Remove ${symbol} from this watchlist?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove stock");
      }

      // Refresh watchlist
      await fetchWatchlist();
    } catch (err) {
      console.error("Error removing stock:", err);
      setError("Failed to remove stock");
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="watchlist-view p-6">
        <div className="text-center">Loading watchlist...</div>
      </div>
    );
  }

  if (error && !watchlist) {
    return (
      <div className="watchlist-view p-6">
        <div className="text-center text-red-600">{error}</div>
        <Link
          href="/watchlist"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Back to Watchlists
        </Link>
      </div>
    );
  }

  if (!watchlist) {
    return null;
  }

  return (
    <div className="watchlist-view p-6">
      <div className="mb-6">
        <Link
          href="/watchlist"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Watchlists
        </Link>
        <div className="flex justify-between items-start mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{watchlist.name}</h1>
              {watchlist.is_default && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Default
                </span>
              )}
            </div>
            {watchlist.description && (
              <p className="text-gray-600">{watchlist.description}</p>
            )}
          </div>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="border-2 border-indigo-600"
            >
              + Add Stock
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddStock}
          className="mb-6 p-4 border border-indigo-950 rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Add Stock to Watchlist</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Symbol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., AAPL"
                required
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Notes (optional)
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Watching for earnings"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isAdding}
                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewSymbol("");
                  setNewNotes("");
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

      {watchlist.items.length === 0 ? (
        <div className="text-center py-12 border border-indigo-950 rounded-lg">
          <p className="text-gray-600 mb-4">This watchlist is empty.</p>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            >
              Add Your First Stock
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.items.map((item) => {
            const price = stockPrices[item.symbol];
            return (
              <div
                key={item.id}
                className="border border-indigo-950 rounded-lg p-4 hover:border-indigo-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Link
                        href={`/quote/${item.symbol}`}
                        className="text-xl font-bold text-indigo-500 hover:text-indigo-600"
                      >
                        {item.symbol}
                      </Link>
                      {price ? (
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">
                            ${formatPrice(price.price)}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              price.change >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {price.change >= 0 ? "+" : ""}
                            {formatPrice(price.change)} (
                            {price.change >= 0 ? "+" : ""}
                            {price.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Loading price...</span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-gray-600 italic">
                        Notes: {item.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRemoveStock(item.symbol)}
                    className="px-3 py-1 text-sm rounded hover:bg-red-200 border-2 border-red-600"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
