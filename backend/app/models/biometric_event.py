import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import BiometricEventStatus, BiometricEventType


class BiometricEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Raw biometric event log with dedupe and conflict status."""

    __tablename__ = "biometric_events"

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
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    external_event_id: Mapped[str] = mapped_column(String(120), nullable=False)
    person_identifier: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    event_type: Mapped[BiometricEventType] = mapped_column(
        Enum(BiometricEventType, name="biometric_event_type", create_constraint=True),
        nullable=False,
        default=BiometricEventType.UNKNOWN,
    )
    event_time: Mapped[datetime] = mapped_column(nullable=False, index=True)
    status: Mapped[BiometricEventStatus] = mapped_column(
        Enum(BiometricEventStatus, name="biometric_event_status", create_constraint=True),
        nullable=False,
        default=BiometricEventStatus.PENDING,
    )
    conflict_reason: Mapped[str | None] = mapped_column(String(255))
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("gym_id", "device_id", "external_event_id", name="uq_bio_event_unique"),
        Index("idx_bio_event_processing", "gym_id", "status", "event_time"),
    )
