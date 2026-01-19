"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export default function WatchlistList() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Fetch watchlists
  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/watchlists");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch watchlists");
      }

      const data = await response.json();

      // Fetch item count for each watchlist
      const watchlistsWithCounts = await Promise.all(
        data.map(async (watchlist: Watchlist) => {
          try {
            const itemsResponse = await fetch(
              `/api/watchlists/${watchlist.id}/items`
            );
            if (itemsResponse.ok) {
              const items = await itemsResponse.json();
              return { ...watchlist, item_count: items.length };
            }
          } catch {
            // If fetching items fails, just use 0
          }
          return { ...watchlist, item_count: 0 };
        })
      );

      setWatchlists(watchlistsWithCounts);
    } catch (err) {
      console.error("Error fetching watchlists:", err);
      setError("Failed to load watchlists");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWatchlistName.trim()) {
      setError("Watchlist name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWatchlistName.trim(),
          description: newWatchlistDescription.trim() || null,
          is_default: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create watchlist");
      }

      const newWatchlist = await response.json();

      // Reset form
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setShowCreateForm(false);

      // Refresh list
      await fetchWatchlists();

      // Navigate to the new watchlist
      router.push(`/watchlist/${newWatchlist.id}`);
    } catch (err: any) {
      console.error("Error creating watchlist:", err);
      setError(err.message || "Failed to create watchlist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this watchlist? All items will be removed."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/watchlists/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete watchlist");
      }

      // Refresh list
      await fetchWatchlists();
    } catch (err) {
      console.error("Error deleting watchlist:", err);
      setError("Failed to delete watchlist");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/watchlists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_default: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set default watchlist");
      }

      // Refresh list to show updated default status
      await fetchWatchlists();
    } catch (err) {
      console.error("Error setting default watchlist:", err);
      setError("Failed to set default watchlist");
    }
  };

  if (loading) {
    return (
      <div className="watchlist-list p-6">
        <div className="text-center">Loading watchlists...</div>
      </div>
    );
  }

  return (
    <div className="watchlist-list p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Watchlists</h1>
        {!showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Watchlist
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
          onSubmit={handleCreateWatchlist}
          className="mb-6 p-4 border border-indigo-950 rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Create New Watchlist</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tech Stocks"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={newWatchlistDescription}
                onChange={(e) => setNewWatchlistDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., My favorite tech companies"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={"secondary"}
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
              <Button
                variant={"destructive"}
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewWatchlistName("");
                  setNewWatchlistDescription("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {watchlists.length === 0 ? (
        <div className="text-center py-12 border border-indigo-950 rounded-lg">
          <p className="text-gray-600 mb-4">
            You don't have any watchlists yet.
          </p>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            >
              Create Your First Watchlist
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist.id}
              className="border border-indigo-950 rounded-lg p-4 hover:border-indigo-800 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/watchlist/${watchlist.id}`}
                      className="text-xl font-semibold text-indigo-500 hover:text-indigo-600"
                    >
                      {watchlist.name}
                    </Link>
                    {watchlist.is_default && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {watchlist.description && (
                    <p className="text-gray-600 mb-2">
                      {watchlist.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {watchlist.item_count || 0} item
                    {(watchlist.item_count || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size={"sm"}>
                    <Link href={`/watchlist/${watchlist.id}`}>View</Link>
                  </Button>
                  {!watchlist.is_default && (
                    <Button
                      variant={"secondary"}
                      size={"sm"}
                      onClick={() => handleSetDefault(watchlist.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant={"destructive"}
                    size={"sm"}
                    onClick={() => handleDeleteWatchlist(watchlist.id)}
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
