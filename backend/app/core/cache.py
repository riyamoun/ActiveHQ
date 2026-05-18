"""In-process TTL cache for read-heavy report endpoints (no Redis required)."""

from __future__ import annotations

import threading
import time
from typing import Any, TypeVar

T = TypeVar("T")

_lock = threading.Lock()
_store: dict[str, tuple[float, Any]] = {}


def cache_get(key: str) -> Any | None:
    now = time.monotonic()
    with _lock:
        row = _store.get(key)
        if not row:
            return None
        expires_at, value = row
        if expires_at <= now:
            _store.pop(key, None)
            return None
        return value


def cache_set(key: str, value: Any, ttl_seconds: int = 60) -> None:
    expires_at = time.monotonic() + ttl_seconds
    with _lock:
        _store[key] = (expires_at, value)


def cache_delete_prefix(prefix: str) -> None:
    with _lock:
        keys = [k for k in _store if k.startswith(prefix)]
        for k in keys:
            _store.pop(k, None)


def cache_clear() -> None:
    with _lock:
        _store.clear()
