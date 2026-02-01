"""
Pydantic schemas for member management.
"""

import uuid
from datetime import date
from pydantic import BaseModel, EmailStr, Field

from app.models.enums import Gender, MembershipStatus


class MemberCreate(BaseModel):
    """Schema for creating a new member."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str = Field(..., min_length=10, max_length=15)
    alternate_phone: str | None = Field(None, max_length=15)
    gender: Gender | None = None
    date_of_birth: date | None = None
    address: str | None = None
    emergency_contact_name: str | None = Field(None, max_length=255)
    emergency_contact_phone: str | None = Field(None, max_length=15)
    photo_url: str | None = Field(None, max_length=500)
    joined_date: date | None = None  # Defaults to today if not provided
    notes: str | None = None
    member_code: str | None = Field(None, max_length=50)


class MemberUpdate(BaseModel):
    """Schema for updating member details."""
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, min_length=10, max_length=15)
    alternate_phone: str | None = Field(None, max_length=15)
    gender: Gender | None = None
    date_of_birth: date | None = None
    address: str | None = None
    emergency_contact_name: str | None = Field(None, max_length=255)
    emergency_contact_phone: str | None = Field(None, max_length=15)
    photo_url: str | None = Field(None, max_length=500)
    notes: str | None = None
    member_code: str | None = Field(None, max_length=50)


class MemberResponse(BaseModel):
    """Full member response."""
    id: uuid.UUID
    gym_id: uuid.UUID
    member_code: str | None
    name: str
    email: str | None
    phone: str
    alternate_phone: str | None
    gender: Gender | None
    date_of_birth: date | None
    address: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    photo_url: str | None
    joined_date: date
    notes: str | None
    is_active: bool
    
    model_config = {"from_attributes": True}


class MemberSummary(BaseModel):
    """Minimal member info for lists."""
    id: uuid.UUID
    name: str
    phone: str
    member_code: str | None
    joined_date: date
    is_active: bool
    
    model_config = {"from_attributes": True}


class MemberWithMembership(MemberResponse):
    """Member with current membership info."""
    current_membership_status: MembershipStatus | None = None
    current_membership_end: date | None = None
    current_plan_name: str | None = None
    amount_due: float | None = None


class MemberListResponse(BaseModel):
    """Paginated member list response."""
    items: list[MemberSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class MemberSearchParams(BaseModel):
    """Member search/filter parameters."""
    query: str | None = None  # Search by name or phone
    status: str | None = None  # active, expired, all
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
