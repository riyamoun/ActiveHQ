"""
Member model - Gym customers who have memberships.
Members do NOT login to the system - they are managed by staff.
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Boolean, Date, Enum, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Gender

if TYPE_CHECKING:
    from app.models.gym import Gym
    from app.models.membership import Membership
    from app.models.payment import Payment
    from app.models.attendance import Attendance


class Member(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Member entity - represents gym customers.
    
    Important distinction:
    - Member = Gym customer (does not login)
    - User = Staff who LOGIN (Owner, Manager, Staff)
    """
    
    __tablename__ = "members"
    
    # Tenant scoping
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Gym-specific identifier (optional, e.g., "GYM001")
    member_code: Mapped[str | None] = mapped_column(String(50))
    
    # Personal Information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))  # Optional in India
    phone: Mapped[str] = mapped_column(String(15), nullable=False)  # Required
    alternate_phone: Mapped[str | None] = mapped_column(String(15))  # Common in India
    
    gender: Mapped[Gender | None] = mapped_column(
        Enum(Gender, name="gender", create_constraint=True),
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    
    # Address
    address: Mapped[str | None] = mapped_column(Text)
    
    # Emergency Contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(15))
    
    # Profile
    photo_url: Mapped[str | None] = mapped_column(String(500))
    
    # Dates
    joined_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Notes (internal staff notes)
    notes: Mapped[str | None] = mapped_column(Text)
    
    # Soft delete
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    gym: Mapped["Gym"] = relationship("Gym", back_populates="members")
    
    memberships: Mapped[list["Membership"]] = relationship(
        "Membership",
        back_populates="member",
        lazy="dynamic",
        order_by="desc(Membership.start_date)",
    )
    
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="member",
        lazy="dynamic",
        order_by="desc(Payment.payment_date)",
    )
    
    attendance_records: Mapped[list["Attendance"]] = relationship(
        "Attendance",
        back_populates="member",
        lazy="dynamic",
        order_by="desc(Attendance.check_in_time)",
    )
    
    # Constraints & Indexes
    __table_args__ = (
        # Phone must be unique within a gym
        UniqueConstraint("gym_id", "phone", name="uq_member_gym_phone"),
        # Index for fast phone lookup
        Index("idx_member_gym_phone", "gym_id", "phone"),
        # Index for joined_date queries
        Index("idx_member_joined_date", "gym_id", "joined_date"),
    )
    
    def __repr__(self) -> str:
        return f"<Member(id={self.id}, name='{self.name}', phone='{self.phone}')>"
