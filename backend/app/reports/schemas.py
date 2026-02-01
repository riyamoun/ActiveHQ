"""
Pydantic schemas for reports.
"""

from datetime import date
from decimal import Decimal
from pydantic import BaseModel

from app.models.enums import MembershipStatus


class DashboardStats(BaseModel):
    """Dashboard overview statistics."""
    total_members: int
    active_members: int
    expiring_soon: int  # Next 7 days
    expired_members: int
    today_check_ins: int
    today_collection: Decimal
    members_with_dues: int
    total_dues: Decimal


class MembershipStats(BaseModel):
    """Membership statistics."""
    total_active: int
    total_paused: int
    total_expired: int
    expiring_this_week: int
    expiring_this_month: int


class CollectionReport(BaseModel):
    """Collection report for a period."""
    from_date: date
    to_date: date
    total_amount: Decimal
    total_transactions: int
    by_mode: dict[str, Decimal]
    daily_breakdown: list[dict]  # [{date, amount, count}]


class MemberReport(BaseModel):
    """Member-related report."""
    new_members_count: int
    new_members_this_month: int
    retention_rate: float  # Percentage of members who renewed


class ExpiringMemberInfo(BaseModel):
    """Info about expiring member."""
    member_id: str
    member_name: str
    member_phone: str
    plan_name: str
    end_date: date
    days_until_expiry: int
    amount_due: Decimal


class DuesMemberInfo(BaseModel):
    """Info about member with dues."""
    member_id: str
    member_name: str
    member_phone: str
    total_due: Decimal
    membership_end: date | None
