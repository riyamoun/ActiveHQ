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
    ActionCenterSummary,
    RevenueOpportunity,
    ActivityFeedItem,
    InactiveMemberInfo,
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

        # New members this month
        first_of_month = today.replace(day=1)
        month_start = datetime.combine(first_of_month, datetime.min.time()).replace(tzinfo=timezone.utc)
        new_joins_this_month = self.db.execute(
            select(func.count()).where(
                Member.gym_id == gym_id,
                Member.created_at >= month_start,
            )
        ).scalar() or 0
        
        return DashboardStats(
            total_members=total_members,
            active_members=active_members,
            expiring_soon=expiring_soon,
            expired_members=expired_members,
            today_check_ins=today_check_ins,
            today_collection=today_collection,
            members_with_dues=members_with_dues,
            total_dues=total_dues,
            new_joins_this_month=new_joins_this_month,
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
        page: int = 1,
        page_size: int = 100,
    ) -> list[ExpiringMemberInfo]:
        """Get list of members with expiring memberships (paginated)."""
        today = date.today()
        end_date = today + timedelta(days=days)
        q = (
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
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = self.db.execute(q).all()
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
        page: int = 1,
        page_size: int = 100,
    ) -> list[DuesMemberInfo]:
        """Get list of members with pending dues (paginated)."""
        stmt = (
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
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = self.db.execute(stmt).all()
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

    def get_action_center_summary(self, gym_id: uuid.UUID) -> ActionCenterSummary:
        """Summary for Today's Action Center: expiring, dues, inactive counts."""
        stats = self.get_dashboard_stats(gym_id)
        inactive_7d = self._count_inactive_members(gym_id, days=7)
        inactive_14d = self._count_inactive_members(gym_id, days=14)
        return ActionCenterSummary(
            expiring_count=stats.expiring_soon,
            dues_count=stats.members_with_dues,
            total_dues=stats.total_dues,
            inactive_7d_count=inactive_7d,
            inactive_14d_count=inactive_14d,
        )

    def _count_inactive_members(self, gym_id: uuid.UUID, days: int) -> int:
        """Members with active membership but no check-in in last N days."""
        today = date.today()
        cutoff = datetime.combine(today - timedelta(days=days), datetime.min.time()).replace(tzinfo=timezone.utc)
        active_sub = (
            select(Membership.member_id)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
            )
            .distinct()
        ).subquery()
        last_sub = (
            select(
                Attendance.member_id,
                func.max(Attendance.check_in_time).label("last_in"),
            )
            .where(Attendance.gym_id == gym_id)
            .group_by(Attendance.member_id)
        ).subquery()
        joined = active_sub.outerjoin(last_sub, active_sub.c.member_id == last_sub.c.member_id)
        from sqlalchemy import or_
        count = self.db.execute(
            select(func.count()).select_from(joined).where(
                or_(last_sub.c.last_in.is_(None), last_sub.c.last_in < cutoff)
            )
        ).scalar()
        return count or 0

    def get_revenue_opportunity(self, gym_id: uuid.UUID) -> RevenueOpportunity:
        """Potential renewal revenue from memberships expiring this week."""
        today = date.today()
        week_end = today + timedelta(days=7)
        q = (
            select(func.count(Membership.id), func.coalesce(func.sum(Plan.price), 0))
            .join(Plan, Membership.plan_id == Plan.id)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= week_end,
            )
        )
        row = self.db.execute(q).first()
        count = row[0] or 0
        amount = row[1] or Decimal("0")
        return RevenueOpportunity(potential_renewals_count=count, potential_revenue=amount)

    def get_activity_feed(self, gym_id: uuid.UUID, limit: int = 20) -> list[ActivityFeedItem]:
        """Unified feed: recent check-ins, payments, new members (sorted by time)."""
        today = date.today()
        cutoff_date = today - timedelta(days=14)
        cutoff_dt = datetime.combine(cutoff_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        items: list[tuple[datetime, ActivityFeedItem]] = []

        # Recent check-ins
        check_ins = self.db.execute(
            select(Attendance, Member.name)
            .join(Member, Attendance.member_id == Member.id)
            .where(
                Attendance.gym_id == gym_id,
                Attendance.check_in_time >= cutoff_dt,
            )
            .order_by(Attendance.check_in_time.desc())
            .limit(limit)
        ).all()
        for att, name in check_ins:
            items.append((
                att.check_in_time,
                ActivityFeedItem(
                    type="check_in",
                    title=f"{name} checked in",
                    subtitle=att.check_in_time.strftime("%I:%M %p"),
                    time=att.check_in_time.isoformat(),
                    link_id=str(att.id),
                ),
            ))

        # Recent payments
        payments = self.db.execute(
            select(Payment, Member.name)
            .join(Member, Payment.member_id == Member.id)
            .where(
                Payment.gym_id == gym_id,
                Payment.payment_date >= cutoff_date,
            )
            .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
            .limit(limit)
        ).all()
        for pay, name in payments:
            pay_dt = datetime.combine(pay.payment_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            items.append((
                pay_dt,
                ActivityFeedItem(
                    type="payment",
                    title=f"{name} paid ₹{pay.amount:,.0f}",
                    subtitle=pay.payment_date.strftime("%d %b"),
                    time=pay_dt.isoformat(),
                    link_id=str(pay.id),
                ),
            ))

        # New members (created in last 14 days)
        new_members = self.db.execute(
            select(Member).where(
                Member.gym_id == gym_id,
                Member.created_at >= cutoff_dt,
            ).order_by(Member.created_at.desc()).limit(limit)
        ).scalars().all()
        for m in new_members:
            items.append((
                m.created_at,
                ActivityFeedItem(
                    type="new_member",
                    title=f"{m.name} added as member",
                    subtitle=m.phone or "",
                    time=m.created_at.isoformat() if m.created_at else "",
                    link_id=str(m.id),
                ),
            ))

        items.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in items[:limit]]

    def get_inactive_members(
        self, gym_id: uuid.UUID, days: int = 7, page: int = 1, page_size: int = 50
    ) -> list[InactiveMemberInfo]:
        """Members with active membership but no check-in in last N days."""
        from sqlalchemy import or_
        today = date.today()
        cutoff = datetime.combine(today - timedelta(days=days), datetime.min.time()).replace(tzinfo=timezone.utc)
        active_sub = (
            select(Membership.member_id)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
            )
            .distinct()
        ).subquery()
        last_sub = (
            select(
                Attendance.member_id,
                func.max(Attendance.check_in_time).label("last_in"),
            )
            .where(Attendance.gym_id == gym_id)
            .group_by(Attendance.member_id)
        ).subquery()
        joined = active_sub.outerjoin(last_sub, active_sub.c.member_id == last_sub.c.member_id)
        inactive_ids = (
            select(active_sub.c.member_id)
            .select_from(joined)
            .where(or_(last_sub.c.last_in.is_(None), last_sub.c.last_in < cutoff))
        ).subquery()
        members = self.db.execute(
            select(Member)
            .where(
                Member.gym_id == gym_id,
                Member.id.in_(select(inactive_ids.c.member_id)),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).scalars().all()
        result = []
        for m in members:
            last_in_row = self.db.execute(
                select(func.max(Attendance.check_in_time)).where(
                    Attendance.gym_id == gym_id,
                    Attendance.member_id == m.id,
                )
            ).first()
            last_in = last_in_row[0] if last_in_row else None
            if last_in is None:
                days_inactive = days + 1
            else:
                last_utc = last_in if last_in.tzinfo else last_in.replace(tzinfo=timezone.utc)
                days_inactive = (datetime.now(timezone.utc) - last_utc).days
            result.append(
                InactiveMemberInfo(
                    member_id=str(m.id),
                    member_name=m.name,
                    member_phone=m.phone or "",
                    days_inactive=days_inactive,
                )
            )
        return result
