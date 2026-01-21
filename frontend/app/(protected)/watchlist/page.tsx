"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WatchlistList from "@/components/watchlists/WatchlistList";
import WatchlistView from "@/components/watchlists/WatchlistView";

// Component that uses useSearchParams - must be wrapped in Suspense
function WatchlistContent() {
  const searchParams = useSearchParams();
  const watchlistId = searchParams.get("watchlist") || searchParams.get("id");

  // If a specific watchlist ID is provided, show the watchlist view
  if (watchlistId) {
    return <WatchlistView watchlistId={watchlistId} />;
  }

  // Otherwise, show the list of all watchlists
  return <WatchlistList />;
}

// Middleware already protects this route - if we reach here, user is authenticated
export default function Watchlist() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchlistContent />
    </Suspense>
  );
}

