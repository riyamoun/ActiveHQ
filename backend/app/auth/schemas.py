"""
Pydantic schemas for authentication.
"""

import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    """Login request body."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Token response after successful login."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request body."""
    refresh_token: str


class UserCreate(BaseModel):
    """Schema for creating a new user (staff)."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=15)
    role: UserRole = UserRole.STAFF
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class UserUpdate(BaseModel):
    """Schema for updating user details."""
    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=15)
    role: UserRole | None = None
    is_active: bool | None = None


class PasswordChange(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class UserResponse(BaseModel):
    """User response schema (excludes password)."""
    id: uuid.UUID
    gym_id: uuid.UUID
    email: str
    name: str
    phone: str | None
    role: UserRole
    is_active: bool
    
    model_config = {"from_attributes": True}


class CurrentUser(BaseModel):
    """Current authenticated user context."""
    id: uuid.UUID
    gym_id: uuid.UUID
    email: str
    name: str
    role: UserRole
    
    model_config = {"from_attributes": True}


class GymRegister(BaseModel):
    """
    Schema for registering a new gym with owner.
    Used during initial onboarding.
    """
    # Gym details
    gym_name: str = Field(..., min_length=2, max_length=255)
    gym_email: EmailStr
    gym_phone: str = Field(..., min_length=10, max_length=15)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    
    # Owner details (first user)
    owner_name: str = Field(..., min_length=2, max_length=255)
    owner_email: EmailStr
    owner_password: str = Field(..., min_length=8)
    
    @field_validator("owner_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class GymRegisterResponse(BaseModel):
    """Response after successful gym registration."""
    gym_id: uuid.UUID
    gym_name: str
    user: UserResponse
    tokens: TokenResponse
