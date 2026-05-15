"""Add expiry_followup to campaign_trigger_type and notification_type enums

Revision ID: 20260514_220000
Revises: 20260401_120000
Create Date: 2026-05-14 22:00:00

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260514_220000"
down_revision = "20260401_120000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'EXPIRY_FOLLOWUP' to campaign_trigger_type enum
    # NOTE: Existing values use UPPERCASE (e.g. RENEWAL_REMINDER, PAYMENT_FOLLOWUP)
    op.execute("ALTER TYPE campaign_trigger_type ADD VALUE IF NOT EXISTS 'EXPIRY_FOLLOWUP'")

    # Add 'EXPIRY_FOLLOWUP' to notification_type enum
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'EXPIRY_FOLLOWUP'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from enums.
    # To fully downgrade, you'd need to recreate the enum type.
    # This is intentionally left as a no-op for safety.
    pass
