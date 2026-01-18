# Real-Time Alert Notifications Plan

## 🎯 Overview

This plan implements real-time alert notifications using your existing FastAPI WebSocket server. When stock prices change and trigger alerts, users will receive instant notifications via WebSocket.

## ✅ Why This Plan Works Well

1. **Existing Infrastructure**: You already have WebSocket server and client hooks
2. **Real-Time**: Instant notifications when alerts trigger
3. **Efficient**: Reuses existing price update stream
4. **Scalable**: Server-side checking means alerts work even when user is offline
5. **User Experience**: Instant notifications without polling

## 📋 Architecture

```
┌─────────────────┐
│  Finnhub WS     │
│  (Price Data)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI Server │
│  - Receives price│
│  - Checks alerts │
│  - Sends notif   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js Client │
│  - Receives notif│
│  - Shows toast   │
│  - Updates UI    │
└─────────────────┘
```

## 🔧 Implementation Steps

### Phase 1: Backend - Alert Checking Logic

#### Step 1.1: Add Alert Service to FastAPI

**File:** `backend/alert_service.py` (NEW)

```python
"""
Alert checking service for FastAPI
Checks if price updates trigger any active alerts
"""
from typing import List, Dict, Optional
import asyncpg
import os
from datetime import datetime

class AlertService:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
    
    async def check_alerts(self, symbol: str, price: float, volume: Optional[int] = None) -> List[Dict]:
        """
        Check if price update triggers any active alerts
        
        Returns list of triggered alerts with user_id
        """
        async with self.db_pool.acquire() as conn:
            # Get all active alerts for this symbol
            alerts = await conn.fetch("""
                SELECT id, user_id, alert_type, threshold, symbol
                FROM alerts
                WHERE symbol = $1
                AND is_active = true
                AND triggered_at IS NULL
            """, symbol.upper())
            
            triggered = []
            
            for alert in alerts:
                should_trigger = False
                
                if alert['alert_type'] == 'price_above' and price >= alert['threshold']:
                    should_trigger = True
                elif alert['alert_type'] == 'price_below' and price <= alert['threshold']:
                    should_trigger = True
                elif alert['alert_type'] == 'volume_spike' and volume and volume >= alert['threshold']:
                    should_trigger = True
                # Note: price_change_percent requires previous price, handled separately
                
                if should_trigger:
                    # Update alert in database
                    await conn.execute("""
                        UPDATE alerts
                        SET triggered_at = $1
                        WHERE id = $2
                    """, datetime.utcnow(), alert['id'])
                    
                    triggered.append({
                        'alert_id': str(alert['id']),
                        'user_id': str(alert['user_id']),
                        'symbol': alert['symbol'],
                        'alert_type': alert['alert_type'],
                        'threshold': float(alert['threshold']),
                        'triggered_price': price,
                        'triggered_at': datetime.utcnow().isoformat()
                    })
            
            return triggered
```

#### Step 1.2: Integrate Alert Service into Subscription Manager

**File:** `backend/subscription_manager.py` (MODIFY)

Add alert checking when price updates arrive:

```python
from alert_service import AlertService

class SubscriptionManager:
    def __init__(self, finnhub_manager, client_manager, alert_service: Optional[AlertService] = None):
        # ... existing code ...
        self.alert_service = alert_service
    
    async def _handle_finnhub_message(self, message: dict):
        """Handle incoming message from Finnhub WebSocket"""
        if message.get("type") == "trade" and "data" in message:
            trades = message["data"]
            
            for trade in trades:
                symbol = trade.get("s", "").upper()
                price = trade.get("p")
                volume = trade.get("v", 0)
                
                if not symbol or price is None:
                    continue
                
                # Check alerts if alert service is available
                if self.alert_service:
                    triggered_alerts = await self.alert_service.check_alerts(symbol, price, volume)
                    
                    # Send alert notifications to affected users
                    for alert in triggered_alerts:
                        await self._send_alert_notification(alert)
                
                # ... existing price update broadcasting code ...
    
    async def _send_alert_notification(self, alert: dict):
        """Send alert notification to user's WebSocket connection"""
        user_id = alert['user_id']
        
        # Find all client connections for this user
        # Note: You'll need to track user_id -> client_id mapping
        client_ids = self.user_clients.get(user_id, [])
        
        notification = {
            "type": "alert_triggered",
            "data": {
                "alert_id": alert['alert_id'],
                "symbol": alert['symbol'],
                "alert_type": alert['alert_type'],
                "threshold": alert['threshold'],
                "triggered_price": alert['triggered_price'],
                "triggered_at": alert['triggered_at']
            }
        }
        
        for client_id in client_ids:
            await self.client_manager.send_to_client(client_id, notification)
```

