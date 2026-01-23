"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

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
        <div className="text-center text-muted-foreground">Loading watchlist...</div>
      </div>
    );
  }

  if (error && !watchlist) {
    return (
      <Card className="watchlist-view">
        <CardContent >
          <div className="text-center space-y-4">
            <FieldError>{error}</FieldError>
            <Button asChild variant="outline">
              <Link href="/watchlist">← Back to Watchlists</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!watchlist) {
    return null;
  }

  return (
    <div className="watchlist-view p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/watchlist">← Back to Watchlists</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl">{watchlist.name}</CardTitle>
                {watchlist.is_default && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
              {watchlist.description && (
                <CardDescription>{watchlist.description}</CardDescription>
              )}
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
                + Add Stock
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {error && (
        <FieldError>{error}</FieldError>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Stock to Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStock}>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    Symbol <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="text"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL"
                      required
                      maxLength={10}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Notes (optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g., Watching for earnings"
                      rows={2}
                    />
                  </FieldContent>
                </Field>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    type="submit"
                    disabled={isAdding}
                  >
                    {isAdding ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSymbol("");
                      setNewNotes("");
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      {watchlist.items.length === 0 ? (
        <Card>
          <CardContent >
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">This watchlist is empty.</p>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  Add Your First Stock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {watchlist.items.map((item) => {
            const price = stockPrices[item.symbol];
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <Link
                          href={`/quote/${item.symbol}`}
                          className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          {item.symbol}
                        </Link>
                        {price ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-lg font-semibold">
                              ${formatPrice(price.price)}
                            </span>
                            <span
                              className={`text-sm font-medium ${price.change >= 0
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
                          <span className="text-muted-foreground text-sm">
                            Loading price...
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          Notes: {item.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(item.added_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRemoveStock(item.symbol)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
