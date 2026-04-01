"""Add device_user_mappings table for biometric migration

Revision ID: 20260401_120000
Revises: 20260330_110000
Create Date: 2026-04-01 12:00:00+00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "20260401_120000"
down_revision = "20260330_110000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "device_user_mappings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("gym_id", UUID(as_uuid=True), sa.ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_id", UUID(as_uuid=True), sa.ForeignKey("biometric_devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", UUID(as_uuid=True), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_user_id", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("gym_id", "device_id", "device_user_id", name="uq_device_user_per_gym_device"),
    )
    op.create_index("ix_device_user_mappings_gym_id", "device_user_mappings", ["gym_id"])
    op.create_index("ix_device_user_mappings_device_id", "device_user_mappings", ["device_id"])
    op.create_index("ix_device_user_mappings_member_id", "device_user_mappings", ["member_id"])
    op.create_index("idx_device_user_lookup", "device_user_mappings", ["gym_id", "device_user_id"])


def downgrade() -> None:
    op.drop_index("idx_device_user_lookup", table_name="device_user_mappings")
    op.drop_index("ix_device_user_mappings_member_id", table_name="device_user_mappings")
    op.drop_index("ix_device_user_mappings_device_id", table_name="device_user_mappings")
    op.drop_index("ix_device_user_mappings_gym_id", table_name="device_user_mappings")
    op.drop_table("device_user_mappings")
