"""Add biometric device ingest token hash

Revision ID: 20260330_110000
Revises: 20260201_081132
Create Date: 2026-03-30 11:00:00+00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260330_110000"
down_revision = "20260201_081132_add_demo_requests"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("biometric_devices", sa.Column("ingest_token_hash", sa.String(length=64), nullable=True))
    op.add_column("biometric_devices", sa.Column("ingest_token_rotated_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_biometric_devices_ingest_token_hash", "biometric_devices", ["ingest_token_hash"], unique=False)
    # Unique constraint for non-null hashes (Postgres partial unique index)
    op.create_index(
        "uq_biometric_device_ingest_token_hash",
        "biometric_devices",
        ["ingest_token_hash"],
        unique=True,
        postgresql_where=sa.text("ingest_token_hash IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_biometric_device_ingest_token_hash", table_name="biometric_devices")
    op.drop_index("ix_biometric_devices_ingest_token_hash", table_name="biometric_devices")
    op.drop_column("biometric_devices", "ingest_token_rotated_at")
    op.drop_column("biometric_devices", "ingest_token_hash")

