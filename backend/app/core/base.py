"""
SQLAlchemy base classes and mixins for all models.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Provides common functionality and type annotations.
    """
    
    # Enable type checking for relationships
    type_annotation_map = {
        uuid.UUID: UUID(as_uuid=True),
    }
    
    def to_dict(self) -> dict[str, Any]:
        """Convert model instance to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def __repr__(self) -> str:
        """String representation showing class name and id."""
        class_name = self.__class__.__name__
        if hasattr(self, "id"):
            return f"<{class_name}(id={self.id})>"
        return f"<{class_name}>"


class TimestampMixin:
    """
    Mixin that adds created_at and updated_at columns.
    Use with any model that needs timestamp tracking.
    """
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TenantMixin:
    """
    Mixin for multi-tenant models.
    Adds gym_id foreign key for tenant scoping.
    
    CRITICAL: All queries on models using this mixin
    MUST filter by gym_id to ensure data isolation.
    """
    
    @declared_attr
    def gym_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            nullable=False,
            index=True,
        )


class UUIDPrimaryKeyMixin:
    """
    Mixin that adds a UUID primary key.
    """
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