#### Step 1.3: Add User Tracking to Client Manager

**File:** `backend/client_manager.py` (MODIFY)

Track which user is connected to which client:

```python
class ClientManager:
    def __init__(self):
        self.clients: Dict[str, WebSocket] = {}
        self.client_users: Dict[str, str] = {}  # client_id -> user_id
    
    def add_client(self, websocket: WebSocket, user_id: Optional[str] = None) -> str:
        client_id = str(uuid.uuid4())
        self.clients[client_id] = websocket
        if user_id:
            self.client_users[client_id] = user_id
        return client_id
    
    def get_user_clients(self, user_id: str) -> List[str]:
        """Get all client IDs for a user"""
        return [cid for cid, uid in self.client_users.items() if uid == user_id]
```

#### Step 1.4: Add Authentication to WebSocket Endpoint

**File:** `backend/main.py` (MODIFY)

Authenticate WebSocket connections to get user_id:

```python
from fastapi import WebSocket, WebSocketDisconnect, Query
import jwt  # or use Supabase JWT verification

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint with optional authentication"""
    await websocket.accept()
    
    user_id = None
    if token:
        # Verify JWT token and extract user_id
        try:
            # Use Supabase JWT verification
            # user_id = verify_supabase_token(token)
            pass
        except:
            pass
    
    # Register client with user_id
    client_id = client_manager.add_client(websocket, user_id)
    
    # ... rest of existing code ...
```

### Phase 2: Frontend - Alert Notification Hook

#### Step 2.1: Create Alert Notification Hook

**File:** `frontend/hooks/useAlertNotifications.ts` (NEW)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useStockWebSocket } from "./useStockWebSocket";

export interface AlertNotification {
  alert_id: string;
  symbol: string;
  alert_type: "price_above" | "price_below" | "price_change_percent" | "volume_spike";
  threshold: number;
  triggered_price: number;
  triggered_at: string;
}

interface UseAlertNotificationsReturn {
  notifications: AlertNotification[];
  clearNotification: (alertId: string) => void;
  clearAll: () => void;
}

