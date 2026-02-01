"""
Pydantic schemas for plan management.
"""

import uuid
from decimal import Decimal
from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    """Schema for creating a new plan."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    duration_days: int = Field(..., ge=1, le=3650)  # Max ~10 years
    price: Decimal = Field(..., ge=0, decimal_places=2)


class PlanUpdate(BaseModel):
    """Schema for updating plan details."""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    duration_days: int | None = Field(None, ge=1, le=3650)
    price: Decimal | None = Field(None, ge=0, decimal_places=2)
    is_active: bool | None = None


class PlanResponse(BaseModel):
    """Plan response schema."""
    id: uuid.UUID
    gym_id: uuid.UUID
    name: str
    description: str | None
    duration_days: int
    price: Decimal
    is_active: bool
    
    model_config = {"from_attributes": True}


class PlanSummary(BaseModel):
    """Minimal plan info for dropdowns."""
    id: uuid.UUID
    name: str
    duration_days: int
    price: Decimal
    
    model_config = {"from_attributes": True}
