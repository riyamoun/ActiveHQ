"""
Attendance model - Tracks member check-ins and check-outs.
Manual attendance tracking (biometric/RFID can be added later).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.member import Member
    from app.models.user import User


class Attendance(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Attendance entity - records member gym visits.
    
    Currently supports manual check-in by staff.
    Can be extended for:
    - Self check-in via app
    - Biometric integration
    - RFID/barcode scanning
    """
    
    __tablename__ = "attendance"
    
    # Tenant scoping
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Who checked in
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Check-in time (required)
    check_in_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    
    # Check-out time (optional - many gyms don't track this)
    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    
    # Staff who marked attendance (null = self check-in via app)
    marked_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    
    # Relationships
    member: Mapped["Member"] = relationship("Member", back_populates="attendance_records")
    staff: Mapped["User | None"] = relationship("User", foreign_keys=[marked_by])
    
    # Indexes for reporting
    __table_args__ = (
        # Daily attendance report
        Index("idx_attendance_daily", "gym_id", "check_in_time"),
        # Member attendance history
        Index("idx_attendance_member", "member_id", "check_in_time"),
    )
    
    def __repr__(self) -> str:
        return f"<Attendance(id={self.id}, member_id={self.member_id}, check_in={self.check_in_time})>"
