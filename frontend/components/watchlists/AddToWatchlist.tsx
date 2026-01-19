"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

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
    // Don't show Button if no watchlists exist
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button>Add to Watchlist</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {symbol} to Watchlist</DialogTitle>
          <DialogDescription>
            Select a watchlist and optionally add notes for this stock.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <FieldError className="mt-2">{error}</FieldError>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading watchlists...
          </div>
        ) : watchlists.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No Watchlists</CardTitle>
              <CardDescription>
                You don't have any watchlists yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/watchlist">Create a watchlist first</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FieldGroup>
            <Field>
              <FieldLabel>Select Watchlist</FieldLabel>
              <FieldContent>
                <Select
                  value={selectedWatchlistId || undefined}
                  onValueChange={(value: string | null) => setSelectedWatchlistId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a watchlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {watchlists.map((watchlist) => (
                      <SelectItem key={watchlist.id} value={watchlist.id}>
                        {watchlist.name}
                        {watchlist.is_default ? " (Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Notes (optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Watching for earnings"
                  rows={3}
                />
              </FieldContent>
            </Field>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={handleAddToWatchlist}
                disabled={isAdding || !selectedWatchlistId}
                className="w-full sm:w-auto"
              >
                {isAdding ? "Adding..." : "Add"}
              </Button>
              {watchlists.some((w) => w.is_default) && (
                <Button
                  variant="secondary"
                  onClick={handleAddToDefault}
                  disabled={isAdding}
                  title="Quick add to default watchlist"
                  className="w-full sm:w-auto"
                >
                  Add to Default
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setNotes("");
                  setError(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogFooter>
          </FieldGroup>
        )}
      </DialogContent>
    </Dialog>
  );
}

