"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import type {
  WebSocketConnectionState,
  ClientToServerMessage,
  ServerToClientMessage,
  PriceUpdateMessage,
  RealtimeStockPrice,
} from "@/types";

interface UseStockWebSocketOptions {
  /** WebSocket server URL (default: ws://localhost:8000/ws) */
  url?: string;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds (default: 3000) */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Callback when connection is established */
  onConnect?: () => void;
  /** Callback when connection is lost */
  onDisconnect?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Event) => void;
}

export interface UseStockWebSocketReturn {
  /** Current connection state */
  connectionState: WebSocketConnectionState;
  /** Whether WebSocket is connected */
  isConnected: boolean;
  /** Subscribe to stock symbols */
  subscribe: (symbols: string[]) => void;
  /** Unsubscribe from stock symbols */
  unsubscribe: (symbols: string[]) => void;
  /** Latest price updates for subscribed symbols */
  priceUpdates: Map<string, RealtimeStockPrice>;
  /** Get latest price for a specific symbol */
  getPrice: (symbol: string) => RealtimeStockPrice | undefined;
  /** Manually connect to WebSocket */
  connect: () => void;
  /** Manually disconnect from WebSocket */
  disconnect: () => void;
  /** Current number of reconnection attempts */
  reconnectAttemptsRef: RefObject<number>;
}

/**
 * Custom hook for managing WebSocket connection to stock market backend
 *
 * @example
 * ```tsx
 * const { subscribe, priceUpdates, isConnected } = useStockWebSocket({
 *   onConnect: () => console.log('Connected!'),
 * });
 *
 * useEffect(() => {
 *   subscribe(['AAPL', 'NVDA']);
 * }, []);
 * ```
 */
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

  /** Send message to WebSocket server */
  const sendMessage = useCallback((message: ClientToServerMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }, []);

  /** Subscribe to stock symbols */
  const subscribe = useCallback(
    (symbols: string[]) => {
      // Store subscribed symbols
      symbols.forEach((symbol) =>
        subscribedSymbolsRef.current.add(symbol.toUpperCase())
      );

      // Send subscribe message if connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          action: "subscribe",
          symbols: symbols.map((s) => s.toUpperCase()),
        });
      }
    },
    [sendMessage]
  );

  /** Handle incoming WebSocket messages */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ServerToClientMessage = JSON.parse(event.data);

        switch (message.type) {
          case "connection":
            setConnectionState("connected");
            reconnectAttemptsRef.current = 0;
            // onConnect?.();
            // Re-subscribe to previously subscribed symbols
            if (subscribedSymbolsRef.current.size > 0) {
              const symbols = Array.from(subscribedSymbolsRef.current);
              // Use sendMessage directly to avoid circular dependency
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                sendMessage({
                  action: "subscribe",
                  symbols: symbols.map((s) => s.toUpperCase()),
                });
              }
            }
            break;

          case "subscription":
            // Subscription confirmed, no action needed
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
    [onConnect, onError, sendMessage]
  );

  /** Unsubscribe from stock symbols */
  const unsubscribe = useCallback(
    (symbols: string[]) => {
      // Remove from subscribed symbols
      symbols.forEach((symbol) =>
        subscribedSymbolsRef.current.delete(symbol.toUpperCase())
      );

      // Send unsubscribe message if connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          action: "unsubscribe",
          symbols: symbols.map((s) => s.toUpperCase()),
        });
      }

      // Remove from price updates
      setPriceUpdates((prev) => {
        const newMap = new Map(prev);
        symbols.forEach((symbol) => newMap.delete(symbol.toUpperCase()));
        return newMap;
      });
    },
    [sendMessage]
  );

  /** Connect to WebSocket */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    isManualDisconnectRef.current = false;
    setConnectionState("connecting"); // check this line of code

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      // console.log("CREATES NEW SOCKET");

      ws.onopen = () => {
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        setConnectionState("error");
        onError?.(error);
      };

      ws.onclose = () => {
        setConnectionState("disconnected");
        wsRef.current = null;
        onDisconnect?.();

        // Auto-reconnect if enabled and not manually disconnected
        if (
          autoReconnect &&
          !isManualDisconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
            );
            connect();
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
    handleMessage,
  ]);

  /** Disconnect from WebSocket */
  const disconnect = useCallback(() => {
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
  }, []);

  /** Get latest price for a symbol */
  const getPrice = useCallback(
    (symbol: string): RealtimeStockPrice | undefined => {
      return priceUpdates.get(symbol.toUpperCase());
    },
    [priceUpdates]
  );

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - connect/disconnect are stable due to useCallback

  return {
    connectionState,
    isConnected: connectionState === "connected",
    subscribe,
    unsubscribe,
    priceUpdates,
    getPrice,
    connect,
    disconnect,
    reconnectAttemptsRef,
  };
}
