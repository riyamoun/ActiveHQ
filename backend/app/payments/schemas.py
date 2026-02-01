"""
Pydantic schemas for payment management.
"""

import uuid
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.enums import PaymentMode


class PaymentCreate(BaseModel):
    """Schema for recording a new payment."""
    member_id: uuid.UUID
    membership_id: uuid.UUID | None = None  # Optional link to membership
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    tax_amount: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2)
    payment_mode: PaymentMode
    payment_date: date | None = None  # Defaults to today
    reference_number: str | None = Field(None, max_length=255)
    notes: str | None = None


class PaymentResponse(BaseModel):
    """Payment response schema."""
    id: uuid.UUID
    gym_id: uuid.UUID
    member_id: uuid.UUID
    membership_id: uuid.UUID | None
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal  # amount + tax_amount
    payment_mode: PaymentMode
    payment_date: date
    reference_number: str | None
    notes: str | None
    received_by: uuid.UUID | None
    
    # Related info
    member_name: str | None = None
    member_phone: str | None = None
    received_by_name: str | None = None
    
    model_config = {"from_attributes": True}


class PaymentSummary(BaseModel):
    """Minimal payment info for lists."""
    id: uuid.UUID
    member_name: str
    amount: Decimal
    payment_mode: PaymentMode
    payment_date: date
    
    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    """Paginated payment list."""
    items: list[PaymentSummary]
    total: int
    total_amount: Decimal
    page: int
    page_size: int


class DailyCollectionSummary(BaseModel):
    """Daily collection summary."""
    date: date
    total_amount: Decimal
    payment_count: int
    by_mode: dict[str, Decimal]  # e.g., {"cash": 5000, "upi": 3000}
