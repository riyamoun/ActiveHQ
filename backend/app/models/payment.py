"""
Payment model - Records all payments from members.
Supports partial payments and multiple payment modes.
"""

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Date, Numeric, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import PaymentMode

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.membership import Membership
    from app.models.user import User


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Payment entity - records money received from members.
    
    Supports:
    - Multiple payment modes (Cash, UPI, Card)
    - Partial payments
    - Payments linked to memberships
    - Ad-hoc payments (not linked to membership)
    """
    
    __tablename__ = "payments"
    
    # Tenant scoping
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Who paid
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # What they paid for (nullable for ad-hoc payments)
    membership_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("memberships.id", ondelete="SET NULL"),
        index=True,
    )
    
    # Amount
    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    
    # Tax (GST-ready)
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
    )
    
    # Payment details
    payment_mode: Mapped[PaymentMode] = mapped_column(
        Enum(PaymentMode, name="payment_mode", create_constraint=True),
        nullable=False,
    )
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Reference for digital payments (UPI ref, card transaction ID)
    reference_number: Mapped[str | None] = mapped_column(String(255))
    
    # Notes
    notes: Mapped[str | None] = mapped_column(Text)
    
    # Audit: who received this payment
    received_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    
    # Relationships
    member: Mapped["Member"] = relationship("Member", back_populates="payments")
    membership: Mapped["Membership | None"] = relationship("Membership", back_populates="payments")
    receiver: Mapped["User | None"] = relationship("User", foreign_keys=[received_by])
    
    # Indexes for reporting
    __table_args__ = (
        # Daily collection report
        Index("idx_payment_date", "gym_id", "payment_date"),
        # Payment history by member
        Index("idx_payment_member", "gym_id", "member_id", "payment_date"),
        # Payment mode analysis
        Index("idx_payment_mode", "gym_id", "payment_mode", "payment_date"),
    )
    
    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, amount={self.amount}, mode={self.payment_mode.value})>"
