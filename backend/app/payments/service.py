"""
Payment management service.
"""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models import Payment, Member, User, Membership
from app.models.enums import PaymentMode
from app.payments.schemas import (
    PaymentCreate,
    PaymentResponse,
    PaymentSummary,
    PaymentListResponse,
    DailyCollectionSummary,
)


class PaymentService:
    """Service class for payment operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _build_response(self, payment: Payment) -> PaymentResponse:
        """Build full response with related data."""
        member = self.db.execute(
            select(Member).where(Member.id == payment.member_id)
        ).scalar_one_or_none()
        
        receiver = None
        if payment.received_by:
            receiver = self.db.execute(
                select(User).where(User.id == payment.received_by)
            ).scalar_one_or_none()
        
        return PaymentResponse(
            id=payment.id,
            gym_id=payment.gym_id,
            member_id=payment.member_id,
            membership_id=payment.membership_id,
            amount=payment.amount,
            tax_amount=payment.tax_amount,
            total_amount=payment.amount + payment.tax_amount,
            payment_mode=payment.payment_mode,
            payment_date=payment.payment_date,
            reference_number=payment.reference_number,
            notes=payment.notes,
            received_by=payment.received_by,
            member_name=member.name if member else None,
            member_phone=member.phone if member else None,
            received_by_name=receiver.name if receiver else None,
        )
    
    def _build_summary(self, payment: Payment) -> PaymentSummary:
        """Build summary for lists."""
        member = self.db.execute(
            select(Member).where(Member.id == payment.member_id)
        ).scalar_one_or_none()
        
        return PaymentSummary(
            id=payment.id,
            member_name=member.name if member else "Unknown",
            amount=payment.amount,
            payment_mode=payment.payment_mode,
            payment_date=payment.payment_date,
        )
    
    def create_payment(
        self,
        gym_id: uuid.UUID,
        data: PaymentCreate,
        received_by: uuid.UUID | None = None,
    ) -> Payment:
        """Record a new payment."""
        # Verify member exists
        member = self.db.execute(
            select(Member).where(
                Member.gym_id == gym_id,
                Member.id == data.member_id,
            )
        ).scalar_one_or_none()
        
        if not member:
            raise ValueError("Member not found")
        
        # Verify membership if provided
        if data.membership_id:
            membership = self.db.execute(
                select(Membership).where(
                    Membership.gym_id == gym_id,
                    Membership.id == data.membership_id,
                )
            ).scalar_one_or_none()
            
            if not membership:
                raise ValueError("Membership not found")
            
            # Update membership amount_paid
            membership.amount_paid = membership.amount_paid + data.amount
        
        payment = Payment(
            gym_id=gym_id,
            member_id=data.member_id,
            membership_id=data.membership_id,
            amount=data.amount,
            tax_amount=data.tax_amount,
            payment_mode=data.payment_mode,
            payment_date=data.payment_date or date.today(),
            reference_number=data.reference_number,
            notes=data.notes,
            received_by=received_by,
        )
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        return payment
    
    def get_payment(
        self,
        gym_id: uuid.UUID,
        payment_id: uuid.UUID,
    ) -> Payment | None:
        """Get payment by ID."""
        return self.db.execute(
            select(Payment).where(
                Payment.gym_id == gym_id,
                Payment.id == payment_id,
            )
        ).scalar_one_or_none()
    
    def list_payments(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
        payment_mode: PaymentMode | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaymentListResponse:
        """List payments with filtering and pagination."""
        # Base query
        query = select(Payment).where(Payment.gym_id == gym_id)
        
        if member_id:
            query = query.where(Payment.member_id == member_id)
        if from_date:
            query = query.where(Payment.payment_date >= from_date)
        if to_date:
            query = query.where(Payment.payment_date <= to_date)
        if payment_mode:
            query = query.where(Payment.payment_mode == payment_mode)
        
        # Count and sum
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar() or 0
        
        sum_query = select(func.coalesce(func.sum(Payment.amount), 0)).select_from(query.subquery())
        total_amount = self.db.execute(sum_query).scalar() or Decimal("0")
        
        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(Payment.payment_date.desc(), Payment.created_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = self.db.execute(query)
        payments = result.scalars().all()
        
        return PaymentListResponse(
            items=[self._build_summary(p) for p in payments],
            total=total,
            total_amount=total_amount,
            page=page,
            page_size=page_size,
        )
    
    def get_member_payments(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
    ) -> list[Payment]:
        """Get all payments for a member."""
        result = self.db.execute(
            select(Payment).where(
                Payment.gym_id == gym_id,
                Payment.member_id == member_id,
            ).order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())
    
    def get_daily_collection(
        self,
        gym_id: uuid.UUID,
        target_date: date | None = None,
    ) -> DailyCollectionSummary:
        """Get daily collection summary."""
        target_date = target_date or date.today()
        
        # Get all payments for the day
        result = self.db.execute(
            select(Payment).where(
                Payment.gym_id == gym_id,
                Payment.payment_date == target_date,
            )
        )
        payments = result.scalars().all()
        
        # Calculate totals
        total_amount = Decimal("0")
        by_mode: dict[str, Decimal] = {}
        
        for payment in payments:
            total_amount += payment.amount
            mode_key = payment.payment_mode.value
            by_mode[mode_key] = by_mode.get(mode_key, Decimal("0")) + payment.amount
        
        return DailyCollectionSummary(
            date=target_date,
            total_amount=total_amount,
            payment_count=len(payments),
            by_mode=by_mode,
        )
    
    def get_collection_range(
        self,
        gym_id: uuid.UUID,
        from_date: date,
        to_date: date,
    ) -> list[DailyCollectionSummary]:
        """Get daily collection summaries for a date range."""
        from datetime import timedelta
        
        summaries = []
        current_date = from_date
        
        while current_date <= to_date:
            summary = self.get_daily_collection(gym_id, current_date)
            summaries.append(summary)
            current_date += timedelta(days=1)
        
        return summaries
