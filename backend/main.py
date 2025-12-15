"""
FastAPI WebSocket Server for Real-time Stock Data
Connects to Finnhub WebSocket and broadcasts to Next.js clients
"""

from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import managers (we'll create these next)
from websocket_manager import FinnhubWebSocketManager
from client_manager import ClientManager
from subscription_manager import SubscriptionManager

# Initialize managers
finnhub_manager = FinnhubWebSocketManager()
client_manager = ClientManager()
subscription_manager = SubscriptionManager(finnhub_manager, client_manager)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Connect to Finnhub WebSocket
    print("🚀 Starting server...")
    await finnhub_manager.connect()
    print("✅ Connected to Finnhub WebSocket")

    yield

    # Shutdown: Disconnect from Finnhub
    print("🛑 Shutting down server...")
    await finnhub_manager.disconnect()
    print("✅ Disconnected from Finnhub WebSocket")


# Create FastAPI app
app = FastAPI(
    title="Stock Market WebSocket Server",
    description="Real-time stock data via Finnhub WebSocket",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for Next.js frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Stock Market WebSocket Server",
        "finnhub_connected": finnhub_manager.is_connected(),
        "active_clients": client_manager.get_client_count(),
        "active_subscriptions": subscription_manager.get_subscription_count(),
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "finnhub_connection": (
            "connected" if finnhub_manager.is_connected() else "disconnected"
        ),
        "clients": client_manager.get_client_count(),
        "subscriptions": subscription_manager.get_subscription_count(),
        "subscribed_symbols": subscription_manager.get_subscribed_symbols(),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for Next.js clients

    Message format from client:
    {
        "action": "subscribe" | "unsubscribe",
        "symbols": ["AAPL", "NVDA", ...]
    }

    Message format to client:
    {
        "type": "price_update",
        "symbol": "AAPL",
        "data": {
            "price": 150.25,
            "change": 0.50,
            "changePercent": 0.33,
            "volume": 1234567,
            "timestamp": 1234567890
        }
    }
    """
    # Accept the WebSocket connection
    await websocket.accept()
    print(f"✅ New client connected: {websocket.client}")

    # Register client
    client_id = client_manager.add_client(websocket)

    try:
        # Send welcome message
        await websocket.send_json(
            {"type": "connection", "status": "connected", "client_id": client_id}
        )

        # Listen for messages from client
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            action = data.get("action")
            symbols = data.get("symbols", [])

            if action == "subscribe":
                # Subscribe to symbols
                await subscription_manager.subscribe(client_id, symbols)
                await websocket.send_json(
                    {"type": "subscription", "status": "subscribed", "symbols": symbols}
                )

            elif action == "unsubscribe":
                # Unsubscribe from symbols
                await subscription_manager.unsubscribe(client_id, symbols)
                await websocket.send_json(
                    {
                        "type": "subscription",
                        "status": "unsubscribed",
                        "symbols": symbols,
                    }
                )

            else:
                # Unknown action
                await websocket.send_json(
                    {"type": "error", "message": f"Unknown action: {action}"}
                )

    except WebSocketDisconnect:
        print(f"❌ Client disconnected: {client_id}")
        # Clean up: unsubscribe and remove client
        await subscription_manager.unsubscribe_all(client_id)
        client_manager.remove_client(client_id)
    except Exception as e:
        print(f"❌ Error with client {client_id}: {e}")
        client_manager.remove_client(client_id)


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Auto-reload on code changes (development)
        log_level="info",
    )
