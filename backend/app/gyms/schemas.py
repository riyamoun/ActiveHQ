"""
Pydantic schemas for gym management.
"""

import uuid
from datetime import date
from pydantic import BaseModel, EmailStr, Field

from app.models.enums import SubscriptionStatus, BillingCycle


class GymBase(BaseModel):
    """Base schema for gym data."""
    name: str = Field(..., min_length=2, max_length=255)
    owner_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=10)
    gst_number: str | None = Field(None, max_length=20)


class GymUpdate(BaseModel):
    """Schema for updating gym details."""
    name: str | None = Field(None, min_length=2, max_length=255)
    owner_name: str | None = Field(None, min_length=2, max_length=255)
    phone: str | None = Field(None, min_length=10, max_length=15)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    pincode: str | None = Field(None, max_length=10)
    gst_number: str | None = Field(None, max_length=20)


class GymSettingsUpdate(BaseModel):
    """Schema for updating gym settings (JSONB field)."""
    settings: dict


class GymResponse(BaseModel):
    """Gym response schema."""
    id: uuid.UUID
    name: str
    slug: str
    owner_name: str
    email: str
    phone: str
    address: str | None
    city: str | None
    state: str | None
    pincode: str | None
    gst_number: str | None
    subscription_status: SubscriptionStatus
    subscription_start: date | None
    subscription_end: date | None
    setup_fee_paid: bool
    billing_cycle: BillingCycle | None
    settings: dict
    is_active: bool
    
    model_config = {"from_attributes": True}


class GymSummary(BaseModel):
    """Minimal gym info for lists."""
    id: uuid.UUID
    name: str
    slug: str
    city: str | None
    subscription_status: SubscriptionStatus
    
    model_config = {"from_attributes": True}
