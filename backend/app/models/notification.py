"""
Notification model - Tracks notifications sent to members.
Phase-ready for WhatsApp and SMS integration.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import NotificationType, NotificationChannel, NotificationStatus

if TYPE_CHECKING:
    from app.models.member import Member


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Notification entity - tracks all notifications sent to members.
    
    Supports:
    - WhatsApp (via WhatsApp Business API)
    - SMS (via Indian providers like MSG91, Twilio)
    - Email
    
    Phase-ready: Models are ready, implementation comes later.
    """
    
    __tablename__ = "notifications"
    
    # Tenant scoping
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Recipient
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Notification details
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", create_constraint=True),
        nullable=False,
    )
    
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel", create_constraint=True),
        nullable=False,
    )
    
    # Message content
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Delivery status
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="notification_status", create_constraint=True),
        nullable=False,
        default=NotificationStatus.PENDING,
        index=True,
    )
    
    # Scheduling
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Error tracking
    error_message: Mapped[str | None] = mapped_column(Text)
    
    # External reference (provider's message ID for tracking)
    external_id: Mapped[str | None] = mapped_column(String(255))
    
    # Relationships
    member: Mapped["Member"] = relationship("Member")
    
    # Indexes
    __table_args__ = (
        # Find pending notifications to send
        Index("idx_notification_pending", "status", "scheduled_at"),
        # Notification history by member
        Index("idx_notification_member", "gym_id", "member_id"),
    )
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.notification_type.value}, status={self.status.value})>"
