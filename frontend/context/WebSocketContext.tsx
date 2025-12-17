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
    onConnect: () => console.log("Connected!"),
    onDisconnect: () => console.log("Disconnected"),
  });

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export function useStockWebSocketContext() {
  return useContext(WebSocketContext);
}
