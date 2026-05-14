"""
Member-portal data endpoints (read-only for v1).

Mounted at /api/m.  All routes require a member-scoped JWT.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.member_portal.dependencies import CurrentMemberDep
from app.member_portal.schemas import (
    ActivePlan,
    AttendanceEntry,
    MemberMe,
    PaymentEntry,
)
from app.models import Attendance, Membership, Payment, Plan
from app.models.enums import MembershipStatus


router = APIRouter()


# ─────────────────────────────────────────────────────────────────────
# Profile + active plan
# ─────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=MemberMe)
def me(member: CurrentMemberDep) -> MemberMe:
    return MemberMe(
        id=member.id,
        gym_id=member.gym_id,
        gym_name=member.gym.name if member.gym else "",
        name=member.name,
        email=member.email,
        phone=member.phone,
        photo_url=member.photo_url,
        joined_date=member.joined_date,
    )


@router.get("/me/plan", response_model=ActivePlan)
def my_plan(
    member: CurrentMemberDep,
    db: Annotated[Session, Depends(get_db)],
) -> ActivePlan:
    """
    Return the *most relevant* membership: prefer the latest active one,
    otherwise fall back to the latest membership of any status so the UI
    can still show expiry / dues.
    """
    stmt = (
        select(Membership)
        .options(joinedload(Membership.plan))
        .where(Membership.member_id == member.id)
        .order_by(Membership.status.desc(), Membership.end_date.desc())
    )
    rows = list(db.execute(stmt).scalars().all())
    if not rows:
        return ActivePlan()

    # Prefer ACTIVE if available
    active = next((m for m in rows if m.status == MembershipStatus.ACTIVE), None)
    chosen = active or rows[0]

    today = date.today()
    days_remaining = (chosen.end_date - today).days if chosen.end_date else None
    plan_name: str | None = chosen.plan.name if isinstance(chosen.plan, Plan) else None

    amount_due_val: Decimal | None = None
    if chosen.amount_total is not None and chosen.amount_paid is not None:
        amount_due_val = chosen.amount_total - chosen.amount_paid

    return ActivePlan(
        membership_id=chosen.id,
        plan_name=plan_name,
        status=chosen.status,
        start_date=chosen.start_date,
        end_date=chosen.end_date,
        days_remaining=days_remaining,
        price=chosen.amount_total,
        amount_paid=chosen.amount_paid,
        amount_due=amount_due_val,
    )


# ─────────────────────────────────────────────────────────────────────
# Attendance history
# ─────────────────────────────────────────────────────────────────────

@router.get("/me/attendance", response_model=list[AttendanceEntry])
def my_attendance(
    member: CurrentMemberDep,
    db: Annotated[Session, Depends(get_db)],
    days: Annotated[int, Query(ge=1, le=180)] = 90,
    limit: Annotated[int, Query(ge=1, le=200)] = 60,
) -> list[AttendanceEntry]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.execute(
            select(Attendance)
            .where(Attendance.member_id == member.id)
            .where(Attendance.check_in_time >= since)
            .order_by(Attendance.check_in_time.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    out: list[AttendanceEntry] = []
    for row in rows:
        duration: int | None = None
        if row.check_out_time and row.check_in_time:
            seconds = (row.check_out_time - row.check_in_time).total_seconds()
            if seconds > 0:
                duration = int(seconds // 60)
        out.append(
            AttendanceEntry(
                id=row.id,
                check_in_time=row.check_in_time,
                check_out_time=row.check_out_time,
                duration_minutes=duration,
            )
        )
    return out


# ─────────────────────────────────────────────────────────────────────
# Payment history
# ─────────────────────────────────────────────────────────────────────

@router.get("/me/payments", response_model=list[PaymentEntry])
def my_payments(
    member: CurrentMemberDep,
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[PaymentEntry]:
    rows = (
        db.execute(
            select(Payment)
            .where(Payment.member_id == member.id)
            .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [
        PaymentEntry(
            id=row.id,
            amount=row.amount,
            payment_mode=row.payment_mode,
            payment_date=row.payment_date,
            notes=row.notes,
            reference_number=row.reference_number,
        )
        for row in rows
    ]
