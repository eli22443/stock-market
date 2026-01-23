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
        <div className="text-center text-muted-foreground">Loading watchlists...</div>
      </div>
    );
  }

  return (
    <div className="watchlist-list p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">My Watchlists</h1>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
            + Create New Watchlist
          </Button>
        )}
      </div>

      {error && <FieldError>{error}</FieldError>}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWatchlist}>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="text"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="e.g., Tech Stocks"
                      required
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Description (optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={newWatchlistDescription}
                      onChange={(e) => setNewWatchlistDescription(e.target.value)}
                      placeholder="e.g., My favorite tech companies"
                      rows={3}
                    />
                  </FieldContent>
                </Field>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    variant="outline"
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
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      {watchlists.length === 0 ? (
        <Card>
          <CardContent >
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">
                You don't have any watchlists yet.
              </p>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Your First Watchlist
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {watchlists.map((watchlist) => (
            <Card
              key={watchlist.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/watchlist/${watchlist.id}`}
                        className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        {watchlist.name}
                      </Link>
                      {watchlist.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    {watchlist.description && (
                      <CardDescription>{watchlist.description}</CardDescription>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {watchlist.item_count || 0} item
                      {(watchlist.item_count || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" asChild>
                      <Link href={`/watchlist/${watchlist.id}`}>View</Link>
                    </Button>
                    {!watchlist.is_default && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(watchlist.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWatchlist(watchlist.id)}
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
