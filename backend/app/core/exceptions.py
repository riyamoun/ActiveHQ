"""
Custom exceptions for the application.
"""

from fastapi import HTTPException, status


class ActiveHQException(Exception):
    """Base exception for ActiveHQ application."""
    pass


class AuthenticationError(ActiveHQException):
    """Raised when authentication fails."""
    pass


class AuthorizationError(ActiveHQException):
    """Raised when user lacks permission."""
    pass


class NotFoundError(ActiveHQException):
    """Raised when a resource is not found."""
    pass


class ValidationError(ActiveHQException):
    """Raised when validation fails."""
    pass


class TenantMismatchError(ActiveHQException):
    """Raised when gym_id doesn't match expected tenant."""
    pass


# HTTP Exceptions (pre-configured for common cases)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

permission_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Not enough permissions",
)

not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found",
)

tenant_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Access denied to this resource",
)
