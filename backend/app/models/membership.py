"""
Membership model - A member's subscription to a plan.
Tracks membership history, allows renewals and upgrades.

Enhanced with flexible import and renewal support:
- renewal_date: Explicit renewal tracking
- freeze_start_date/freeze_end_date: For paused memberships
- discount_amount: Track discounts separately
- payment_method: Store preferred payment method
- auto_renewal: Enable auto-renewal
- import_ref: Reference to source system ID
- renewal_reminder_sent_at: Track reminders
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Date, DateTime, Numeric, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import MembershipStatus

if TYPE_CHECKING:
    from app.models.gym import Gym
    from app.models.member import Member
    from app.models.plan import Plan
    from app.models.payment import Payment
    from app.models.user import User


class Membership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Membership entity - represents a member's subscription to a plan.
    
    A member can have multiple memberships over time:
    - Initial membership
    - Renewals
    - Plan changes
    
    This preserves complete membership history.
    """
    
    __tablename__ = "memberships"
    
    # Tenant scoping (denormalized for query performance)
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Foreign Keys
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="RESTRICT"),  # Don't delete plans with memberships
        nullable=False,
        index=True,
    )
    
    # Dates
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Financials (in INR)
    amount_total: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
    )
    
    # Status
    status: Mapped[MembershipStatus] = mapped_column(
        Enum(MembershipStatus, name="membership_status", create_constraint=True),
        nullable=False,
        default=MembershipStatus.ACTIVE,
        index=True,
    )
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text)
    
    # ── ENHANCED: Flexible renewal and payment tracking ──
    renewal_date: Mapped[date | None] = mapped_column(
        Date,
        description="When this membership is due for renewal",
    )
    freeze_start_date: Mapped[date | None] = mapped_column(
        Date,
        description="Start of membership freeze period (for paused memberships)",
    )
    freeze_end_date: Mapped[date | None] = mapped_column(
        Date,
        description="End of membership freeze period",
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=Decimal("0.00"),
        nullable=False,
        description="Discount applied to this membership",
    )
    payment_method: Mapped[str | None] = mapped_column(
        String(50),
        description="Preferred payment method: CASH, UPI, CARD, CHEQUE, BANK_TRANSFER",
    )
    auto_renewal: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        description="Enable automatic renewal before expiry",
    )
    import_ref: Mapped[str | None] = mapped_column(
        String(255),
        description="Reference ID from source system for data reconciliation",
    )
    renewal_reminder_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        description="When renewal reminder was last sent",
    )
    
    # Audit: who created this membership
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    
    # Relationships
    member: Mapped["Member"] = relationship("Member", back_populates="memberships")
    plan: Mapped["Plan"] = relationship("Plan", back_populates="memberships")
    creator: Mapped["User | None"] = relationship("User", foreign_keys=[created_by])
    
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="membership",
        lazy="selectin",
    )
    
    # Computed property for amount due
    @hybrid_property
    def amount_due(self) -> Decimal:
        """Calculate outstanding amount."""
        return self.amount_total - self.amount_paid
    
    # Indexes for common queries
    __table_args__ = (
        # Expiry reports: find memberships expiring in date range
        Index("idx_membership_expiry", "gym_id", "status", "end_date"),
        # Member's active membership lookup
        Index("idx_membership_member_status", "member_id", "status"),
        # Due amount tracking (memberships with balance)
        Index("idx_membership_gym_dates", "gym_id", "start_date", "end_date"),
        # NEW: Renewal tracking
        Index("idx_membership_renewal_date", "gym_id", "renewal_date"),
        Index("idx_membership_auto_renewal", "gym_id", "auto_renewal"),
    )
    
    def __repr__(self) -> str:
        return f"<Membership(id={self.id}, member_id={self.member_id}, status={self.status.value})>"