export function useAlertNotifications(): UseAlertNotificationsReturn {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const { isConnected } = useStockWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Listen for alert notifications from WebSocket
    // This will be handled in useStockWebSocket hook
    const handleAlertNotification = (notification: AlertNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        setNotifications((prev) => 
          prev.filter((n) => n.alert_id !== notification.alert_id)
        );
      }, 10000);
    };

    // Register handler (you'll need to add this to useStockWebSocket)
    // wsHook.registerAlertHandler(handleAlertNotification);

    return () => {
      // Cleanup
    };
  }, [isConnected]);

  const clearNotification = useCallback((alertId: string) => {
    setNotifications((prev) => 
      prev.filter((n) => n.alert_id !== alertId)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, clearNotification, clearAll };
}
```

#### Step 2.2: Extend useStockWebSocket to Handle Alert Messages

**File:** `frontend/hooks/useStockWebSocket.ts` (MODIFY)

Add alert notification handling:

```typescript
export interface UseStockWebSocketReturn {
  // ... existing properties ...
  onAlertNotification?: (notification: AlertNotification) => void;
}

// In the message handler:
if (message.type === "alert_triggered") {
  if (onAlertNotification) {
    onAlertNotification(message.data);
  }
}
```

### Phase 3: Frontend - Notification Component

#### Step 3.1: Create Notification Toast Component

**File:** `frontend/components/notifications/AlertToast.tsx` (NEW)

```typescript
"use client";

import { useEffect } from "react";
import { AlertNotification } from "@/hooks/useAlertNotifications";

interface AlertToastProps {
  notification: AlertNotification;
  onClose: () => void;
}

export default function AlertToast({ notification, onClose }: AlertToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000); // Auto-close after 10s
    return () => clearTimeout(timer);
  }, [onClose]);

  const getAlertTypeLabel = (type: AlertNotification["alert_type"]) => {
    switch (type) {
      case "price_above":
        return "Price Above";
      case "price_below":
        return "Price Below";
      case "price_change_percent":
        return "Price Change %";
      case "volume_spike":
        return "Volume Spike";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50 animate-slide-in">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-bold text-lg mb-1">
            🚨 Alert Triggered: {notification.symbol}
          </div>
          <div className="text-sm">
            {getAlertTypeLabel(notification.alert_type)} - 
            Threshold: {formatPrice(notification.threshold)}
          </div>
          <div className="text-sm mt-1">
            Current Price: {formatPrice(notification.triggered_price)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

#### Step 3.2: Create Notification Container

**File:** `frontend/components/notifications/NotificationContainer.tsx` (NEW)

```typescript
"use client";

import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import AlertToast from "./AlertToast";

export default function NotificationContainer() {
  const { notifications, clearNotification } = useAlertNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <AlertToast
          key={notification.alert_id}
          notification={notification}
          onClose={() => clearNotification(notification.alert_id)}
        />
      ))}
    </div>
  );
}
```

#### Step 3.3: Add to Layout

**File:** `frontend/app/layout.tsx` (MODIFY)

Add NotificationContainer to your root layout:

```typescript
import NotificationContainer from "@/components/notifications/NotificationContainer";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <NotificationContainer />
      </body>
    </html>
  );
}
```

## 🔄 Alternative: Simpler Approach (Recommended for MVP)

If the above seems complex, here's a simpler approach that leverages your existing infrastructure:

### Simplified Plan

1. **Backend**: Add alert checking in `subscription_manager.py` when price updates arrive
2. **Backend**: Send alert notifications as a new message type via existing WebSocket
3. **Frontend**: Extend `useStockWebSocket` to handle `alert_triggered` messages
4. **Frontend**: Create simple notification component that listens to the hook

### Key Simplifications

- **No separate alert service**: Check alerts directly in subscription manager
- **No user tracking initially**: Send alerts to all connected clients (user can filter on frontend)
- **Use existing WebSocket connection**: No need for separate connection

## 📝 Implementation Checklist

### Backend
- [ ] Create database connection pool for Supabase
- [ ] Add alert checking logic to subscription manager
- [ ] Add `alert_triggered` message type
- [ ] Test alert triggering with sample data

### Frontend
- [ ] Extend `useStockWebSocket` to handle alert messages
- [ ] Create `useAlertNotifications` hook
- [ ] Create `AlertToast` component
- [ ] Create `NotificationContainer` component
- [ ] Add to root layout
- [ ] Test end-to-end flow

## 🚀 Recommended Implementation Order

1. **Start Simple**: Add alert checking to existing subscription manager
2. **Test Backend**: Verify alerts trigger correctly
3. **Add Frontend Hook**: Extend useStockWebSocket
4. **Add UI Component**: Create notification toast
5. **Polish**: Add animations, sounds, etc.

## ⚠️ Important Considerations

1. **Database Connection**: You'll need to connect FastAPI to Supabase PostgreSQL
   - Use `asyncpg` or `psycopg2` with connection pooling
   - Store connection string in environment variables

2. **Authentication**: WebSocket connections should be authenticated
   - Pass JWT token in WebSocket connection
   - Verify token and extract user_id
   - Only send alerts to authenticated users

3. **Performance**: 
   - Cache active alerts per symbol to reduce DB queries
   - Batch alert checks if multiple price updates arrive

4. **Price Change % Alerts**: 
   - Requires tracking previous price
   - Store last known price in memory or database
   - Calculate percentage change on each update

## 🎯 Next Steps

1. Review this plan
2. Decide on simplified vs full implementation
3. Start with backend alert checking
4. Test with Postman/curl
5. Move to frontend implementation

---

**Estimated Time**: 4-6 hours for full implementation, 2-3 hours for simplified version.

