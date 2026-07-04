"""Runtime metrics collection for the API dashboard."""

from __future__ import annotations

import time
from collections import deque
from datetime import datetime, timezone

import psutil

_started_at: float | None = None

ws_messages_received: int = 0
ws_messages_sent: int = 0
finnhub_messages_received: int = 0
http_requests_total: int = 0


class LatencyTracker:
    """Rolling window of recent latency samples."""

    def __init__(self, maxlen: int = 100) -> None:
        self._samples: deque[float] = deque(maxlen=maxlen)
        self._last_ms: float | None = None

    def record(self, ms: float) -> None:
        self._last_ms = ms
        self._samples.append(ms)

    def snapshot(self) -> dict:
        if not self._samples:
            return {"avg_ms": None, "last_ms": None, "samples": 0}
        avg = sum(self._samples) / len(self._samples)
        return {
            "avg_ms": round(avg, 1),
            "last_ms": round(self._last_ms or avg, 1),
            "samples": len(self._samples),
        }


rest_api_latency = LatencyTracker()
ai_chat_latency = LatencyTracker()
ws_message_latency = LatencyTracker()
finnhub_latency = LatencyTracker()


def mark_started() -> None:
    global _started_at
    _started_at = time.time()


def uptime_seconds() -> float:
    if _started_at is None:
        return 0.0
    return time.time() - _started_at


def server_time_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def system_stats() -> dict[str, float]:
    mem = psutil.virtual_memory()
    return {
        "cpu_percent": round(psutil.cpu_percent(interval=None), 1),
        "memory_percent": round(mem.percent, 1),
        "memory_used_mb": round(mem.used / (1024 * 1024), 1),
    }


def latency_snapshot() -> dict:
    return {
        "rest_api": rest_api_latency.snapshot(),
        "ai_chat": ai_chat_latency.snapshot(),
        "ws_message": ws_message_latency.snapshot(),
        "finnhub": finnhub_latency.snapshot(),
    }
