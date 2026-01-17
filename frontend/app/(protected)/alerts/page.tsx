"use client";

import AlertList from "@/components/alerts/AlertList";

// Middleware already protects this route - if we reach here, user is authenticated
export default function Alerts() {
  return <AlertList />;
}
