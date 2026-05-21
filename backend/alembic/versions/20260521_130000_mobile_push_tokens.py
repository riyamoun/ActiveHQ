"""Add mobile push token table for Android/iOS notifications."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260521_130000"
down_revision = "20260521_100000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mobile_push_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.String(length=20), nullable=False),
        sa.Column("token", sa.String(length=512), nullable=False),
        sa.Column("device_id", sa.String(length=120), nullable=True),
        sa.Column("app_version", sa.String(length=50), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("platform", "token", name="uq_mobile_push_platform_token"),
    )
    op.create_index("idx_mobile_push_user_active", "mobile_push_tokens", ["user_id", "is_active"])
    op.create_index("idx_mobile_push_gym_active", "mobile_push_tokens", ["gym_id", "is_active"])


def downgrade() -> None:
    op.drop_index("idx_mobile_push_gym_active", table_name="mobile_push_tokens")
    op.drop_index("idx_mobile_push_user_active", table_name="mobile_push_tokens")
    op.drop_table("mobile_push_tokens")
