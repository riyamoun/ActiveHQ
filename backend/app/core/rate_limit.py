"""
Rate limiting for API endpoints (e.g. login).
Uses in-memory store by default; can switch to Redis for multi-instance.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
