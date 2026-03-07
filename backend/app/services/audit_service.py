"""
Audit log service - write-only audit trail for critical actions.
Use for payments, member delete, plan changes, etc.
"""

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog


def log(
    db: Session,
    *,
    gym_id: uuid.UUID,
    user_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None = None,
    old_data: dict[str, Any] | None = None,
    new_data: dict[str, Any] | None = None,
) -> None:
    """
    Append an audit log entry. Immutable; no update/delete.
    action: e.g. "create", "update", "delete"
    entity_type: e.g. "member", "payment", "membership", "plan", "user"
    """
    entry = AuditLog(
        gym_id=gym_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_data=old_data,
        new_data=new_data,
    )
    db.add(entry)
    db.flush()  # Get ID if needed; caller commits
