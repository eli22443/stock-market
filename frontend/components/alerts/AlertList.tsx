"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import CreateAlertForm from "./CreateAlertForm";

interface Alert {
  id: string;
  symbol: string;
  alert_type:
    | "price_above"
    | "price_below"
    | "price_change_percent"
    | "volume_spike";
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "triggered"
  >("all");
  const router = useRouter();

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/alerts");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (alert: Alert) => {
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

      // Refresh alerts
      await fetchAlerts();
    } catch (err) {
      console.error("Error updating alert:", err);
      setError("Failed to update alert");
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      // Refresh alerts
      await fetchAlerts();
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Failed to delete alert");
    }
  };

  const getAlertTypeLabel = (type: Alert["alert_type"]) => {
    switch (type) {
      case "price_above":
        return "Price Above";
      case "price_below":
        return "Price Below";
      case "price_change_percent":
        return "Price Change %";
      case "volume_spike":
        return "Volume Spike";
      default:
        return type;
    }
  };

  const formatThreshold = (type: Alert["alert_type"], threshold: number) => {
    switch (type) {
      case "price_above":
      case "price_below":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(threshold);
      case "price_change_percent":
        return `${threshold >= 0 ? "+" : ""}${threshold.toFixed(2)}%`;
      case "volume_spike":
        return threshold.toLocaleString("en-US");
      default:
        return threshold.toString();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "active") return alert.is_active;
    if (filter === "inactive") return !alert.is_active;
    if (filter === "triggered") return alert.triggered_at !== null;
    return true;
  });

  // Group alerts by status
  const activeAlerts = filteredAlerts.filter((a) => a.is_active);
  const inactiveAlerts = filteredAlerts.filter((a) => !a.is_active);

  if (loading) {
    return (
      <div className="alert-list p-6">
        <div className="text-center">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="alert-list p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Alerts</h1>
        {!showCreateForm && !editingAlert && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="border-2 border-indigo-600"
          >
            + Create New Alert
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filter buttons */}
      <div className="mb-4 flex gap-2">
        <Button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-sm rounded ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          All
        </Button>
        <Button
          onClick={() => setFilter("active")}
          className={`px-3 py-1 text-sm rounded ${
            filter === "active"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Active
        </Button>
        <Button
          onClick={() => setFilter("inactive")}
          className={`px-3 py-1 text-sm rounded ${
            filter === "inactive"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Inactive
        </Button>
        <Button
          onClick={() => setFilter("triggered")}
          className={`px-3 py-1 text-sm rounded ${
            filter === "triggered"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Triggered
        </Button>
      </div>

      {(showCreateForm || editingAlert) && (
        <div className="mb-6">
          <CreateAlertForm
            alert={editingAlert}
            onSuccess={() => {
              setShowCreateForm(false);
              setEditingAlert(null);
              fetchAlerts();
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingAlert(null);
            }}
          />
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-12 border border-indigo-950 rounded-lg">
          <p className="text-gray-600 mb-4">You don't have any alerts yet.</p>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            >
              Create Your First Alert
            </Button>
          )}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 border border-indigo-950 rounded-lg">
          <p className="text-gray-600">No alerts match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Alerts Section */}
          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-green-700">
                Active Alerts ({activeAlerts.length})
              </h2>
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-indigo-950 rounded-lg p-4 hover:border-indigo-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/quote/${alert.symbol}`}
                            className="text-xl font-bold text-indigo-500 hover:text-indigo-600"
                          >
                            {alert.symbol}
                          </Link>
                          <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded">
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                          {alert.triggered_at && (
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                              Triggered
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Threshold:{" "}
                          {formatThreshold(alert.alert_type, alert.threshold)}
                        </div>
                        {alert.triggered_at && (
                          <div className="text-xs text-yellow-700">
                            Triggered: {formatDate(alert.triggered_at)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggleActive(alert)}
                          className="px-3 py-1 text-sm rounded hover:bg-gray-200 border-2 border-gray-600"
                        >
                          Disable
                        </Button>
                        <Button
                          onClick={() => setEditingAlert(alert)}
                          className="px-3 py-1 text-sm rounded hover:bg-indigo-200 border-2 border-indigo-600"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="px-3 py-1 text-sm rounded hover:bg-red-200 border-2 border-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Alerts Section */}
          {inactiveAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-600">
                Inactive Alerts ({inactiveAlerts.length})
              </h2>
              <div className="space-y-3">
                {inactiveAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors opacity-75"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/quote/${alert.symbol}`}
                            className="text-xl font-bold text-gray-600 hover:text-gray-800"
                          >
                            {alert.symbol}
                          </Link>
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                          {alert.triggered_at && (
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                              Triggered
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          Threshold:{" "}
                          {formatThreshold(alert.alert_type, alert.threshold)}
                        </div>
                        {alert.triggered_at && (
                          <div className="text-xs text-gray-600">
                            Triggered: {formatDate(alert.triggered_at)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggleActive(alert)}
                          className="px-3 py-1 text-sm rounded hover:bg-green-200 border-2 border-green-600"
                        >
                          Enable
                        </Button>
                        <Button
                          onClick={() => setEditingAlert(alert)}
                          className="px-3 py-1 text-sm rounded hover:bg-indigo-200 border-2 border-indigo-600"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="px-3 py-1 text-sm rounded hover:bg-red-200 border-2 border-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
