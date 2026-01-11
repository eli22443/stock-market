"use client";

import { useEffect, useState } from "react";

interface Watchlist {
  id: string;
  name: string;
  is_default: boolean;
}

interface AddToWatchlistProps {
  symbol: string;
  onSuccess?: () => void;
}

export default function AddToWatchlist({
  symbol,
  onSuccess,
}: AddToWatchlistProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showDialog) {
      fetchWatchlists();
    }
  }, [showDialog]);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/watchlists");

      if (!response.ok) {
        throw new Error("Failed to fetch watchlists");
      }

      const data = await response.json();
      setWatchlists(data);

      // Auto-select default watchlist if available
      const defaultWatchlist = data.find((w: Watchlist) => w.is_default);
      if (defaultWatchlist) {
        setSelectedWatchlistId(defaultWatchlist.id);
      } else if (data.length > 0) {
        setSelectedWatchlistId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching watchlists:", err);
      setError("Failed to load watchlists");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!selectedWatchlistId) {
      setError("Please select a watchlist");
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      const response = await fetch(
        `/api/watchlists/${selectedWatchlistId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: symbol.toUpperCase(),
            notes: notes.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to watchlist");
      }

      // Reset form
      setNotes("");
      setShowDialog(false);
      setError(null);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error adding to watchlist:", err);
      setError(err.message || "Failed to add to watchlist");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToDefault = async () => {
    const defaultWatchlist = watchlists.find((w) => w.is_default);
    if (!defaultWatchlist) {
      setError("No default watchlist found");
      return;
    }

    setSelectedWatchlistId(defaultWatchlist.id);
    await handleAddToWatchlist();
  };

  if (watchlists.length === 0 && !showDialog) {
    // Don't show button if no watchlists exist
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
      >
        Add to Watchlist
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Add {symbol} to Watchlist
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">Loading watchlists...</div>
            ) : watchlists.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">
                  You don't have any watchlists yet.
                </p>
                <a
                  href="/watchlist"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Create a watchlist first
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Watchlist
                  </label>
                  <select
                    value={selectedWatchlistId || ""}
                    onChange={(e) => setSelectedWatchlistId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {watchlists.map((watchlist) => (
                      <option key={watchlist.id} value={watchlist.id}>
                        {watchlist.name}
                        {watchlist.is_default ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Watching for earnings"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddToWatchlist}
                    disabled={isAdding || !selectedWatchlistId}
                    className="flex-1 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
                  >
                    {isAdding ? "Adding..." : "Add"}
                  </button>
                  {watchlists.some((w) => w.is_default) && (
                    <button
                      onClick={handleAddToDefault}
                      disabled={isAdding}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      title="Quick add to default watchlist"
                    >
                      Add to Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDialog(false);
                      setNotes("");
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

