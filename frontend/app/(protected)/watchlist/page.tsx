"use client";

// Middleware already protects this route - if we reach here, user is authenticated
export default function Watchlist() {
  return (
    <div className="watchlist-page px-6">
      <h1 className="text-2xl font-bold mb-4">Watchlist</h1>
      <p>Your watchlist content will go here.</p>
    </div>
  );
}

