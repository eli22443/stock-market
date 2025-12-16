"use client";

/**
 * SIMPLIFIED VERSION: Minimal useCallback usage
 * Only uses useCallback where ABSOLUTELY necessary
 * 
 * ⚠️ TRADE-OFFS:
 * - Exported functions change every render (consumers can't use in useEffect safely)
 * - Some functions recreated unnecessarily
 * - But simpler code, fewer dependencies to manage
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  WebSocketConnectionState,
  ClientToServerMessage,
  ServerToClientMessage,
  PriceUpdateMessage,
  RealtimeStockPrice,
} from "@/types";

interface UseStockWebSocketOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseStockWebSocketReturn {
  connectionState: WebSocketConnectionState;
  isConnected: boolean;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  priceUpdates: Map<string, RealtimeStockPrice>;
  getPrice: (symbol: string) => RealtimeStockPrice | undefined;
  connect: () => void;
  disconnect: () => void;
}

export function useStockWebSocket(
  options: UseStockWebSocketOptions = {}
): UseStockWebSocketReturn {
  const {
    url = "ws://localhost:8000/ws",
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>("disconnected");
  const [priceUpdates, setPriceUpdates] = useState<
    Map<string, RealtimeStockPrice>
  >(new Map());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const isManualDisconnectRef = useRef(false);

  // ============================================
  // ✅ MUST USE useCallback: Event Handler
  // ============================================
  /** Handle incoming WebSocket messages - ASSIGNED TO EVENT HANDLER */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ServerToClientMessage = JSON.parse(event.data);

        switch (message.type) {
          case "connection":
            setConnectionState("connected");
            reconnectAttemptsRef.current = 0;
            onConnect?.();
            // Re-subscribe to previously subscribed symbols
            if (subscribedSymbolsRef.current.size > 0) {
              const symbols = Array.from(subscribedSymbolsRef.current);
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    action: "subscribe",
                    symbols: symbols.map((s) => s.toUpperCase()),
                  })
                );
              }
            }
            break;

          case "subscription":
            break;

          case "price_update":
            const priceUpdate = message as PriceUpdateMessage;
            setPriceUpdates((prev) => {
              const newMap = new Map(prev);
              newMap.set(priceUpdate.symbol.toUpperCase(), {
                symbol: priceUpdate.symbol.toUpperCase(),
                price: priceUpdate.data.price,
                volume: priceUpdate.data.volume,
                timestamp: priceUpdate.data.timestamp,
              });
              return newMap;
            });
            break;

          case "error":
            console.error("WebSocket error:", message.message);
            onError?.(new ErrorEvent("error", { message: message.message }));
            break;

          default:
            console.warn("Unknown message type:", message);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    },
    [onConnect, onError]
  );

  // ============================================
  // ✅ MUST USE useCallback: Used in useEffect + depends on handleMessage
  // ============================================
  /** Connect to WebSocket - Used in useEffect */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isManualDisconnectRef.current = false;
    setConnectionState("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = handleMessage; // ✅ Uses handleMessage - needs stable reference

      ws.onerror = (error) => {
        setConnectionState("error");
        onError?.(error);
      };

      ws.onclose = () => {
        setConnectionState("disconnected");
        wsRef.current = null;
        onDisconnect?.();

        if (
          autoReconnect &&
          !isManualDisconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(); // Recursive call
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionState("error");
      onError?.(error as Event);
    }
  }, [
    url,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    onConnect,
    onDisconnect,
    onError,
    handleMessage, // ✅ Must include handleMessage
  ]);

  // ============================================
  // ❌ NO useCallback: Internal helpers (not exported, not in useEffect)
  // ============================================
  /** Send message - Internal helper, not exported */
  const sendMessage = (message: ClientToServerMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  };

  // ============================================
  // ⚠️ NO useCallback: Exported but simple (trade-off)
  // ============================================
  /** Subscribe to stock symbols - Exported but no useCallback */
  const subscribe = (symbols: string[]) => {
    symbols.forEach((symbol) =>
      subscribedSymbolsRef.current.add(symbol.toUpperCase())
    );

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({
        action: "subscribe",
        symbols: symbols.map((s) => s.toUpperCase()),
      });
    }
  };

  /** Unsubscribe from stock symbols - Exported but no useCallback */
  const unsubscribe = (symbols: string[]) => {
    symbols.forEach((symbol) =>
      subscribedSymbolsRef.current.delete(symbol.toUpperCase())
    );

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({
        action: "unsubscribe",
        symbols: symbols.map((s) => s.toUpperCase()),
      });
    }

    setPriceUpdates((prev) => {
      const newMap = new Map(prev);
      symbols.forEach((symbol) => newMap.delete(symbol.toUpperCase()));
      return newMap;
    });
  };

  /** Disconnect from WebSocket - Used in useEffect cleanup */
  const disconnect = () => {
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState("disconnected");
  };

  /** Get latest price - Exported but no useCallback */
  const getPrice = (symbol: string): RealtimeStockPrice | undefined => {
    return priceUpdates.get(symbol.toUpperCase());
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - connect/disconnect recreated but useEffect only runs once

  return {
    connectionState,
    isConnected: connectionState === "connected",
    subscribe, // ⚠️ Changes every render - consumers can't use in useEffect safely
    unsubscribe, // ⚠️ Changes every render
    priceUpdates,
    getPrice, // ⚠️ Changes every render
    connect, // ✅ Stable (has useCallback)
    disconnect, // ⚠️ Changes every render, but cleanup only runs once
  };
}

/**
 * COMPARISON:
 * 
 * ✅ KEPT useCallback for:
 * - handleMessage: Event handler (CRITICAL - prevents stale closure)
 * - connect: Used in useEffect + depends on handleMessage
 * 
 * ❌ REMOVED useCallback for:
 * - sendMessage: Internal helper only
 * - subscribe: Exported but simple (trade-off)
 * - unsubscribe: Exported but simple (trade-off)
 * - disconnect: Used in cleanup but only runs once
 * - getPrice: Exported but simple (trade-off)
 * 
 * TRADE-OFFS:
 * - Simpler code, fewer dependencies
 * - Exported functions change every render
 * - Consumers can't safely use subscribe/unsubscribe/getPrice in useEffect deps
 * - But if consumers just call them directly (not in deps), it works fine!
 */

