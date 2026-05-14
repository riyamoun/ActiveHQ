"""Pydantic schemas for the member portal."""

import uuid
from datetime import datetime, date
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import MembershipStatus, PaymentMode


# ─────────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────────

class OtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class OtpVerify(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    code: str = Field(..., min_length=4, max_length=8)


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerify(BaseModel):
    token: str = Field(..., min_length=16, max_length=128)


class GoogleAuthRequest(BaseModel):
    """Body of POST /api/m/auth/google — front-end forwards the Google ID token."""
    id_token: str = Field(..., min_length=20)


class MemberGymOption(BaseModel):
    """Slim representation of a (member_id, gym) the caller can pick from."""
    selection_token: str
    member_id: uuid.UUID
    gym_id: uuid.UUID
    gym_name: str
    gym_city: str | None = None


class SelectMemberRequest(BaseModel):
    selection_token: str = Field(..., min_length=16, max_length=128)
    member_id: uuid.UUID


class MemberTokenResponse(BaseModel):
    """Final access token + minimal member identity payload."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    member: "MemberMe"


class AuthChallengeResponse(BaseModel):
    """
    Response of OTP/magic-link/Google verify.

    Exactly one of `token` or `choices` is populated:
      * token   → single-gym match, we issue the JWT directly
      * choices → multi-gym match, caller must POST /select-member
    """
    token: MemberTokenResponse | None = None
    choices: list[MemberGymOption] | None = None


# ─────────────────────────────────────────────────────────────────────
# Member data
# ─────────────────────────────────────────────────────────────────────

class MemberMe(BaseModel):
    id: uuid.UUID
    gym_id: uuid.UUID
    gym_name: str
    name: str
    email: str | None = None
    phone: str
    photo_url: str | None = None
    joined_date: date | None = None

    model_config = {"from_attributes": True}


class ActivePlan(BaseModel):
    membership_id: uuid.UUID | None = None
    plan_name: str | None = None
    status: MembershipStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    days_remaining: int | None = None
    price: Decimal | None = None
    amount_paid: Decimal | None = None
    amount_due: Decimal | None = None


class AttendanceEntry(BaseModel):
    id: uuid.UUID
    check_in_time: datetime
    check_out_time: datetime | None = None
    duration_minutes: int | None = None

    model_config = {"from_attributes": True}


class PaymentEntry(BaseModel):
    id: uuid.UUID
    amount: Decimal
    payment_mode: PaymentMode
    payment_date: date
    notes: str | None = None
    reference_number: str | None = None

    model_config = {"from_attributes": True}


# Forward refs
MemberTokenResponse.model_rebuild()
AuthChallengeResponse.model_rebuild()
