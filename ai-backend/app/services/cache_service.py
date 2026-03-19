"""
Smart caching service — avoids re-processing unchanged students.

Strategy:
- Hash the student's assessment data to create a cache key
- If data hasn't changed since last processing, return cached result
- TTL-based expiry (default 24h) to ensure freshness
- In-memory cache with optional Redis backing for multi-instance deployments

This is the #1 cost saver: if a student's data hasn't changed, zero LLM calls.
"""

import hashlib
import json
import time
from typing import Any

# In-memory cache (swap for Redis in production via redis_cache below)
_cache: dict[str, dict] = {}

# Default TTL: 24 hours
DEFAULT_TTL = 86400


def _hash_data(data: Any) -> str:
    """Create a stable hash of input data for cache keying."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()[:16]


def make_cache_key(agent: str, target_id: str, input_data: dict) -> str:
    """Build a cache key from agent name + target + data hash.

    If the student's assessment data hasn't changed, the hash stays the same
    → cache hit → zero LLM calls → zero cost.
    """
    data_hash = _hash_data(input_data)
    return f"{agent}:{target_id}:{data_hash}"


def get_cached(key: str) -> dict | None:
    """Get cached result if it exists and hasn't expired."""
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() > entry["expires_at"]:
        del _cache[key]
        return None
    return entry["data"]


def set_cached(key: str, data: dict, ttl: int = DEFAULT_TTL) -> None:
    """Store result in cache with TTL."""
    _cache[key] = {
        "data": data,
        "expires_at": time.time() + ttl,
        "created_at": time.time(),
    }


def invalidate(agent: str, target_id: str) -> int:
    """Invalidate all cache entries for a specific agent + target."""
    prefix = f"{agent}:{target_id}:"
    keys_to_delete = [k for k in _cache if k.startswith(prefix)]
    for k in keys_to_delete:
        del _cache[k]
    return len(keys_to_delete)


def invalidate_all() -> int:
    """Clear entire cache."""
    count = len(_cache)
    _cache.clear()
    return count


def cache_stats() -> dict:
    """Return cache statistics."""
    now = time.time()
    valid = sum(1 for v in _cache.values() if now < v["expires_at"])
    return {
        "total_entries": len(_cache),
        "valid_entries": valid,
        "expired_entries": len(_cache) - valid,
    }
