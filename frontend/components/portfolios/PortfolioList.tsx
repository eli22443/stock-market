"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

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
        <div className="text-center text-muted-foreground">Loading portfolios...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-list p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Portfolios</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your investment portfolios and track performance
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
            + Create New Portfolio
          </Button>
        )}
      </div>

      {error && <FieldError>{error}</FieldError>}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Portfolio</CardTitle>
            <CardDescription>
              Create a new portfolio to track your investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePortfolio}>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="text"
                      value={newPortfolioName}
                      onChange={(e) => setNewPortfolioName(e.target.value)}
                      placeholder="e.g., Retirement Portfolio"
                      required
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Description (optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={newPortfolioDescription}
                      onChange={(e) => setNewPortfolioDescription(e.target.value)}
                      placeholder="e.g., Long-term investments"
                      rows={3}
                    />
                  </FieldContent>
                </Field>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPortfolioName("");
                      setNewPortfolioDescription("");
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

      {portfolios.length === 0 ? (
        <Card>
          <CardContent >
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">
                You don't have any portfolios yet.
              </p>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Your First Portfolio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {portfolios.map((portfolio) => (
            <Card
              key={portfolio.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Link
                        href={`/portfolio/${portfolio.id}`}
                        className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        {portfolio.name}
                      </Link>
                      {portfolio.description && (
                        <CardDescription className="mt-1">
                          {portfolio.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Value: </span>
                        <span className="font-semibold">
                          {formatCurrency(portfolio.total_value || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gain/Loss: </span>
                        <span
                          className={`font-semibold ${(portfolio.total_gain_loss || 0) >= 0
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
                        <span className="text-muted-foreground">Holdings: </span>
                        <Badge variant="secondary">
                          {portfolio.holdings_count || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" asChild>
                      <Link href={`/portfolio/${portfolio.id}`}>View</Link>
                    </Button>
                    <Button
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
