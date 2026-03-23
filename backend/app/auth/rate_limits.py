"""
Authentication rate limiting and security.
Prevents brute force attacks on login and registration.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address


# Create separate limiters for different endpoints
auth_limiter = Limiter(key_func=get_remote_address)

# Rate limit strategies
LOGIN_RATE_LIMIT = "10/minute"  # 10 attempts per minute
REGISTER_RATE_LIMIT = "5/minute"  # 5 registrations per minute
PASSWORD_CHANGE_RATE_LIMIT = "5/hour"  # 5 password changes per hour
REFRESH_TOKEN_RATE_LIMIT = "30/minute"  # Refresh is low-cost, allow more
