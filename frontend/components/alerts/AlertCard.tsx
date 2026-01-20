"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuthContext } from "@/context/AuthContext";

interface Alert {
  id: string;
  symbol: string;
  alert_type: string;
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
}

export default function AlertCard() {
  const auth = useAuthContext();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousUserIdRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const userId = auth?.user?.id;

    if (!userId) {
      setLoading(false);
      previousUserIdRef.current = undefined;
      isFetchingRef.current = false;
      setAlerts([]);
      return;
    }

    // If user changed, reset fetch flag and clear data
    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId;
      isFetchingRef.current = false;
      setAlerts([]);
    }

    // Prevent duplicate concurrent fetches or refetching if we already have data for this user
    if (isFetchingRef.current || (!loading && alerts.length > 0 && previousUserIdRef.current === userId)) {
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;

    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts", {
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch alerts");
        }

        if (!abortController.signal.aborted) {
          const data = await response.json();
          setAlerts(data || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching alerts:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchAlerts();

    return () => {
      abortController.abort();
      isFetchingRef.current = false;
    };
  }, [auth?.user?.id]); // Removed router from dependencies - it's stable

  const handleToggleActive = async (alert: Alert) => {
    // Prevent multiple simultaneous toggles
    if (togglingIds.has(alert.id)) {
      return;
    }

    setTogglingIds((prev) => new Set(prev).add(alert.id));

    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !alert.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      // Optimistically update the alert in the list
      setAlerts((prevAlerts) =>
        prevAlerts.map((a) =>
          a.id === alert.id ? { ...a, is_active: !a.is_active } : a
        )
      );
    } catch (err) {
      console.error("Error updating alert:", err);
      // Revert optimistic update on error
      setAlerts((prevAlerts) =>
        prevAlerts.map((a) =>
          a.id === alert.id ? { ...a, is_active: alert.is_active } : a
        )
      );
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(alert.id);
        return next;
      });
    }
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getAlertTypeLabel = (type: string, threshold: number): string => {
    switch (type) {
      case "price_above":
        return `Price above $${formatNumber(threshold)}`;
      case "price_below":
        return `Price below $${formatNumber(threshold)}`;
      case "price_change_percent":
        return `Change ${threshold >= 0 ? "+" : ""}${threshold.toFixed(2)}%`;
      case "volume_spike":
        return `Volume spike: ${formatNumber(threshold)}`;
      default:
        return `${type}: $${formatNumber(threshold)}`;
    }
  };

  // Don't render if user is not authenticated
  if (!auth?.user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Alerts</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/alerts">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading alerts...</p>
        ) : alerts.length > 0 ? (
          <div className="space-y-1">
            {alerts.slice(0, 5).map((alert) => {
              const isToggling = togglingIds.has(alert.id);
              return (
                <div
                  key={alert.id}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{alert.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {getAlertTypeLabel(alert.alert_type, alert.threshold)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.triggered_at && (
                      <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded">
                        Triggered
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleActive(alert)}
                      disabled={isToggling}
                      className={`text-xs px-2 py-1 rounded transition-colors ${alert.is_active
                        ? "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30"
                        : "bg-gray-500/20 text-gray-600 hover:bg-gray-500/30"
                        } ${isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      title={alert.is_active ? "Click to deactivate" : "Click to activate"}
                    >
                      {isToggling
                        ? "..."
                        : alert.is_active
                          ? "Active"
                          : "Inactive"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">No alerts yet</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/alerts">Create Alert</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
