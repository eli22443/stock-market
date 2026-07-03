"""
FastAPI WebSocket Server for Real-time Stock Data
Connects to Finnhub WebSocket and broadcasts to connected clients
"""

import logging
import os
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
import time
from typing import Callable

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

import metrics
from websocket_manager import FinnhubWebSocketManager
from client_manager import ClientManager
from subscription_manager import SubscriptionManager
from ai_provider import AIProviderError, AIProviderRateLimitError, GeminiChatProvider
from chat_service import ChatRequestIn, ChatResponseBody, handle_chat_request

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

APP_VERSION = "1.0.0"
STATIC_DIR = Path(__file__).resolve().parent / "static"

finnhub_manager = FinnhubWebSocketManager()
client_manager = ClientManager()
subscription_manager = SubscriptionManager(finnhub_manager, client_manager)

API_DESCRIPTION = """
Real-Time Market Data API — WebSocket streaming, AI chat, health, and metrics.

## WebSocket `/ws`

**Client → server (subscribe):**
```json
{"action": "subscribe", "symbols": ["AAPL", "NVDA"]}
```

**Client → server (unsubscribe):**
```json
{"action": "unsubscribe", "symbols": ["AAPL"]}
```

**Server → client (connection):**
```json
{"type": "connection", "status": "connected", "client_id": "uuid"}
```

**Server → client (price update):**
```json
{
  "type": "price_update",
  "symbol": "AAPL",
  "data": {"price": 150.25, "volume": 1234567, "timestamp": 1234567890}
}
```

**Server → client (subscription ack):**
```json
{"type": "subscription", "status": "subscribed", "symbols": ["AAPL"]}
```
"""


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


