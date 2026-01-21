"use client";

import React, { useContext, useState } from "react";
import {
  useStockWebSocket,
  UseStockWebSocketReturn,
} from "@/hooks/useStockWebSocket";

const WebSocketContext = React.createContext<UseStockWebSocketReturn | null>(
  null
);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useStockWebSocket({
    onConnect: () => {
      if (process.env.NODE_ENV === "development") {
        console.log("WebSocket Connected!");
      }
    },
    onDisconnect: () => {
      if (process.env.NODE_ENV === "development") {
        console.log("WebSocket Disconnected");
      }
    },
  });

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export function useStockWebSocketContext() {
  return useContext(WebSocketContext);
}
