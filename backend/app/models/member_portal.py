"""
Models for the member portal authentication flows.

Two short-lived single-use challenges:
  * MemberLoginOtp     — WhatsApp/SMS OTP code keyed by phone
  * MemberMagicLink    — email magic-link token keyed by email

Both store only a SHA-256 hash of the code/token; the raw value never
hits the database. Both are deliberately gym-agnostic at issue time
because a member may exist at multiple gyms — the auth router does the
fan-out at verification time.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MemberLoginOtp(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Single-use WhatsApp/SMS one-time-password for member login."""

    __tablename__ = "member_login_otps"

    phone: Mapped[str] = mapped_column(String(15), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45))

    __table_args__ = (
        Index("idx_member_otp_phone_expiry", "phone", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<MemberLoginOtp(phone='{self.phone}', expires_at={self.expires_at})>"


class MemberMagicLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Single-use email magic-link token for member login."""

    __tablename__ = "member_magic_links"

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(45))

    __table_args__ = (
        Index("idx_member_magic_email_expiry", "email", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<MemberMagicLink(email='{self.email}', expires_at={self.expires_at})>"
