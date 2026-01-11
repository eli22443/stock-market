"use client";

import { useSearchParams } from "next/navigation";
import WatchlistList from "@/components/watchlists/WatchlistList";
import WatchlistView from "@/components/watchlists/WatchlistView";

// Middleware already protects this route - if we reach here, user is authenticated
export default function Watchlist() {
  const searchParams = useSearchParams();
  const watchlistId = searchParams.get("watchlist") || searchParams.get("id");

  // If a specific watchlist ID is provided, show the watchlist view
  if (watchlistId) {
    return <WatchlistView watchlistId={watchlistId} />;
  }

  // Otherwise, show the list of all watchlists
  return <WatchlistList />;
}

