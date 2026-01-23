"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface Holding {
  id: string;
  symbol: string;
  shares: number;
  avg_price: number;
  purchased_at: string;
  notes: string | null;
}

interface AddHoldingFormProps {
  portfolioId: string;
  holding?: Holding | null; // If provided, we're editing; otherwise, we're adding
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddHoldingForm({
  portfolioId,
  holding,
  onSuccess,
  onCancel,
}: AddHoldingFormProps) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingSymbol, setIsValidatingSymbol] = useState(false);

  // If editing, populate form with existing values
  useEffect(() => {
    if (holding) {
      setSymbol(holding.symbol);
      setShares(holding.shares.toString());
      setAvgPrice(holding.avg_price.toString());
      // Format date for input (YYYY-MM-DD)
      const date = new Date(holding.purchased_at);
      setPurchasedAt(date.toISOString().split("T")[0]);
      setNotes(holding.notes || "");
    } else {
      // Set default date to today
      setPurchasedAt(new Date().toISOString().split("T")[0]);
    }
  }, [holding]);

  const validateSymbol = async (symbolValue: string) => {
    if (!symbolValue.trim()) {
      return false;
    }

    try {
      setIsValidatingSymbol(true);
      const response = await fetch(
        `/api/quote?symbol=${symbolValue.toUpperCase()}`
      );
      return response.ok;
    } catch {
      return false;
    } finally {
      setIsValidatingSymbol(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!symbol.trim()) {
      setError("Symbol is required");
      return;
    }

    const sharesNum = parseFloat(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError("Shares must be a positive number");
      return;
    }

    const avgPriceNum = parseFloat(avgPrice);
    if (isNaN(avgPriceNum) || avgPriceNum <= 0) {
      setError("Average price must be a positive number");
      return;
    }

    if (!purchasedAt) {
      setError("Purchase date is required");
      return;
    }

    // Validate symbol exists
    const isValidSymbol = await validateSymbol(symbol);
    if (!isValidSymbol) {
      setError("Invalid stock symbol. Please check and try again.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (holding) {
        // Update existing holding
        const response = await fetch(
          `/api/portfolios/${portfolioId}/holdings`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              holding_id: holding.id,
              shares: sharesNum,
              avg_price: avgPriceNum,
              notes: notes.trim() || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update holding");
        }
      } else {
        // Create new holding
        // Convert date to ISO string with time
        const purchaseDate = new Date(purchasedAt);
        purchaseDate.setHours(0, 0, 0, 0);

        const response = await fetch(
          `/api/portfolios/${portfolioId}/holdings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              symbol: symbol.trim().toUpperCase(),
              shares: sharesNum,
              avg_price: avgPriceNum,
              purchased_at: purchaseDate.toISOString(),
              notes: notes.trim() || null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add holding");
        }
      }

      // Reset form
      setSymbol("");
      setShares("");
      setAvgPrice("");
      setPurchasedAt(new Date().toISOString().split("T")[0]);
      setNotes("");

      // Call success callback
      onSuccess();
    } catch (err: any) {
      console.error("Error saving holding:", err);
      setError(err.message || "Failed to save holding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {holding ? "Edit Holding" : "Add Holding to Portfolio"}
        </CardTitle>
        <CardDescription>
          {holding
            ? "Update the details of this holding"
            : "Add a new stock holding to track in your portfolio"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && <FieldError>{error}</FieldError>}

            <Field>
              <FieldLabel>
                Symbol <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL"
                  required
                  maxLength={10}
                  disabled={!!holding}
                />
                {isValidatingSymbol && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Validating symbol...
                  </p>
                )}
              </FieldContent>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>
                  Shares <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="e.g., 10.5"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>
                  Average Price <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
                    placeholder="e.g., 150.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>
                Purchase Date <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  type="date"
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                  required
                  disabled={!!holding}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Notes (optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Bought after earnings"
                  rows={3}
                />
              </FieldContent>
            </Field>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || isValidatingSymbol}
              >
                {isSubmitting
                  ? holding
                    ? "Updating..."
                    : "Adding..."
                  : holding
                  ? "Update"
                  : "Add"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
