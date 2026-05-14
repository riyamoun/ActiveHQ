"""Add member-portal authentication: google_sub on members + OTP / magic-link tables

Revision ID: 20260513_120000
Revises: 20260401_120000
Create Date: 2026-05-13 12:00:00+00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "20260513_120000"
down_revision = "20260401_120000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─────────────────────────────────────────────────────────────────────
    # members: add member-portal auth fields
    # ─────────────────────────────────────────────────────────────────────
    op.add_column(
        "members",
        sa.Column("google_sub", sa.String(64), nullable=True),
    )
    op.add_column(
        "members",
        sa.Column("last_member_login_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_members_google_sub", "members", ["google_sub"])

    # ─────────────────────────────────────────────────────────────────────
    # member_login_otps — WhatsApp / SMS OTP store
    # ─────────────────────────────────────────────────────────────────────
    op.create_table(
        "member_login_otps",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(15), nullable=False),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer, server_default="0", nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_member_login_otps_phone", "member_login_otps", ["phone"])
    op.create_index("idx_member_otp_phone_expiry", "member_login_otps", ["phone", "expires_at"])

    # ─────────────────────────────────────────────────────────────────────
    # member_magic_links — email magic-link store
    # ─────────────────────────────────────────────────────────────────────
    op.create_table(
        "member_magic_links",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("token_hash", name="uq_member_magic_link_token"),
    )
    op.create_index("ix_member_magic_links_email", "member_magic_links", ["email"])
    op.create_index("idx_member_magic_email_expiry", "member_magic_links", ["email", "expires_at"])


def downgrade() -> None:
    op.drop_index("idx_member_magic_email_expiry", table_name="member_magic_links")
    op.drop_index("ix_member_magic_links_email", table_name="member_magic_links")
    op.drop_table("member_magic_links")

    op.drop_index("idx_member_otp_phone_expiry", table_name="member_login_otps")
    op.drop_index("ix_member_login_otps_phone", table_name="member_login_otps")
    op.drop_table("member_login_otps")

    op.drop_index("ix_members_google_sub", table_name="members")
    op.drop_column("members", "last_member_login_at")
    op.drop_column("members", "google_sub")
