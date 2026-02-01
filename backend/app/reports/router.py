"""
Reports API endpoints.
"""

from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import TenantDep, DbDep
from app.reports.schemas import (
    DashboardStats,
    MembershipStats,
    CollectionReport,
    ExpiringMemberInfo,
    DuesMemberInfo,
)
from app.reports.service import ReportsService


router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get dashboard overview statistics.
    
    Returns key metrics for the gym dashboard:
    - Total and active members
    - Expiring memberships
    - Today's check-ins and collection
    - Members with dues
    """
    service = ReportsService(db)
    return service.get_dashboard_stats(tenant.gym_id)


@router.get("/memberships", response_model=MembershipStats)
def get_membership_stats(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get membership statistics.
    
    Breakdown of memberships by status and expiry timeline.
    """
    service = ReportsService(db)
    return service.get_membership_stats(tenant.gym_id)


@router.get("/collection", response_model=CollectionReport)
def get_collection_report(
    tenant: TenantDep,
    db: DbDep,
    from_date: date = Query(..., description="Start date"),
    to_date: date = Query(..., description="End date"),
):
    """
    Get collection report for a date range.
    
    Includes:
    - Total collection
    - Breakdown by payment mode
    - Daily breakdown
    """
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date must be before or equal to to_date",
        )
    
    # Limit range to 365 days
    if (to_date - from_date).days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range cannot exceed 365 days",
        )
    
    service = ReportsService(db)
    return service.get_collection_report(tenant.gym_id, from_date, to_date)


@router.get("/collection/today", response_model=CollectionReport)
def get_today_collection(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get today's collection report.
    """
    today = date.today()
    service = ReportsService(db)
    return service.get_collection_report(tenant.gym_id, today, today)


@router.get("/collection/this-week", response_model=CollectionReport)
def get_this_week_collection(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get this week's collection report (Monday to today).
    """
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    service = ReportsService(db)
    return service.get_collection_report(tenant.gym_id, monday, today)


@router.get("/collection/this-month", response_model=CollectionReport)
def get_this_month_collection(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get this month's collection report.
    """
    today = date.today()
    first_of_month = today.replace(day=1)
    service = ReportsService(db)
    return service.get_collection_report(tenant.gym_id, first_of_month, today)


@router.get("/expiring-members", response_model=list[ExpiringMemberInfo])
def get_expiring_members(
    tenant: TenantDep,
    db: DbDep,
    days: int = Query(7, ge=1, le=90, description="Days until expiry"),
):
    """
    Get members with memberships expiring soon.
    
    Useful for renewal campaigns and reminders.
    """
    service = ReportsService(db)
    return service.get_expiring_members_report(tenant.gym_id, days)


@router.get("/members-with-dues", response_model=list[DuesMemberInfo])
def get_members_with_dues(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get members with pending payment dues.
    
    Sorted by due amount (highest first).
    """
    service = ReportsService(db)
    return service.get_members_with_dues_report(tenant.gym_id)
