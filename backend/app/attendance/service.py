"""
Attendance management service.
"""

import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models import Attendance, Member, User
from app.attendance.schemas import (
    AttendanceResponse,
    AttendanceSummary,
    DailyAttendanceSummary,
    AttendanceListResponse,
)


class AttendanceService:
    """Service class for attendance operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _build_response(self, attendance: Attendance) -> AttendanceResponse:
        """Build full response with related data."""
        member = self.db.execute(
            select(Member).where(Member.id == attendance.member_id)
        ).scalar_one_or_none()
        
        marker = None
        if attendance.marked_by:
            marker = self.db.execute(
                select(User).where(User.id == attendance.marked_by)
            ).scalar_one_or_none()
        
        return AttendanceResponse(
            id=attendance.id,
            gym_id=attendance.gym_id,
            member_id=attendance.member_id,
            check_in_time=attendance.check_in_time,
            check_out_time=attendance.check_out_time,
            marked_by=attendance.marked_by,
            member_name=member.name if member else None,
            member_phone=member.phone if member else None,
            marked_by_name=marker.name if marker else None,
        )
    
    def _build_summary(self, attendance: Attendance) -> AttendanceSummary:
        """Build summary for lists."""
        member = self.db.execute(
            select(Member).where(Member.id == attendance.member_id)
        ).scalar_one_or_none()
        
        return AttendanceSummary(
            id=attendance.id,
            member_name=member.name if member else "Unknown",
            check_in_time=attendance.check_in_time,
            check_out_time=attendance.check_out_time,
        )
    
    def check_in(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        marked_by: uuid.UUID | None = None,
    ) -> Attendance:
        """
        Check in a member.
        
        Creates a new attendance record with current timestamp.
        """
        # Verify member exists and is active
        member = self.db.execute(
            select(Member).where(
                Member.gym_id == gym_id,
                Member.id == member_id,
                Member.is_active == True,  # noqa: E712
            )
        ).scalar_one_or_none()
        
        if not member:
            raise ValueError("Member not found or inactive")
        
        # Check if already checked in today (without checkout)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        existing = self.db.execute(
            select(Attendance).where(
                Attendance.gym_id == gym_id,
                Attendance.member_id == member_id,
                Attendance.check_in_time >= today_start,
                Attendance.check_out_time.is_(None),
            )
        ).scalar_one_or_none()
        
        if existing:
            raise ValueError("Member is already checked in. Please check out first.")
        
        attendance = Attendance(
            gym_id=gym_id,
            member_id=member_id,
            check_in_time=datetime.now(timezone.utc),
            marked_by=marked_by,
        )
        
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        
        return attendance
    
    def check_out(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
    ) -> Attendance:
        """
        Check out a member.
        
        Updates the most recent check-in record with checkout time.
        """
        # Find most recent check-in without checkout
        attendance = self.db.execute(
            select(Attendance).where(
                Attendance.gym_id == gym_id,
                Attendance.member_id == member_id,
                Attendance.check_out_time.is_(None),
            ).order_by(Attendance.check_in_time.desc())
        ).scalar_one_or_none()
        
        if not attendance:
            raise ValueError("No active check-in found for this member")
        
        attendance.check_out_time = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(attendance)
        
        return attendance
    
    def get_attendance(
        self,
        gym_id: uuid.UUID,
        attendance_id: uuid.UUID,
    ) -> Attendance | None:
        """Get attendance record by ID."""
        return self.db.execute(
            select(Attendance).where(
                Attendance.gym_id == gym_id,
                Attendance.id == attendance_id,
            )
        ).scalar_one_or_none()
    
    def list_attendance(
        self,
        gym_id: uuid.UUID,
        target_date: date | None = None,
        member_id: uuid.UUID | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> AttendanceListResponse:
        """List attendance records with filtering and pagination."""
        # Base query
        query = select(Attendance).where(Attendance.gym_id == gym_id)
        
        if target_date:
            # Filter by date
            day_start = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            query = query.where(
                Attendance.check_in_time >= day_start,
                Attendance.check_in_time < day_end,
            )
        
        if member_id:
            query = query.where(Attendance.member_id == member_id)
        
        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar() or 0
        
        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(Attendance.check_in_time.desc())
        query = query.offset(offset).limit(page_size)
        
        result = self.db.execute(query)
        records = result.scalars().all()
        
        return AttendanceListResponse(
            items=[self._build_summary(r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
        )
    
    def get_member_attendance(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> list[Attendance]:
        """Get attendance history for a member."""
        query = select(Attendance).where(
            Attendance.gym_id == gym_id,
            Attendance.member_id == member_id,
        )
        
        if from_date:
            day_start = datetime.combine(from_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.where(Attendance.check_in_time >= day_start)
        
        if to_date:
            day_end = datetime.combine(to_date, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.where(Attendance.check_in_time <= day_end)
        
        query = query.order_by(Attendance.check_in_time.desc())
        
        result = self.db.execute(query)
        return list(result.scalars().all())
    
    def get_daily_summary(
        self,
        gym_id: uuid.UUID,
        target_date: date | None = None,
    ) -> DailyAttendanceSummary:
        """Get daily attendance summary."""
        target_date = target_date or date.today()
        
        day_start = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        
        # Count total check-ins
        total_count = self.db.execute(
            select(func.count()).where(
                Attendance.gym_id == gym_id,
                Attendance.check_in_time >= day_start,
                Attendance.check_in_time < day_end,
            )
        ).scalar() or 0
        
        # Count unique members
        unique_count = self.db.execute(
            select(func.count(func.distinct(Attendance.member_id))).where(
                Attendance.gym_id == gym_id,
                Attendance.check_in_time >= day_start,
                Attendance.check_in_time < day_end,
            )
        ).scalar() or 0
        
        return DailyAttendanceSummary(
            date=target_date,
            total_check_ins=total_count,
            unique_members=unique_count,
        )
    
    def get_currently_checked_in(
        self,
        gym_id: uuid.UUID,
    ) -> list[Attendance]:
        """Get members currently checked in (no checkout)."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        result = self.db.execute(
            select(Attendance).where(
                Attendance.gym_id == gym_id,
                Attendance.check_in_time >= today_start,
                Attendance.check_out_time.is_(None),
            ).order_by(Attendance.check_in_time.desc())
        )
        return list(result.scalars().all())
