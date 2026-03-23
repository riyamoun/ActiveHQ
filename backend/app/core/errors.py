"""
Structured error handling for ActiveHQ API.
All errors return a consistent format with error codes for client handling.
"""

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel


class ErrorCode(str, Enum):
    """API error codes for structured error handling."""
    
    # Auth errors (4001-4099)
    INVALID_CREDENTIALS = "AUTH_001"
    TOKEN_EXPIRED = "AUTH_002"
    TOKEN_INVALID = "AUTH_003"
    INSUFFICIENT_PERMISSIONS = "AUTH_004"
    USER_NOT_FOUND = "AUTH_005"
    USER_INACTIVE = "AUTH_006"
    
    # Validation errors (4201-4299)
    VALIDATION_ERROR = "VALID_001"
    INVALID_EMAIL = "VALID_002"
    WEAK_PASSWORD = "VALID_003"
    DUPLICATE_PHONE = "VALID_004"
    DUPLICATE_EMAIL = "VALID_005"
    
    # Resource errors (4041-4049)
    RESOURCE_NOT_FOUND = "RES_001"
    RESOURCE_CONFLICT = "RES_002"
    RESOURCE_DELETED = "RES_003"
    
    # Business logic errors (4221-4229)
    INSUFFICIENT_BALANCE = "BIZ_001"
    MEMBERSHIP_EXPIRED = "BIZ_002"
    ACTIVE_CHECKOUT_EXISTS = "BIZ_003"
    INVALID_CHECKOUT_STATE = "BIZ_004"
    
    # Server errors (5001-5999)
    INTERNAL_ERROR = "ERR_500"
    DATABASE_ERROR = "ERR_501"
    EXTERNAL_SERVICE_ERROR = "ERR_502"
    
    # Rate limiting (4291)
    RATE_LIMIT_EXCEEDED = "RATE_001"


class ErrorResponse(BaseModel):
    """Standard error response format."""
    
    error_code: str
    message: str
    detail: Optional[str] = None
    timestamp: Optional[str] = None
    request_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "error_code": "AUTH_001",
                "message": "Invalid credentials",
                "detail": "Email or password is incorrect",
                "timestamp": "2026-01-30T10:30:00Z",
                "request_id": "req_abc123",
            }
        }


class ActiveHQException(Exception):
    """Base exception for ActiveHQ."""
    
    def __init__(
        self,
        error_code: ErrorCode,
        message: str,
        detail: Optional[str] = None,
        status_code: int = 400,
    ):
        self.error_code = error_code
        self.message = message
        self.detail = detail
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(ActiveHQException):
    """Authentication-related error."""
    
    def __init__(self, error_code: ErrorCode, message: str, detail: Optional[str] = None):
        super().__init__(error_code, message, detail, status_code=401)


class AuthorizationError(ActiveHQException):
    """Authorization-related error."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            ErrorCode.INSUFFICIENT_PERMISSIONS,
            message,
            status_code=403,
        )


class ValidationError(ActiveHQException):
    """Validation error."""
    
    def __init__(self, error_code: ErrorCode, message: str, detail: Optional[str] = None):
        super().__init__(error_code, message, detail, status_code=422)


class ResourceNotFoundError(ActiveHQException):
    """Resource not found error."""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            ErrorCode.RESOURCE_NOT_FOUND,
            f"{resource} not found",
            f"Could not find {resource} with identifier: {identifier}",
            status_code=404,
        )


class ConflictError(ActiveHQException):
    """Resource conflict error (e.g., duplicate)."""
    
    def __init__(self, message: str, error_code: ErrorCode = ErrorCode.RESOURCE_CONFLICT):
        super().__init__(error_code, message, status_code=409)


class BusinessLogicError(ActiveHQException):
    """Business logic error (e.g., insufficient balance)."""
    
    def __init__(self, error_code: ErrorCode, message: str, detail: Optional[str] = None):
        super().__init__(error_code, message, detail, status_code=400)
