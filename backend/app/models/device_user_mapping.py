import uuid
from datetime import datetime

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DeviceUserMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Maps a biometric device's local user ID to an ActiveHQ member.

    Keeps biometric continuity: the device retains its existing user IDs
    while ActiveHQ resolves them to the correct member via this table.
    One member may appear on multiple devices with different local IDs.
    """

    __tablename__ = "device_user_mappings"

    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("biometric_devices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_user_id: Mapped[str] = mapped_column(String(120), nullable=False)
    is_enrolled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enrollment_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("gym_id", "device_id", "device_user_id", name="uq_device_user_per_gym_device"),
        Index("idx_device_user_lookup", "gym_id", "device_user_id"),
    )
