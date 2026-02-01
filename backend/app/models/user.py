"""
User model - Staff who can login to the system.
Users are gym staff (Owner, Manager, Staff) - NOT gym members.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, TenantMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.gym import Gym


class User(UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin, Base):
    """
    User entity - represents staff who can login to the dashboard.
    
    Important distinction:
    - User = Staff who LOGIN (Owner, Manager, Staff)
    - Member = Gym customer (does not login)
    """
    
    __tablename__ = "users"
    
    # Tenant relationship
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Authentication
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(15))
    
    # Role & Access
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_constraint=True),
        nullable=False,
        default=UserRole.STAFF,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Tracking
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    gym: Mapped["Gym"] = relationship("Gym", back_populates="users")
    
    # Constraints
    __table_args__ = (
        # Email must be unique within a gym (same person can work at multiple gyms)
        UniqueConstraint("gym_id", "email", name="uq_user_gym_email"),
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role={self.role.value})>"
