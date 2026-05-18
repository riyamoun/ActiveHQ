"""Tests for in-process TTL cache."""

from app.core.cache import cache_clear, cache_get, cache_set


def test_cache_ttl():
    cache_clear()
    cache_set("k", {"a": 1}, ttl_seconds=60)
    assert cache_get("k") == {"a": 1}
    cache_clear()
    assert cache_get("k") is None
