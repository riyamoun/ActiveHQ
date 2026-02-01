"""
Payment management API endpoints.
"""

import uuid
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import TenantDep, DbDep
from app.models.enums import PaymentMode
from app.payments.schemas import (
    PaymentCreate,
    PaymentResponse,
    PaymentListResponse,
    DailyCollectionSummary,
)
from app.payments.service import PaymentService


router = APIRouter()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    request: PaymentCreate,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Record a new payment.
    
    If membership_id is provided, the membership's amount_paid
    will be automatically updated.
    """
    service = PaymentService(db)
    
    try:
        payment = service.create_payment(
            gym_id=tenant.gym_id,
            data=request,
            received_by=tenant.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(payment)


@router.get("", response_model=PaymentListResponse)
def list_payments(
    tenant: TenantDep,
    db: DbDep,
    member_id: uuid.UUID | None = Query(None, description="Filter by member"),
    from_date: date | None = Query(None, description="From date"),
    to_date: date | None = Query(None, description="To date"),
    payment_mode: PaymentMode | None = Query(None, description="Filter by payment mode"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List payments with filtering and pagination.
    """
    service = PaymentService(db)
    return service.list_payments(
        gym_id=tenant.gym_id,
        member_id=member_id,
        from_date=from_date,
        to_date=to_date,
        payment_mode=payment_mode,
        page=page,
        page_size=page_size,
    )


@router.get("/daily", response_model=DailyCollectionSummary)
def get_daily_collection(
    tenant: TenantDep,
    db: DbDep,
    target_date: date | None = Query(None, description="Date (defaults to today)"),
):
    """
    Get daily collection summary.
    
    Shows total collection and breakdown by payment mode.
    """
    service = PaymentService(db)
    return service.get_daily_collection(tenant.gym_id, target_date)


@router.get("/collection-range", response_model=list[DailyCollectionSummary])
def get_collection_range(
    tenant: TenantDep,
    db: DbDep,
    from_date: date = Query(..., description="Start date"),
    to_date: date = Query(..., description="End date"),
):
    """
    Get daily collection summaries for a date range.
    
    Useful for weekly/monthly reports.
    """
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date must be before or equal to to_date",
        )
    
    # Limit range to 90 days
    from datetime import timedelta
    if (to_date - from_date).days > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range cannot exceed 90 days",
        )
    
    service = PaymentService(db)
    return service.get_collection_range(tenant.gym_id, from_date, to_date)


@router.get("/member/{member_id}", response_model=list[PaymentResponse])
def get_member_payments(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get all payments for a specific member.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = PaymentService(db)
    payments = service.get_member_payments(tenant.gym_id, member_uuid)
    
    return [service._build_response(p) for p in payments]


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get a specific payment by ID.
    """
    try:
        payment_uuid = uuid.UUID(payment_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment ID format",
        )
    
    service = PaymentService(db)
    payment = service.get_payment(tenant.gym_id, payment_uuid)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    
    return service._build_response(payment)
