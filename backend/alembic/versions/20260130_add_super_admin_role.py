"""Add super_admin to user_role enum

Revision ID: add_super_admin
Revises: 2283644ecd5f
Create Date: 2026-01-30

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e51c1cbe7902"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL: add new enum value (order does not matter for storage)
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin'")


def downgrade() -> None:
    # PostgreSQL does not support removing an enum value easily.
    # If you need to roll back, you would need to recreate the type and column.
    pass
