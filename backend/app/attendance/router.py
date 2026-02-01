"""
Attendance management API endpoints.
"""

import uuid
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import TenantDep, DbDep
from app.attendance.schemas import (
    CheckInRequest,
    AttendanceResponse,
    AttendanceListResponse,
    DailyAttendanceSummary,
)
from app.attendance.service import AttendanceService


router = APIRouter()


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in_member(
    request: CheckInRequest,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Check in a member.
    
    Records the check-in time for a member.
    A member can only check in once per day unless they check out.
    """
    service = AttendanceService(db)
    
    try:
        attendance = service.check_in(
            gym_id=tenant.gym_id,
            member_id=request.member_id,
            marked_by=tenant.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(attendance)


@router.post("/check-out/{member_id}", response_model=AttendanceResponse)
def check_out_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Check out a member.
    
    Records the check-out time for a member's active check-in.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = AttendanceService(db)
    
    try:
        attendance = service.check_out(tenant.gym_id, member_uuid)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(attendance)


@router.get("", response_model=AttendanceListResponse)
def list_attendance(
    tenant: TenantDep,
    db: DbDep,
    target_date: date | None = Query(None, description="Filter by date"),
    member_id: uuid.UUID | None = Query(None, description="Filter by member"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """
    List attendance records.
    
    By default returns today's attendance if no date is specified.
    """
    if target_date is None:
        target_date = date.today()
    
    service = AttendanceService(db)
    return service.list_attendance(
        gym_id=tenant.gym_id,
        target_date=target_date,
        member_id=member_id,
        page=page,
        page_size=page_size,
    )


@router.get("/today", response_model=DailyAttendanceSummary)
def get_today_summary(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get today's attendance summary.
    
    Quick overview of today's check-ins.
    """
    service = AttendanceService(db)
    return service.get_daily_summary(tenant.gym_id)


@router.get("/daily-summary", response_model=DailyAttendanceSummary)
def get_daily_summary(
    tenant: TenantDep,
    db: DbDep,
    target_date: date = Query(..., description="Date to get summary for"),
):
    """
    Get attendance summary for a specific date.
    """
    service = AttendanceService(db)
    return service.get_daily_summary(tenant.gym_id, target_date)


@router.get("/currently-in", response_model=list[AttendanceResponse])
def get_currently_checked_in(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get members currently in the gym.
    
    Returns all members who have checked in today but haven't checked out.
    """
    service = AttendanceService(db)
    records = service.get_currently_checked_in(tenant.gym_id)
    return [service._build_response(r) for r in records]


@router.get("/member/{member_id}", response_model=list[AttendanceResponse])
def get_member_attendance(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
    from_date: date | None = Query(None, description="From date"),
    to_date: date | None = Query(None, description="To date"),
):
    """
    Get attendance history for a specific member.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = AttendanceService(db)
    records = service.get_member_attendance(
        gym_id=tenant.gym_id,
        member_id=member_uuid,
        from_date=from_date,
        to_date=to_date,
    )
    
    return [service._build_response(r) for r in records]


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(
    attendance_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get a specific attendance record.
    """
    try:
        attendance_uuid = uuid.UUID(attendance_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid attendance ID format",
        )
    
    service = AttendanceService(db)
    attendance = service.get_attendance(tenant.gym_id, attendance_uuid)
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )
    
    return service._build_response(attendance)
