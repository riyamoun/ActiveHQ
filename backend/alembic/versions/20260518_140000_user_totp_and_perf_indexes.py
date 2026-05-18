"""Add optional TOTP fields and performance indexes."""

from alembic import op
import sqlalchemy as sa

revision = "20260518_140000"
down_revision = "20260513_120000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("totp_secret", sa.String(length=64), nullable=True))
    op.add_column(
        "users",
        sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("idx_member_gym_name", "members", ["gym_id", "name"], unique=False)
    op.create_index("idx_member_gym_active", "members", ["gym_id", "is_active"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_member_gym_active", table_name="members")
    op.drop_index("idx_member_gym_name", table_name="members")
    op.drop_column("users", "totp_enabled")
    op.drop_column("users", "totp_secret")
