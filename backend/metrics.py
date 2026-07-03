"""Runtime metrics collection for the API dashboard."""

from __future__ import annotations

import time
from datetime import datetime, timezone

import psutil

_started_at: float | None = None

ws_messages_received: int = 0
ws_messages_sent: int = 0
finnhub_messages_received: int = 0
http_requests_total: int = 0


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
