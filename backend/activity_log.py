"""In-memory recent activity log for the dashboard."""

from __future__ import annotations

from collections import deque
from datetime import datetime, timezone

_MAX_EVENTS = 50
_events: deque[dict] = deque(maxlen=_MAX_EVENTS)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def record_event(
    event_type: str,
    summary: str,
    *,
    level: str = "info",
) -> None:
    _events.appendleft(
        {
            "ts": _now_iso(),
            "type": event_type,
            "summary": summary,
            "level": level,
        }
    )


def get_events(limit: int = 50) -> list[dict]:
    cap = max(1, min(limit, _MAX_EVENTS))
    return list(_events)[:cap]
