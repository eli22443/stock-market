"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import AddHoldingForm from "./AddHoldingForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { FieldError } from "../ui/field";
import { Badge } from "../ui/badge";

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
        <div className="text-center text-muted-foreground">Loading portfolio...</div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <Card className="portfolio-view">
        <CardContent >
          <div className="text-center space-y-4">
            <FieldError>{error}</FieldError>
            <Button asChild variant="outline">
              <Link href="/portfolio">← Back to Portfolios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="portfolio-view p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/portfolio">← Back to Portfolios</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{portfolio.name}</CardTitle>
              {portfolio.description && (
                <CardDescription className="text-base">
                  {portfolio.description}
                </CardDescription>
              )}
            </div>
            {!showAddForm && !editingHolding && (
              <Button onClick={() => setShowAddForm(true)}>
                + Add Holding
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-2xl font-bold">
                {formatCurrency(portfolio.total_value)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Cost Basis</div>
              <div className="text-xl font-semibold">
                {formatCurrency(portfolio.total_cost_basis)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Gain/Loss</div>
              <div
                className={`text-xl font-semibold ${portfolio.total_gain_loss >= 0
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {portfolio.total_gain_loss >= 0 ? "+" : ""}
                {formatCurrency(portfolio.total_gain_loss)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Gain/Loss %</div>
              <div
                className={`text-xl font-semibold ${portfolio.total_gain_loss_percent >= 0
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {portfolio.total_gain_loss_percent >= 0 ? "+" : ""}
                {portfolio.total_gain_loss_percent.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <FieldError>{error}</FieldError>}

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
        <Card>
          <CardContent >
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">This portfolio is empty.</p>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  Add Your First Holding
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.holdings.map((holding) => (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <Link
                          href={`/quote/${holding.symbol}`}
                          className="font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          {holding.symbol}
                        </Link>
                        {holding.notes && (
                          <div className="text-xs text-muted-foreground italic mt-1">
                            {holding.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(holding.shares)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(holding.avg_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.current_price !== null &&
                          holding.current_price !== undefined
                          ? formatCurrency(holding.current_price)
                          : "Loading..."}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.current_value !== null &&
                          holding.current_value !== undefined
                          ? formatCurrency(holding.current_value)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.cost_basis !== null &&
                          holding.cost_basis !== undefined
                          ? formatCurrency(holding.cost_basis)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.gain_loss !== null &&
                          holding.gain_loss !== undefined ? (
                          <div>
                            <div
                              className={`font-semibold ${holding.gain_loss >= 0
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
                                  className={`text-sm ${holding.gain_loss_percent >= 0
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
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={() => setEditingHolding(holding)}
                            variant="outline"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteHolding(holding.id)}
                            variant="destructive"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
