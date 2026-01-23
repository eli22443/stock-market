"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";

interface Alert {
  id: string;
  symbol: string;
  alert_type:
    | "price_above"
    | "price_below"
    | "price_change_percent"
    | "volume_spike";
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAlertFormProps {
  alert?: Alert | null; // If provided, we're editing; otherwise, we're creating
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateAlertForm({
  alert,
  onSuccess,
  onCancel,
}: CreateAlertFormProps) {
  const [symbol, setSymbol] = useState("");
  const [alertType, setAlertType] =
    useState<Alert["alert_type"]>("price_above");
  const [threshold, setThreshold] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingSymbol, setIsValidatingSymbol] = useState(false);

  // If editing, populate form with existing values
  useEffect(() => {
    if (alert) {
      setSymbol(alert.symbol);
      setAlertType(alert.alert_type);
      setThreshold(alert.threshold.toString());
      setIsActive(alert.is_active);
    }
  }, [alert]);

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

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      setError("Threshold must be a positive number");
      return;
    }

    // Additional validation for price_change_percent
    if (alertType === "price_change_percent") {
      if (thresholdNum > 100 || thresholdNum < -100) {
        setError("Price change percent threshold must be between -100 and 100");
        return;
      }
    }

    // Validate symbol exists
    const isValidSymbol = await validateSymbol(symbol);
    if (!isValidSymbol) {
      setError("Invalid stock symbol. Please check and try again.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (alert) {
        // Update existing alert
        const updateData: any = {
          symbol: symbol.trim().toUpperCase(),
          alert_type: alertType,
          threshold: thresholdNum,
          is_active: isActive,
        };

        const response = await fetch(`/api/alerts/${alert.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update alert");
        }
      } else {
        // Create new alert
        const response = await fetch("/api/alerts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: symbol.trim().toUpperCase(),
            alert_type: alertType,
            threshold: thresholdNum,
            is_active: isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create alert");
        }
      }

      // Reset form
      setSymbol("");
      setAlertType("price_above");
      setThreshold("");
      setIsActive(true);

      // Call success callback
      onSuccess();
    } catch (err: any) {
      console.error("Error saving alert:", err);
      setError(err.message || "Failed to save alert");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThresholdLabel = () => {
    switch (alertType) {
      case "price_above":
      case "price_below":
        return "Price Threshold ($)";
      case "price_change_percent":
        return "Change Percentage (%)";
      case "volume_spike":
        return "Volume Threshold";
      default:
        return "Threshold";
    }
  };

  const getThresholdPlaceholder = () => {
    switch (alertType) {
      case "price_above":
      case "price_below":
        return "e.g., 150.00";
      case "price_change_percent":
        return "e.g., 5.0 (for ±5%)";
      case "volume_spike":
        return "e.g., 1000000";
      default:
        return "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border border-indigo-950 rounded-lg"
    >
      <h2 className="text-xl font-semibold mb-4">
        {alert ? "Edit Alert" : "Create New Alert"}
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
          />
          {isValidatingSymbol && (
            <p className="text-xs text-gray-500 mt-1">Validating symbol...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Alert Type <span className="text-red-500">*</span>
          </label>
          <select
            value={alertType}
            onChange={(e) => {
              setAlertType(e.target.value as Alert["alert_type"]);
              // Reset threshold when type changes
              setThreshold("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="price_above">Price Above</option>
            <option value="price_below">Price Below</option>
            <option value="price_change_percent">Price Change %</option>
            <option value="volume_spike">Volume Spike</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {getThresholdLabel()} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={getThresholdPlaceholder()}
            step="0.01"
            min={alertType === "price_change_percent" ? "-100" : "0.01"}
            max={alertType === "price_change_percent" ? "100" : undefined}
            required
          />
          {alertType === "price_change_percent" && (
            <p className="text-xs text-gray-500 mt-1">
              Enter a value between -100 and 100. This represents the percentage
              change threshold (e.g., 5.0 means ±5%).
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Only active alerts will be monitored and can trigger notifications.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || isValidatingSymbol}
            className="w-full sm:w-auto px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {isSubmitting
              ? alert
                ? "Updating..."
                : "Creating..."
              : alert
              ? "Update"
              : "Create"}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
