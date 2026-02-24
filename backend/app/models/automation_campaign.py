import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import CampaignTriggerType, NotificationChannel, NotificationStatus


class AutomationCampaign(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Campaign configuration for WhatsApp/SMS automation."""

    __tablename__ = "automation_campaigns"

    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    trigger_type: Mapped[CampaignTriggerType] = mapped_column(
        Enum(CampaignTriggerType, name="campaign_trigger_type", create_constraint=True),
        nullable=False,
    )
    primary_channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="campaign_primary_channel", create_constraint=True),
        nullable=False,
        default=NotificationChannel.WHATSAPP,
    )
    fallback_channel: Mapped[NotificationChannel | None] = mapped_column(
        Enum(NotificationChannel, name="campaign_fallback_channel", create_constraint=True),
        nullable=True,
    )
    template_en: Mapped[str] = mapped_column(String(500), nullable=False)
    template_hi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class CampaignDeliveryLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Delivery analytics events for campaign messages."""

    __tablename__ = "campaign_delivery_logs"

    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("automation_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="delivery_channel", create_constraint=True),
        nullable=False,
    )
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="delivery_status", create_constraint=True),
        nullable=False,
        default=NotificationStatus.PENDING,
    )
    provider_message_id: Mapped[str | None] = mapped_column(String(120))
    ai_variant_used: Mapped[str | None] = mapped_column(String(500))
