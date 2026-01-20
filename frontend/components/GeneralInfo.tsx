"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuthContext } from "@/context/AuthContext";
import type { StockCategorized, StocksMetrics } from "@/types";
import AlertCard from "./alerts/AlertCard";

interface Portfolio {
  id: string;
  name: string;
  total_value?: number;
  total_gain_loss?: number;
  total_gain_loss_percent?: number;
  holdings_count?: number;
}

interface Watchlist {
  id: string;
  name: string;
  item_count?: number;
}


interface IndexData {
  symbol: string;
  name: string;
  data: {
    c: number;
    d: number;
    dp: number;
  };
  changePercent: number;
  priceChange: number;
}

type MarketSection = "trending" | "gainers" | "losers" | "most-active";

export default function GeneralInfo() {
  const auth = useAuthContext();
  const [activeSection, setActiveSection] = useState<MarketSection>("trending");
  const [marketData, setMarketData] = useState<StockCategorized | null>(null);
  const [indicesData, setIndicesData] = useState<IndexData[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userDataAbortControllerRef = useRef<AbortController | null>(null);
  const previousUserIdRef = useRef<string | undefined>(undefined);
  const isFetchingUserDataRef = useRef(false);

  // Fetch market data (trending, gainers, losers, most active)
  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchMarketData = async () => {
      try {
        const response = await fetch(
          `/api/stocks?category=${activeSection}`,
          { signal: abortController.signal }
        );
        if (response.ok && !abortController.signal.aborted) {
          const data: StockCategorized = await response.json();
          setMarketData(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching market data:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMarketData();

    return () => {
      abortController.abort();
    };
  }, [activeSection]);

  // Fetch world indices (only once on mount)
  useEffect(() => {
    let isMounted = true;

    const fetchIndices = async () => {
      try {
        const response = await fetch("/api/world-indices");
        if (response.ok && isMounted) {
          const data = await response.json();
          setIndicesData(data.indices || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching indices:", error);
        }
      }
    };

    fetchIndices();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch user data (portfolios, watchlists, alerts) if authenticated
  useEffect(() => {
    const userId = auth?.user?.id;

    if (!userId) {
      setUserDataLoading(false);
      previousUserIdRef.current = undefined;
      // Clear data when user logs out
      setPortfolios([]);
      setWatchlists([]);
      return;
    }

    // If user changed, clear previous user's data
    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId;
      isFetchingUserDataRef.current = false;
      setPortfolios([]);
      setWatchlists([]);
    }

    // Prevent duplicate concurrent fetches or refetching if we already have data
    if (isFetchingUserDataRef.current || (!userDataLoading && portfolios.length > 0)) {
      return;
    }

    // Cancel previous request if it exists
    if (userDataAbortControllerRef.current) {
      userDataAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    userDataAbortControllerRef.current = abortController;
    isFetchingUserDataRef.current = true;

    const fetchUserData = async () => {
      try {
        // Fetch portfolios
        const portfoliosRes = await fetch("/api/portfolios", {
          signal: abortController.signal,
        });
        if (portfoliosRes.ok && !abortController.signal.aborted) {
          const portfoliosData = await portfoliosRes.json();
          // Fetch detailed data for first 3 portfolios only (to keep it lightweight)
          const portfoliosWithDetails = await Promise.all(
            (portfoliosData || []).slice(0, 3).map(async (portfolio: Portfolio) => {
              if (abortController.signal.aborted) {
                return {
                  ...portfolio,
                  total_value: 0,
                  total_gain_loss: 0,
                  total_gain_loss_percent: 0,
                  holdings_count: 0,
                };
              }
              try {
                const detailResponse = await fetch(
                  `/api/portfolios/${portfolio.id}`,
                  { signal: abortController.signal }
                );
                if (detailResponse.ok && !abortController.signal.aborted) {
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
              } catch (error) {
                if (error instanceof Error && error.name !== "AbortError") {
                  // If fetching details fails, just use 0
                }
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
          if (!abortController.signal.aborted) {
            // Add remaining portfolios without details
            const remainingPortfolios = (portfoliosData || []).slice(3).map((p: Portfolio) => ({
              ...p,
              holdings_count: 0,
            }));
            setPortfolios([...portfoliosWithDetails, ...remainingPortfolios]);
          }
        }

        // Fetch watchlists
        if (!abortController.signal.aborted) {
          const watchlistsRes = await fetch("/api/watchlists", {
            signal: abortController.signal,
          });
          if (watchlistsRes.ok && !abortController.signal.aborted) {
            const watchlistsData = await watchlistsRes.json();
            // Fetch item count for each watchlist
            const watchlistsWithCounts = await Promise.all(
              (watchlistsData || []).map(async (watchlist: Watchlist) => {
                if (abortController.signal.aborted) {
                  return { ...watchlist, item_count: 0 };
                }
                try {
                  const itemsRes = await fetch(
                    `/api/watchlists/${watchlist.id}/items`,
                    { signal: abortController.signal }
                  );
                  if (itemsRes.ok && !abortController.signal.aborted) {
                    const items = await itemsRes.json();
                    return { ...watchlist, item_count: items.length };
                  }
                } catch (error) {
                  if (error instanceof Error && error.name !== "AbortError") {
                    // Ignore errors
                  }
                }
                return { ...watchlist, item_count: 0 };
              })
            );
            if (!abortController.signal.aborted) {
              setWatchlists(watchlistsWithCounts);
            }
          }
        }

      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching user data:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setUserDataLoading(false);
        }
        isFetchingUserDataRef.current = false;
      }
    };

    fetchUserData();

    return () => {
      abortController.abort();
      isFetchingUserDataRef.current = false;
    };
  }, [auth?.user?.id]); // Use user ID instead of user object for stable dependency

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="space-y-2">
      {/* Market Status - World Indices */}
      <Card>
        <CardHeader>
          <CardTitle>Market Status</CardTitle>
        </CardHeader>
        <CardContent>
          {indicesData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-1 text-sm">
              {indicesData.slice(0, 6).map((index) => (
                <Link
                  key={index.symbol}
                  href={`/quote/${index.symbol}`}
                  className="hover:bg-muted/50 p-3 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{index.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {index.symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(index.data.c)}</div>
                      <div
                        className={`text-sm ${index.priceChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {index.priceChange >= 0 ? "+" : ""}
                        {formatNumber(index.priceChange)} (
                        {index.changePercent >= 0 ? "+" : ""}
                        {index.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Loading market data...</p>
          )}
        </CardContent>
      </Card>

      {/* Trending / Gainers / Losers / Most Active */}
      <Card>
        <CardHeader>
          <CardTitle>Market Movers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Button
              variant={activeSection === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("trending")}
            >
              Trending
            </Button>
            <Button
              variant={activeSection === "gainers" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("gainers")}
            >
              Top Gainers
            </Button>
            <Button
              variant={activeSection === "losers" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("losers")}
            >
              Top Losers
            </Button>
            <Button
              variant={activeSection === "most-active" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("most-active")}
            >
              Most Active
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : marketData && marketData.stocks && marketData.stocks.length > 0 ? (
            <div className="space-y-1">
              {marketData.stocks.slice(0, 10).map((stock: StocksMetrics, idx: number) => (
                <Link
                  key={idx}
                  href={`/quote/${stock.symbol}`}
                  className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{stock.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {stock.name || stock.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${formatNumber(stock.data.c)}</div>
                    <div
                      className={`text-sm ${stock.priceChange >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {stock.priceChange >= 0 ? "+" : ""}
                      {formatNumber(stock.priceChange)} (
                      {stock.changePercent >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/stocks/${activeSection}`}>
                    View All {activeSection === "most-active" ? "Most Active" : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* User Data Section - Only show if authenticated */}
      {auth?.user && (
        <>
          <Separator />

          {/* Portfolios */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Portfolios</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/portfolio">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {userDataLoading ? (
                <p className="text-muted-foreground">Loading portfolios...</p>
              ) : portfolios.length > 0 ? (
                <div className="space-y-1">
                  {portfolios.slice(0, 3).map((portfolio) => (
                    <Link
                      key={portfolio.id}
                      href={`/portfolio/${portfolio.id}`}
                      className="block p-3 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{portfolio.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {portfolio.holdings_count || 0} holdings
                          </div>
                        </div>
                        {portfolio.total_value !== undefined && (
                          <div className="text-right">
                            <div className="font-bold">
                              ${formatNumber(portfolio.total_value)}
                            </div>
                            {portfolio.total_gain_loss_percent !== undefined && (
                              <div
                                className={`text-sm ${portfolio.total_gain_loss_percent >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                                  }`}
                              >
                                {portfolio.total_gain_loss_percent >= 0 ? "+" : ""}
                                {portfolio.total_gain_loss_percent.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">
                    No portfolios yet
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/portfolio">Create Portfolio</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Watchlists */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Watchlists</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/watchlist">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {userDataLoading ? (
                <p className="text-muted-foreground">Loading watchlists...</p>
              ) : watchlists.length > 0 ? (
                <div className="space-y-1">
                  {watchlists.slice(0, 3).map((watchlist) => (
                    <Link
                      key={watchlist.id}
                      href={`/watchlist/${watchlist.id}`}
                      className="block p-3 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{watchlist.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {watchlist.item_count || 0} stocks
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">
                    No watchlists yet
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/watchlist">Create Watchlist</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <AlertCard />
        </>
      )}

      {/* Login prompt for non-authenticated users */}
      {!auth?.user && !auth?.loading && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Sign In for More Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Sign in to track your portfolios, watchlists, and alerts.
              </p>
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