def _health_payload(request: Request) -> dict:
    finnhub_ok = finnhub_manager.is_connected()
    return {
        "status": "healthy" if finnhub_ok else "degraded",
        "version": APP_VERSION,
        "server_time": metrics.server_time_iso(),
        "uptime_seconds": round(metrics.uptime_seconds(), 1),
        "api": "ok",
        "websocket": "ok" if finnhub_ok else "degraded",
        "finnhub_connection": "connected" if finnhub_ok else "disconnected",
        "ai_chat_enabled": getattr(request.app.state, "ai_chat_ready", False),
        "clients": client_manager.get_client_count(),
        "subscriptions": subscription_manager.get_subscription_count(),
        "subscribed_symbols": subscription_manager.get_subscribed_symbols(),
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    metrics.mark_started()
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

    print("🛑 Shutting down server...")
    await finnhub_manager.disconnect()
    print("✅ Disconnected from Finnhub WebSocket")


app = FastAPI(
    title="Real-Time Market Data API",
    description=API_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom access logger replaces uvicorn's built-in access log (disabled via
# access_log=False) so that requests show the real client IP instead of
# 127.0.0.1 when running behind nginx.  Reads X-Forwarded-For set by nginx;
# falls back to the socket peer for local development without a reverse proxy.
# Static asset requests are excluded to reduce log noise.
access_logger = logging.getLogger("access")

_QUIET_PREFIXES = ("/static",)


def _real_ip(request: Request) -> str:
    """Extract the original client IP from X-Forwarded-For (set by nginx), or
    fall back to the direct socket address for local dev."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@app.middleware("http")
async def access_log_middleware(request: Request, call_next):
    path = request.url.path
    if not path.startswith(_QUIET_PREFIXES):
        metrics.http_requests_total += 1

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000

    if not path.startswith(_QUIET_PREFIXES):
        access_logger.info(
            '%s - "%s %s" %s %.0fms',
            _real_ip(request),
            request.method,
            path,
            response.status_code,
            elapsed_ms,
        )

    return response


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
async def dashboard():
    """Serve the API platform dashboard."""
    index = STATIC_DIR / "index.html"
    if not index.is_file():
        raise HTTPException(status_code=500, detail="Dashboard not found")
    return FileResponse(index)


@app.get(
    "/health",
    summary="Health check",
    description=(
        "Operational health for load balancers and the dashboard. "
        "Returns service status, Finnhub connectivity, and subscription snapshot."
    ),
    responses={
        200: {
            "description": "Health snapshot",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "version": "1.0.0",
                        "server_time": "2026-07-03T11:00:00Z",
                        "uptime_seconds": 3600.5,
                        "api": "ok",
                        "websocket": "ok",
                        "finnhub_connection": "connected",
                        "ai_chat_enabled": True,
                        "clients": 2,
                        "subscriptions": 3,
                        "subscribed_symbols": ["AAPL", "NVDA"],
                    }
                }
            },
        }
    },
)
async def health(request: Request):
    return _health_payload(request)


@app.get(
    "/metrics",
    summary="Runtime metrics",
    description=(
        "Operational monitoring: message counters, HTTP traffic, CPU/memory, "
        "and subscription counts for the dashboard."
    ),
    responses={
        200: {
            "description": "Runtime metrics",
            "content": {
                "application/json": {
                    "example": {
                        "connected_clients": 2,
                        "active_subscriptions": 3,
                        "subscribed_symbols": ["AAPL", "NVDA"],
                        "ws_messages_sent": 1240,
                        "ws_messages_received": 87,
                        "finnhub_messages_received": 980,
                        "http_requests_total": 412,
                        "uptime_seconds": 3600.5,
                        "cpu_percent": 12.4,
                        "memory_percent": 45.2,
                        "memory_used_mb": 128.0,
                        "server_time": "2026-07-03T11:00:00Z",
                    }
                }
            },
        }
    },
)
async def get_metrics():
    stats = metrics.system_stats()
    return {
        "connected_clients": client_manager.get_client_count(),
        "active_subscriptions": subscription_manager.get_subscription_count(),
        "subscribed_symbols": subscription_manager.get_subscribed_symbols(),
        "ws_messages_sent": metrics.ws_messages_sent,
        "ws_messages_received": metrics.ws_messages_received,
        "finnhub_messages_received": metrics.finnhub_messages_received,
        "http_requests_total": metrics.http_requests_total,
        "uptime_seconds": round(metrics.uptime_seconds(), 1),
        "server_time": metrics.server_time_iso(),
        **stats,
    }


@app.post(
    "/ai/chat",
    response_model=ChatResponseBody,
    summary="AI chat completion",
    description=(
        "Send a conversation to Gemini with moderation and per-IP rate limiting. "
        "Requires `GEMINI_API_KEY` on the server."
    ),
    responses={
        200: {"description": "Assistant reply with token usage"},
        429: {"description": "Rate limit exceeded (client or provider)"},
        502: {"description": "Upstream AI provider error"},
        503: {"description": "AI chat not configured"},
    },
)
async def ai_chat(http_request: Request, body: ChatRequestIn):
    if not getattr(app.state, "ai_chat_ready", False):
        raise HTTPException(
            status_code=503,
            detail="AI chat is not configured. Set GEMINI_API_KEY on the server.",
        )

    client_ip = _real_ip(http_request)

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
    """WebSocket endpoint for real-time stock subscriptions and price updates."""
    await websocket.accept()
    print(f"✅ New client connected: {websocket.client}")

    client_id = client_manager.add_client(websocket)

    async def ws_send(payload: dict) -> None:
        await websocket.send_json(payload)
        metrics.ws_messages_sent += 1

    try:
        await ws_send(
            {"type": "connection", "status": "connected", "client_id": client_id}
        )

        while True:
            data = await websocket.receive_json()
            metrics.ws_messages_received += 1

            action = data.get("action")
            symbols = data.get("symbols", [])

            if action == "subscribe":
                await subscription_manager.subscribe(client_id, symbols)
                await ws_send(
                    {"type": "subscription", "status": "subscribed", "symbols": symbols}
                )

            elif action == "unsubscribe":
                await subscription_manager.unsubscribe(client_id, symbols)
                await ws_send(
                    {
                        "type": "subscription",
                        "status": "unsubscribed",
                        "symbols": symbols,
                    }
                )

            else:
                await ws_send({"type": "error", "message": f"Unknown action: {action}"})

    except WebSocketDisconnect:
        print(f"❌ Client disconnected: {client_id}")
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
        reload=True,
        log_level="info",
        access_log=False,
    )
