"""
Reports service - aggregated business intelligence.
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models import Member, Membership, Payment, Attendance, Plan
from app.models.enums import MembershipStatus
from app.reports.schemas import (
    DashboardStats,
    MembershipStats,
    CollectionReport,
    ExpiringMemberInfo,
    DuesMemberInfo,
)


class ReportsService:
    """Service class for generating reports."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self, gym_id: uuid.UUID) -> DashboardStats:
        """Get dashboard overview statistics."""
        today = date.today()
        week_from_now = today + timedelta(days=7)
        
        # Total members
        total_members = self.db.execute(
            select(func.count()).where(
                Member.gym_id == gym_id,
                Member.is_active == True,  # noqa: E712
            )
        ).scalar() or 0
        
        # Active members (with valid membership)
        active_subquery = (
            select(Membership.member_id)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
            )
            .distinct()
        )
        active_members = self.db.execute(
            select(func.count()).select_from(active_subquery.subquery())
        ).scalar() or 0
        
        # Expiring soon (next 7 days)
        expiring_subquery = (
            select(Membership.member_id)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= week_from_now,
            )
            .distinct()
        )
        expiring_soon = self.db.execute(
            select(func.count()).select_from(expiring_subquery.subquery())
        ).scalar() or 0
        
        # Expired members
        expired_members = total_members - active_members
        
        # Today's check-ins
        today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
        today_end = today_start + timedelta(days=1)
        
        today_check_ins = self.db.execute(
            select(func.count()).where(
                Attendance.gym_id == gym_id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end,
            )
        ).scalar() or 0
        
        # Today's collection
        today_collection = self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.gym_id == gym_id,
                Payment.payment_date == today,
            )
        ).scalar() or Decimal("0")
        
        # Members with dues
        dues_result = self.db.execute(
            select(
                func.count(func.distinct(Membership.member_id)),
                func.coalesce(func.sum(Membership.amount_total - Membership.amount_paid), 0)
            ).where(
                Membership.gym_id == gym_id,
                Membership.amount_total > Membership.amount_paid,
            )
        ).first()
        
        members_with_dues = dues_result[0] if dues_result else 0
        total_dues = dues_result[1] if dues_result else Decimal("0")
        
        return DashboardStats(
            total_members=total_members,
            active_members=active_members,
            expiring_soon=expiring_soon,
            expired_members=expired_members,
            today_check_ins=today_check_ins,
            today_collection=today_collection,
            members_with_dues=members_with_dues,
            total_dues=total_dues,
        )
    
    def get_membership_stats(self, gym_id: uuid.UUID) -> MembershipStats:
        """Get membership statistics."""
        today = date.today()
        week_from_now = today + timedelta(days=7)
        month_from_now = today + timedelta(days=30)
        
        # Active memberships
        total_active = self.db.execute(
            select(func.count()).where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
            )
        ).scalar() or 0
        
        # Paused memberships
        total_paused = self.db.execute(
            select(func.count()).where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.PAUSED,
            )
        ).scalar() or 0
        
        # Expired memberships (active but end_date passed)
        total_expired = self.db.execute(
            select(func.count()).where(
                Membership.gym_id == gym_id,
                Membership.status.in_([MembershipStatus.ACTIVE, MembershipStatus.EXPIRED]),
                Membership.end_date < today,
            )
        ).scalar() or 0
        
        # Expiring this week
        expiring_this_week = self.db.execute(
            select(func.count()).where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= week_from_now,
            )
        ).scalar() or 0
        
        # Expiring this month
        expiring_this_month = self.db.execute(
            select(func.count()).where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= month_from_now,
            )
        ).scalar() or 0
        
        return MembershipStats(
            total_active=total_active,
            total_paused=total_paused,
            total_expired=total_expired,
            expiring_this_week=expiring_this_week,
            expiring_this_month=expiring_this_month,
        )
    
    def get_collection_report(
        self,
        gym_id: uuid.UUID,
        from_date: date,
        to_date: date,
    ) -> CollectionReport:
        """Get collection report for a date range."""
        # Total and count
        result = self.db.execute(
            select(
                func.coalesce(func.sum(Payment.amount), 0),
                func.count(),
            ).where(
                Payment.gym_id == gym_id,
                Payment.payment_date >= from_date,
                Payment.payment_date <= to_date,
            )
        ).first()
        
        total_amount = result[0] if result else Decimal("0")
        total_transactions = result[1] if result else 0
        
        # By mode
        mode_result = self.db.execute(
            select(
                Payment.payment_mode,
                func.sum(Payment.amount),
            ).where(
                Payment.gym_id == gym_id,
                Payment.payment_date >= from_date,
                Payment.payment_date <= to_date,
            ).group_by(Payment.payment_mode)
        ).all()
        
        by_mode = {row[0].value: row[1] for row in mode_result}
        
        # Daily breakdown
        daily_result = self.db.execute(
            select(
                Payment.payment_date,
                func.sum(Payment.amount),
                func.count(),
            ).where(
                Payment.gym_id == gym_id,
                Payment.payment_date >= from_date,
                Payment.payment_date <= to_date,
            ).group_by(Payment.payment_date).order_by(Payment.payment_date)
        ).all()
        
        daily_breakdown = [
            {"date": str(row[0]), "amount": float(row[1]), "count": row[2]}
            for row in daily_result
        ]
        
        return CollectionReport(
            from_date=from_date,
            to_date=to_date,
            total_amount=total_amount,
            total_transactions=total_transactions,
            by_mode=by_mode,
            daily_breakdown=daily_breakdown,
        )
    
    def get_expiring_members_report(
        self,
        gym_id: uuid.UUID,
        days: int = 7,
    ) -> list[ExpiringMemberInfo]:
        """Get list of members with expiring memberships."""
        today = date.today()
        end_date = today + timedelta(days=days)
        
        # Get expiring memberships with member and plan info
        result = self.db.execute(
            select(Membership, Member, Plan)
            .join(Member, Membership.member_id == Member.id)
            .join(Plan, Membership.plan_id == Plan.id)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= end_date,
            )
            .order_by(Membership.end_date)
        ).all()
        
        return [
            ExpiringMemberInfo(
                member_id=str(membership.member_id),
                member_name=member.name,
                member_phone=member.phone,
                plan_name=plan.name,
                end_date=membership.end_date,
                days_until_expiry=(membership.end_date - today).days,
                amount_due=membership.amount_total - membership.amount_paid,
            )
            for membership, member, plan in result
        ]
    
    def get_members_with_dues_report(
        self,
        gym_id: uuid.UUID,
    ) -> list[DuesMemberInfo]:
        """Get list of members with pending dues."""
        # Get memberships with dues
        result = self.db.execute(
            select(
                Membership.member_id,
                Member.name,
                Member.phone,
                func.sum(Membership.amount_total - Membership.amount_paid).label("total_due"),
                func.max(Membership.end_date).label("latest_end"),
            )
            .join(Member, Membership.member_id == Member.id)
            .where(
                Membership.gym_id == gym_id,
                Membership.amount_total > Membership.amount_paid,
            )
            .group_by(Membership.member_id, Member.name, Member.phone)
            .having(func.sum(Membership.amount_total - Membership.amount_paid) > 0)
            .order_by(func.sum(Membership.amount_total - Membership.amount_paid).desc())
        ).all()
        
        return [
            DuesMemberInfo(
                member_id=str(row[0]),
                member_name=row[1],
                member_phone=row[2],
                total_due=row[3],
                membership_end=row[4],
            )
            for row in result
        ]
