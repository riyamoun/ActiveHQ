"""
Audit log model - non-negotiable for 100+ gyms.
Protects legally: who did what, when, to which entity.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class AuditLog(Base):
    """
    Immutable audit trail for critical actions.
    entity_type: e.g. "member", "payment", "membership", "plan", "user"
    entity_id: optional UUID of the affected record
    old_data / new_data: JSON snapshots for updates; null for create/delete as needed
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gyms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # create, update, delete, etc.
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    old_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    new_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    gym = relationship("Gym", backref="audit_logs")
    user = relationship("User", backref="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, entity_type={self.entity_type})>"
