"use client";

import { useEffect, useState } from "react";
import WatchlistView from "@/components/watchlists/WatchlistView";

export default function WatchlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [watchlistId, setWatchlistId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setWatchlistId(p.id));
  }, [params]);

  if (!watchlistId) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return <WatchlistView watchlistId={watchlistId} />;
}

