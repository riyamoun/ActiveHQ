"""
Plan model - Membership plans offered by gyms.
Each gym defines its own plans (monthly, quarterly, yearly, etc.)
"""

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Boolean, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.gym import Gym
    from app.models.membership import Membership


class Plan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Plan entity - represents membership plans a gym offers.
    
    Examples: Monthly (30 days), Quarterly (90 days), Yearly (365 days)
    Each gym can have different plans with different prices.
    """
    
    __tablename__ = "plans"
    
    # Tenant scoping
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Plan Details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    
    # Duration in days (30, 90, 180, 365, etc.)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Price in INR (using Decimal for monetary precision)
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    
    # Plan availability
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False,
    )
    
    # Relationships
    gym: Mapped["Gym"] = relationship("Gym", back_populates="plans")
    
    memberships: Mapped[list["Membership"]] = relationship(
        "Membership",
        back_populates="plan",
        lazy="dynamic",
    )
    
    # Indexes
    __table_args__ = (
        Index("idx_plan_gym_active", "gym_id", "is_active"),
    )
    
    def __repr__(self) -> str:
        return f"<Plan(id={self.id}, name='{self.name}', price={self.price})>"
