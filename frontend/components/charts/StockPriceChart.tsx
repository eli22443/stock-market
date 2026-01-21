"use client";
import { CandleData } from "@/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  // BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ChartJS.register();

export default function StockPriceChart({
  candle,
}: {
  candle: {
    symbol: string;
    resolution: `1` | `5` | `15` | `30` | `60` | `D` | `W` | `M`;
    data: CandleData;
  };
}) {

  // Generate labels for all data points
  let labels: string[] = [];
  if (candle.resolution == "1") {
    labels = candle.data.t.map((timestamp) =>
      new Date(timestamp * 1000).toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
      })
    );
  } else if (candle.resolution == "D") {
    labels = candle.data.t.map((timestamp) =>
      new Date(timestamp * 1000).toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      })
    );
  } else {
    // Fallback for other resolutions
    labels = candle.data.t.map((timestamp) =>
      new Date(timestamp * 1000).toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      })
    );
  }

  // Calculate evenly spaced indices for approximately 10 labels
  const numLabels = Math.min(10, labels.length);
  const evenlySpacedIndices = new Set<number>();
  if (labels.length <= numLabels) {
    // If we have fewer data points than target labels, show all
    labels.forEach((_, index) => evenlySpacedIndices.add(index));
  } else {
    // Calculate evenly spaced indices (including first and last)
    const step = (labels.length - 1) / (numLabels - 1);
    for (let i = 0; i < numLabels; i++) {
      evenlySpacedIndices.add(Math.round(i * step));
    }
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Price",
        data: candle.data.c, // Close prices
        borderColor: "rgb(23, 109, 246)",
        borderWidth: 1.5, // Make line thinner (default is 3, lower = thinner)
        tension: 0.1,
        pointRadius: 0, // Hide points/circles (0 = invisible, higher = larger)
        pointHoverRadius: 4, // Show point on hover for better UX
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: `${candle.symbol} Stock Price`,
        color: "rgb(210, 202, 202)", // Change title color here
        font: {
          size: 18,
          weight: "bold" as const,
        },
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            const index = context[0].dataIndex;
            const timestamp = candle.data.t[index];
            const date = new Date(timestamp * 1000);
            return date.toLocaleString("en-US", {
              timeZone: "America/New_York",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            });
          },
          label: function (context: any) {
            const index = context.dataIndex;
            const close = candle.data.c[index];
            const open = candle.data.o[index];
            const high = candle.data.h[index];
            const low = candle.data.l[index];
            const volume = candle.data.v[index];

            // Format with consistent spacing for better alignment
            return [
              `Close: ${close.toFixed(2).padStart(16)}`,
              `Open:  ${open.toFixed(2).padStart(16)}`,
              `High:  ${high.toFixed(2).padStart(16)}`,
              `Low:   ${low.toFixed(2).padStart(16)}`,
              `Volume: ${volume.toLocaleString().padStart(15)}`,
            ];
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        bodyFont: {
          family: "monospace",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#e2dede", // Change x-axis label color here
          callback: function (value: any, index: number, ticks: any[]) {
            // For category scale, value is the index in the labels array
            const labelIndex = typeof value === "number" ? value : index;
            // Only show labels at evenly spaced indices
            if (evenlySpacedIndices.has(labelIndex)) {
              return labels[labelIndex];
            }
            return undefined; // Return undefined to hide tick labels we don't want
          },
          maxTicksLimit: numLabels + 2, // Allow slightly more ticks for better spacing
        },
        title: {
          display: true,
          text: "Date",
          color: "#e2dede", // Change x-axis title color here
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Change x-axis grid color here
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: "#e2dede", // Change y-axis label color here
        },
        title: {
          display: true,
          text: "Price ($)",
          color: "#e2dede", // Change y-axis title color here
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Change y-axis grid color here
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
