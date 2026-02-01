from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DemoRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "demo_requests"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gym_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    locality: Mapped[Optional[str]] = mapped_column(String(80))
    email: Mapped[Optional[str]] = mapped_column(String(120))
    source: Mapped[Optional[str]] = mapped_column(String(50), default="public_site")
