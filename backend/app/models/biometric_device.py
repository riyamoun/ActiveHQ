import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DeviceVendor


class BiometricDevice(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Per-gym biometric device registry."""

    __tablename__ = "biometric_devices"

    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    vendor: Mapped[DeviceVendor] = mapped_column(
        Enum(DeviceVendor, name="device_vendor", create_constraint=True),
        nullable=False,
        default=DeviceVendor.GENERIC,
    )
    external_device_id: Mapped[str] = mapped_column(String(120), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    location_label: Mapped[str | None] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(nullable=True)

    __table_args__ = (
        UniqueConstraint("gym_id", "external_device_id", name="uq_biometric_device_per_gym"),
    )
