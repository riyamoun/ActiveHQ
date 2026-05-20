"""
BiometricFaceEncoding model - Face template storage for biometric matching.

Stores face encodings separately from biometric events:
- Each member can have multiple face templates (one per device or for redundancy)
- Stores binary face encoding (512-dim vector, JPEG2000, etc.)
- Tracks enrollment quality (confidence score)
- Links to DeviceUserMapping for multi-device enrollment tracking

This allows:
1. Flexible face data management across multiple biometric devices
2. Separate handling of face template updates
3. Better enrollment quality tracking
4. Easier reconciliation during import from third-party systems
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Numeric, String, ForeignKey, Index, LargeBinary, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.gym import Gym
    from app.models.member import Member
    from app.models.biometric_device import BiometricDevice


class BiometricFaceEncoding(UUIDPrimaryKeyMixin, Base):
    """
    Face template storage for biometric matching and verification.
    
    Each record represents one face encoding for one member.
    A member can have multiple encodings:
    - One primary (for matching)
    - Secondary backups (for redundancy or historical tracking)
    """
    
    __tablename__ = "biometric_face_encodings"
    
    # Tenant scoping
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Which member this face belongs to
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Optional: which device this was enrolled on
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("biometric_devices.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Binary face template (512-dimensional vector, JPEG2000, or other format)
    # Typical sizes: 512 floats = 2KB, JPEG2000 = 5-10KB
    face_template: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    face_template_format: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    enrollment_quality: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=None),  # UTC
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(tz=None),
        onupdate=lambda: datetime.now(tz=None),
    )
    
    # Relationships
    gym: Mapped["Gym"] = relationship("Gym")
    member: Mapped["Member"] = relationship("Member", back_populates="biometric_face_encodings")
    device: Mapped["BiometricDevice | None"] = relationship("BiometricDevice")
    
    # Indexes
    __table_args__ = (
        # Fast member lookup for matching
        Index("idx_face_encoding_member", "gym_id", "member_id"),
        # Device-specific templates
        Index("idx_face_encoding_device", "device_id"),
        # Find primary faces for a gym (for matching)
        Index("idx_face_encoding_primary", "gym_id", "is_primary"),
    )
    
    def __repr__(self) -> str:
        return (
            f"<BiometricFaceEncoding("
            f"member_id={self.member_id}, "
            f"format={self.face_template_format}, "
            f"quality={self.enrollment_quality}, "
            f"primary={self.is_primary}"
            f")>"
        )
