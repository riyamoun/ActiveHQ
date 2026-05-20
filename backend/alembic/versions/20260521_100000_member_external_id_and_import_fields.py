"""Add external_id and address fields for multi-software import reconciliation."""

from alembic import op
import sqlalchemy as sa

revision = "20260521_100000"
down_revision = "20260520_100000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("members", sa.Column("external_id", sa.String(length=255), nullable=True))
    op.add_column("members", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("members", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("members", sa.Column("pincode", sa.String(length=10), nullable=True))
    op.create_index(
        "idx_member_gym_external_id",
        "members",
        ["gym_id", "external_id"],
        unique=True,
        postgresql_where=sa.text("external_id IS NOT NULL"),
    )

    op.add_column("memberships", sa.Column("source_system", sa.String(length=100), nullable=True))
    op.create_index(
        "idx_membership_gym_import_ref",
        "memberships",
        ["gym_id", "import_ref"],
        unique=True,
        postgresql_where=sa.text("import_ref IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("idx_membership_gym_import_ref", table_name="memberships")
    op.drop_column("memberships", "source_system")
    op.drop_index("idx_member_gym_external_id", table_name="members")
    op.drop_column("members", "pincode")
    op.drop_column("members", "state")
    op.drop_column("members", "city")
    op.drop_column("members", "external_id")
