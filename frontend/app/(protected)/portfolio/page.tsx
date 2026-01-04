"use client";

// Middleware already protects this route - if we reach here, user is authenticated
export default function Portfolio() {
  return (
    <div className="portfolio-page px-6">
      <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
      <p>Your portfolio content will go here.</p>
    </div>
  );
}

