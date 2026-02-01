"""
Pydantic schemas for membership management.
"""

import uuid
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.enums import MembershipStatus


class MembershipCreate(BaseModel):
    """Schema for creating a new membership."""
    member_id: uuid.UUID
    plan_id: uuid.UUID
    start_date: date | None = None  # Defaults to today
    amount_total: Decimal | None = None  # Defaults to plan price
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: str | None = None


class MembershipUpdate(BaseModel):
    """Schema for updating membership."""
    status: MembershipStatus | None = None
    notes: str | None = None


class MembershipResponse(BaseModel):
    """Membership response schema."""
    id: uuid.UUID
    gym_id: uuid.UUID
    member_id: uuid.UUID
    plan_id: uuid.UUID
    start_date: date
    end_date: date
    amount_total: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    status: MembershipStatus
    notes: str | None
    created_by: uuid.UUID | None
    
    # Related info
    member_name: str | None = None
    member_phone: str | None = None
    plan_name: str | None = None
    
    model_config = {"from_attributes": True}


class MembershipSummary(BaseModel):
    """Minimal membership info."""
    id: uuid.UUID
    member_id: uuid.UUID
    member_name: str
    plan_name: str
    start_date: date
    end_date: date
    status: MembershipStatus
    amount_due: Decimal
    
    model_config = {"from_attributes": True}


class MembershipRenew(BaseModel):
    """Schema for renewing a membership."""
    plan_id: uuid.UUID | None = None  # Same plan if not specified
    start_date: date | None = None  # Day after current end date
    amount_total: Decimal | None = None  # Plan price if not specified
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: str | None = None


class MembershipListResponse(BaseModel):
    """Paginated membership list."""
    items: list[MembershipSummary]
    total: int
    page: int
    page_size: int
