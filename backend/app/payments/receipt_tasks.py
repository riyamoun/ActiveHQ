"""Background delivery of payment receipts (non-blocking API)."""

from __future__ import annotations

import uuid

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models import Member, Payment
from app.payments.service import PaymentService


def deliver_payment_receipt(payment_id: uuid.UUID, gym_id: uuid.UUID) -> None:
    db = SessionLocal()
    try:
        payment = db.execute(
            select(Payment).where(Payment.id == payment_id, Payment.gym_id == gym_id)
        ).scalar_one_or_none()
        if not payment:
            return
        member = db.execute(
            select(Member).where(Member.id == payment.member_id, Member.gym_id == gym_id)
        ).scalar_one_or_none()
        if not member:
            return
        PaymentService(db)._send_payment_receipt(payment, member)
    except Exception as exc:
        logger.warning("payment_receipt_background_failed payment_id=%s err=%s", payment_id, exc)
    finally:
        db.close()
