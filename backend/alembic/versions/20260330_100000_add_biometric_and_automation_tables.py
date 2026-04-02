"""Create biometric_devices, biometric_events, automation_campaigns, campaign_delivery_logs tables

Revision ID: 20260330_100000
Revises: b2c3d4e5f6a7
Create Date: 2026-03-30 10:00:00+00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = "20260330_100000"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "biometric_devices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("gym_id", UUID(as_uuid=True), sa.ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column(
            "vendor",
            sa.Enum("ESSL", "GENERIC", name="device_vendor", create_constraint=True),
            nullable=False,
            server_default="GENERIC",
        ),
        sa.Column("external_device_id", sa.String(120), nullable=False),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("location_label", sa.String(120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("gym_id", "external_device_id", name="uq_biometric_device_per_gym"),
    )
    op.create_index("ix_biometric_devices_gym_id", "biometric_devices", ["gym_id"])

    op.create_table(
        "biometric_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("gym_id", UUID(as_uuid=True), sa.ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("biometric_devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", UUID(as_uuid=True), sa.ForeignKey("members.id", ondelete="SET NULL"), nullable=True),
        sa.Column("external_event_id", sa.String(120), nullable=False),
        sa.Column("person_identifier", sa.String(120), nullable=False),
        sa.Column(
            "event_type",
            sa.Enum("CHECK_IN", "CHECK_OUT", "UNKNOWN", name="biometric_event_type", create_constraint=True),
            nullable=False,
            server_default="UNKNOWN",
        ),
        sa.Column("event_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "PROCESSED", "DUPLICATE", "CONFLICT", "FAILED", name="biometric_event_status", create_constraint=True),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("conflict_reason", sa.String(255), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("gym_id", "device_id", "external_event_id", name="uq_bio_event_unique"),
    )
    op.create_index("ix_biometric_events_gym_id", "biometric_events", ["gym_id"])
    op.create_index("ix_biometric_events_device_id", "biometric_events", ["device_id"])
    op.create_index("ix_biometric_events_member_id", "biometric_events", ["member_id"])
    op.create_index("ix_biometric_events_person_identifier", "biometric_events", ["person_identifier"])
    op.create_index("ix_biometric_events_event_time", "biometric_events", ["event_time"])
    op.create_index("idx_bio_event_processing", "biometric_events", ["gym_id", "status", "event_time"])

    op.create_table(
        "automation_campaigns",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("gym_id", UUID(as_uuid=True), sa.ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column(
            "trigger_type",
            sa.Enum("RENEWAL_REMINDER", "PAYMENT_FOLLOWUP", "INACTIVITY_NUDGE", "CUSTOM", name="campaign_trigger_type", create_constraint=True),
            nullable=False,
        ),
        sa.Column(
            "primary_channel",
            sa.Enum("WHATSAPP", "SMS", "EMAIL", name="campaign_primary_channel", create_constraint=True),
            nullable=False,
            server_default="WHATSAPP",
        ),
        sa.Column(
            "fallback_channel",
            sa.Enum("WHATSAPP", "SMS", "EMAIL", name="campaign_fallback_channel", create_constraint=True),
            nullable=True,
        ),
        sa.Column("template_en", sa.String(500), nullable=False),
        sa.Column("template_hi", sa.String(500), nullable=True),
        sa.Column("ai_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_automation_campaigns_gym_id", "automation_campaigns", ["gym_id"])

    op.create_table(
        "campaign_delivery_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("gym_id", UUID(as_uuid=True), sa.ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("campaign_id", UUID(as_uuid=True), sa.ForeignKey("automation_campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", UUID(as_uuid=True), sa.ForeignKey("members.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "channel",
            sa.Enum("WHATSAPP", "SMS", "EMAIL", name="delivery_channel", create_constraint=True),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("PENDING", "SENT", "FAILED", name="delivery_status", create_constraint=True),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("provider_message_id", sa.String(120), nullable=True),
        sa.Column("ai_variant_used", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_campaign_delivery_logs_gym_id", "campaign_delivery_logs", ["gym_id"])
    op.create_index("ix_campaign_delivery_logs_campaign_id", "campaign_delivery_logs", ["campaign_id"])


def downgrade() -> None:
    op.drop_table("campaign_delivery_logs")
    op.drop_table("automation_campaigns")
    op.drop_table("biometric_events")
    op.drop_table("biometric_devices")
