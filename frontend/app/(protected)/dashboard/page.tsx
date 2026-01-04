"use client";

import { useAuthContext } from "@/context/AuthContext";

export default function Dashboard() {
  const auth = useAuthContext();

  // Middleware already protects this route - if we reach here, user is authenticated
  // We can safely use auth.user for display purposes
  return (
    <div className="dashboard-page px-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Dashboard content will go here. */}
      <p>Hello {auth?.user?.user_metadata?.full_name || "there"}!</p>
    </div>
  );
}
