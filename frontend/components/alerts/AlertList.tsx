"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import CreateAlertForm from "./CreateAlertForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

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


  if (loading) {
    return (
      <div className="alert-list p-6">
        <div className="text-center">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="alert-list p-4 sm:p-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Alerts</h1>
        {!showCreateForm && !editingAlert && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto"
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
      <div className="mb-4 flex gap-2 flex-wrap">
        <Button
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
        >
          All
        </Button>
        <Button
          onClick={() => setFilter("active")}
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
        >
          Active
        </Button>
        <Button
          onClick={() => setFilter("inactive")}
          variant={filter === "inactive" ? "default" : "outline"}
          size="sm"
        >
          Inactive
        </Button>
        <Button
          onClick={() => setFilter("triggered")}
          variant={filter === "triggered" ? "default" : "outline"}
          size="sm"
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
        <Card>
          <CardContent >
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alerts match the selected filter.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow
                      key={alert.id}
                      className={!alert.is_active ? "opacity-60" : ""}
                    >
                      <TableCell>
                        <Link
                          href={`/quote/${alert.symbol}`}
                          className="font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          {alert.symbol}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={alert.is_active ? "secondary" : "outline"}
                        >
                          {getAlertTypeLabel(alert.alert_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatThreshold(alert.alert_type, alert.threshold)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={alert.is_active ? "default" : "outline"}
                        >
                          {alert.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {alert.triggered_at && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                            Triggered
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {alert.triggered_at ? formatDate(alert.triggered_at) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={() => handleToggleActive(alert)}
                            variant={alert.is_active ? "outline" : "default"}
                            size="sm"
                          >
                            {alert.is_active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            onClick={() => setEditingAlert(alert)}
                            variant="outline"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteAlert(alert.id)}
                            variant="destructive"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
