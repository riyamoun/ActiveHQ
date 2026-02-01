"""
Membership model - A member's subscription to a plan.
Tracks membership history, allows renewals and upgrades.
"""

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Date, Numeric, Enum, ForeignKey, Index
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
    )
    
    def __repr__(self) -> str:
        return f"<Membership(id={self.id}, member_id={self.member_id}, status={self.status.value})>"
