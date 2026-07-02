"""
FastAPI WebSocket Server for Real-time Stock Data
Connects to Finnhub WebSocket and broadcasts to connected clients
"""

import logging
import os
from collections import defaultdict, deque
from contextlib import asynccontextmanager
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import HTMLResponse

# Load environment variables
load_dotenv()

# Import managers (we'll create these next)
from websocket_manager import FinnhubWebSocketManager
from client_manager import ClientManager
from subscription_manager import SubscriptionManager
from ai_provider import AIProviderError, AIProviderRateLimitError, GeminiChatProvider
from chat_service import ChatRequestIn, ChatResponseBody, handle_chat_request

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Initialize managers
finnhub_manager = FinnhubWebSocketManager()
client_manager = ClientManager()
subscription_manager = SubscriptionManager(finnhub_manager, client_manager)


class SlidingWindowRateLimiter:
    """Per-key sliding window limiter (e.g. client IP)."""

    def __init__(self, max_calls: int, window_sec: float) -> None:
        self.max_calls = max_calls
        self.window_sec = window_sec
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        cutoff = now - self.window_sec
        dq = self._hits[key]
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= self.max_calls:
            return False
        dq.append(now)
        return True


_chat_limit = max(1, int(os.getenv("GEMINI_CHAT_RATE_LIMIT", "30")))
_chat_window = float(os.getenv("GEMINI_CHAT_RATE_WINDOW_SECONDS", "60"))
chat_rate_limiter = SlidingWindowRateLimiter(_chat_limit, _chat_window)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Connect to Finnhub WebSocket
    print("🚀 Starting server...")
    await finnhub_manager.connect()
    print("✅ Connected to Finnhub WebSocket")

    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    chat_model = os.getenv("GEMINI_CHAT_MODEL", "gemini-3.1-flash-lite")
    app.state.ai_chat_model = chat_model
    if api_key:
        chat_retries = max(1, int(os.getenv("GEMINI_CHAT_COMPLETION_MAX_RETRIES", "4")))
        app.state.ai_chat_provider = GeminiChatProvider(
            api_key=api_key, max_retries_on_transient=chat_retries
        )
        app.state.ai_chat_ready = True
        print("✅ Gemini chat is enabled")
    else:
        app.state.ai_chat_provider = None
        app.state.ai_chat_ready = False
        print("⚠️  GEMINI_API_KEY not set — POST /ai/chat will return 503")

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

# Configure CORS for browser clients (allowed origin from FRONTEND_URL)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root(request: Request):
    """Health check endpoint"""
    html_content = """
      <!DOCTYPE html>
      <html>
      <head>
          <title>WebSocket Subscriptions</title>
      </head>
      <body>
          <table border="1" cellpadding="10">
              <tr><th>Ticker</th><th>Live Price</th></tr>
              <tr><td>AAPL</td><td id="stock-AAPL">N/A</td></tr>
              <tr><td>GOOGL</td><td id="stock-GOOGL">N/A</td></tr>
              <tr><td>NVDA</td><td id="stock-NVDA">N/A</td></tr>
              <tr><td>META</td><td id="stock-META">N/A</td></tr>
              <tr><td>MSFT</td><td id="stock-MSFT">N/A</td></tr>
          </table>

          <script>
              const socket = new WebSocket("wss://api.stock-market-seven-delta.app/ws");

              // 1. Wait for connection to open, then subscribe to AAPL
              socket.onopen = function(event) {
                  const subscriptionMessage = {
                      action: "subscribe",
                      symbols: ["AAPL","GOOGL","NVDA","META","MSFT"]
                  };
                  socket.send(JSON.stringify(subscriptionMessage));
              };

              // 2. Receive filtered updates
              socket.onmessage = function(event) {
                  const data = JSON.parse(event.data);
                  const targetCell = document.getElementById(`stock-${data.symbol}`);
                  if (targetCell && data?.type == 'price_update') {
                      targetCell.innerText = `$${data.data.price}`;
                  }
              };
          </script>
      </body>
      </html>
      """
    return HTMLResponse(html_content)


@app.get("/health")
async def health(request: Request):
    """Detailed health check"""
    return {
        "status": "healthy",
        "finnhub_connection": (
            "connected" if finnhub_manager.is_connected() else "disconnected"
        ),
        "clients": client_manager.get_client_count(),
        "subscriptions": subscription_manager.get_subscription_count(),
        "subscribed_symbols": subscription_manager.get_subscribed_symbols(),
        "ai_chat_enabled": getattr(request.app.state, "ai_chat_ready", False),
    }


@app.post("/ai/chat", response_model=ChatResponseBody)
async def ai_chat(http_request: Request, body: ChatRequestIn):
    """
    Forward chat to Gemini with moderation, retries (in provider),
    usage logging, and per-IP rate limiting.
    """
    if not getattr(app.state, "ai_chat_ready", False):
        raise HTTPException(
            status_code=503,
            detail="AI chat is not configured. Set GEMINI_API_KEY on the server.",
        )

    forwarded = http_request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = http_request.client.host if http_request.client else "unknown"

    if not chat_rate_limiter.allow(client_ip):
        logger.warning("chat rate limit exceeded ip=%s", client_ip)
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again.",
        )

    provider = app.state.ai_chat_provider
    model = app.state.ai_chat_model
    try:
        return await handle_chat_request(body=body, provider=provider, chat_model=model)
    except AIProviderRateLimitError:
        raise HTTPException(
            status_code=429,
            detail="The AI service is busy. Please try again shortly.",
        ) from None
    except AIProviderError as e:
        logger.warning("AI provider error: %s", e)
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Please try again.",
        ) from None
    except Exception:
        logger.exception("ai_chat failed")
        raise HTTPException(
            status_code=502,
            detail="Could not complete the request. Please try again.",
        ) from None


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for connected clients

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

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Auto-reload on code changes (development)
        log_level="info",
    )
