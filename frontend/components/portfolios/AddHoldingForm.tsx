"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";

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
    <form
      onSubmit={handleSubmit}
      className="p-4 border border-indigo-950 rounded-lg"
    >
      <h2 className="text-xl font-semibold mb-4">
        {holding ? "Edit Holding" : "Add Holding to Portfolio"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Symbol <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AAPL"
            required
            maxLength={10}
            disabled={!!holding} // Can't change symbol when editing
          />
          {isValidatingSymbol && (
            <p className="text-xs text-gray-500 mt-1">Validating symbol...</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Shares <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10.5"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Average Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 150.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Purchase Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={purchasedAt}
            onChange={(e) => setPurchasedAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!!holding} // Can't change purchase date when editing
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Bought after earnings"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || isValidatingSymbol}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {isSubmitting
              ? holding
                ? "Updating..."
                : "Adding..."
              : holding
              ? "Update"
              : "Add"}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
