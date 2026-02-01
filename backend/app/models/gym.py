"""
Gym model - The tenant entity.
Each gym is a separate tenant in the multi-tenant architecture.
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Boolean, Date, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import SubscriptionStatus, BillingCycle

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.member import Member
    from app.models.plan import Plan


class Gym(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Gym entity - represents a tenant in the system.
    
    This is the top-level entity. All other entities belong to a gym.
    """
    
    __tablename__ = "gyms"
    
    # Basic Information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        nullable=False,
        index=True,
    )
    owner_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Contact
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        nullable=False,
        index=True,
    )
    phone: Mapped[str] = mapped_column(String(15), nullable=False)
    
    # Address
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    pincode: Mapped[str | None] = mapped_column(String(10))
    
    # Platform Subscription (gym pays us)
    subscription_status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status", create_constraint=True),
        nullable=False,
        default=SubscriptionStatus.TRIAL,
        index=True,
    )
    subscription_start: Mapped[date | None] = mapped_column(Date)
    subscription_end: Mapped[date | None] = mapped_column(Date)
    
    # Billing (for our SaaS monetization)
    setup_fee_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    billing_cycle: Mapped[BillingCycle | None] = mapped_column(
        Enum(BillingCycle, name="billing_cycle", create_constraint=True),
    )
    
    # Tax compliance
    gst_number: Mapped[str | None] = mapped_column(String(20))
    
    # Flexible settings (timezone, currency, features, etc.)
    settings: Mapped[dict] = mapped_column(
        JSONB, 
        nullable=False, 
        default=dict,
        server_default="{}",
    )
    
    # Soft delete
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="gym",
        lazy="selectin",
    )
    
    members: Mapped[list["Member"]] = relationship(
        "Member",
        back_populates="gym",
        lazy="dynamic",  # Large collection - use query
    )
    
    plans: Mapped[list["Plan"]] = relationship(
        "Plan",
        back_populates="gym",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Gym(id={self.id}, name='{self.name}', slug='{self.slug}')>"
