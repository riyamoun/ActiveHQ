"""
API Response utilities for consistent response formatting.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """
    Standard API response wrapper.
    
    Example:
        success: true
        data: {...}
        message: "Operation successful"
    """
    success: bool
    data: T | None = None
    message: str | None = None
    errors: dict[str, Any] | None = None


def success_response(
    data: Any = None,
    message: str = "Success",
) -> dict[str, Any]:
    """Create a success response."""
    return {
        "success": True,
        "data": data,
        "message": message,
    }


def error_response(
    message: str = "Error",
    errors: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create an error response."""
    return {
        "success": False,
        "message": message,
        "errors": errors,
    }


def paginated_response(
    data: list[Any],
    total: int,
    page: int,
    page_size: int,
    message: str = "Success",
) -> dict[str, Any]:
    """Create a paginated response."""
    total_pages = (total + page_size - 1) // page_size
    return {
        "success": True,
        "data": data,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        },
        "message": message,
    }


__all__ = [
    "ApiResponse",
    "success_response",
    "error_response",
    "paginated_response",
]
