"""
Membership management service.
"""

import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models import Membership, Member, Plan
from app.models.enums import MembershipStatus
from app.memberships.schemas import (
    MembershipCreate,
    MembershipUpdate,
    MembershipRenew,
    MembershipResponse,
    MembershipSummary,
    MembershipListResponse,
)


class MembershipService:
    """Service class for membership operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _build_response(self, membership: Membership) -> MembershipResponse:
        """Build full response with related data."""
        # Get member info
        member = self.db.execute(
            select(Member).where(Member.id == membership.member_id)
        ).scalar_one_or_none()
        
        # Get plan info
        plan = self.db.execute(
            select(Plan).where(Plan.id == membership.plan_id)
        ).scalar_one_or_none()
        
        return MembershipResponse(
            id=membership.id,
            gym_id=membership.gym_id,
            member_id=membership.member_id,
            plan_id=membership.plan_id,
            start_date=membership.start_date,
            end_date=membership.end_date,
            amount_total=membership.amount_total,
            amount_paid=membership.amount_paid,
            amount_due=membership.amount_total - membership.amount_paid,
            status=membership.status,
            notes=membership.notes,
            created_by=membership.created_by,
            member_name=member.name if member else None,
            member_phone=member.phone if member else None,
            plan_name=plan.name if plan else None,
        )
    
    def _build_summary(self, membership: Membership) -> MembershipSummary:
        """Build summary with related data."""
        member = self.db.execute(
            select(Member).where(Member.id == membership.member_id)
        ).scalar_one_or_none()
        
        plan = self.db.execute(
            select(Plan).where(Plan.id == membership.plan_id)
        ).scalar_one_or_none()
        
        return MembershipSummary(
            id=membership.id,
            member_id=membership.member_id,
            member_name=member.name if member else "Unknown",
            plan_name=plan.name if plan else "Unknown",
            start_date=membership.start_date,
            end_date=membership.end_date,
            status=membership.status,
            amount_due=membership.amount_total - membership.amount_paid,
        )
    
    def create_membership(
        self,
        gym_id: uuid.UUID,
        data: MembershipCreate,
        created_by: uuid.UUID | None = None,
    ) -> Membership:
        """Create a new membership for a member."""
        # Get plan for duration and price
        plan = self.db.execute(
            select(Plan).where(
                Plan.gym_id == gym_id,
                Plan.id == data.plan_id,
            )
        ).scalar_one_or_none()
        
        if not plan:
            raise ValueError("Plan not found")
        
        if not plan.is_active:
            raise ValueError("Plan is not active")
        
        # Verify member exists
        member = self.db.execute(
            select(Member).where(
                Member.gym_id == gym_id,
                Member.id == data.member_id,
            )
        ).scalar_one_or_none()
        
        if not member:
            raise ValueError("Member not found")
        
        # Calculate dates
        start_date = data.start_date or date.today()
        end_date = start_date + timedelta(days=plan.duration_days)
        
        # Use plan price if amount not specified
        amount_total = data.amount_total if data.amount_total is not None else plan.price
        
        membership = Membership(
            gym_id=gym_id,
            member_id=data.member_id,
            plan_id=data.plan_id,
            start_date=start_date,
            end_date=end_date,
            amount_total=amount_total,
            amount_paid=data.amount_paid,
            status=MembershipStatus.ACTIVE,
            notes=data.notes,
            created_by=created_by,
        )
        
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def get_membership(
        self,
        gym_id: uuid.UUID,
        membership_id: uuid.UUID,
    ) -> Membership | None:
        """Get membership by ID."""
        return self.db.execute(
            select(Membership).where(
                Membership.gym_id == gym_id,
                Membership.id == membership_id,
            )
        ).scalar_one_or_none()
    
    def get_member_active_membership(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
    ) -> Membership | None:
        """Get member's current active membership."""
        today = date.today()
        return self.db.execute(
            select(Membership).where(
                Membership.gym_id == gym_id,
                Membership.member_id == member_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
            ).order_by(Membership.end_date.desc())
        ).scalar_one_or_none()
    
    def get_member_memberships(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
    ) -> list[Membership]:
        """Get all memberships for a member."""
        result = self.db.execute(
            select(Membership).where(
                Membership.gym_id == gym_id,
                Membership.member_id == member_id,
            ).order_by(Membership.start_date.desc())
        )
        return list(result.scalars().all())
    
    def update_membership(
        self,
        membership: Membership,
        data: MembershipUpdate,
    ) -> Membership:
        """Update membership details."""
        if data.status is not None:
            membership.status = data.status
        if data.notes is not None:
            membership.notes = data.notes
        
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def renew_membership(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        data: MembershipRenew,
        created_by: uuid.UUID | None = None,
    ) -> Membership:
        """
        Renew a member's membership.
        
        Creates a new membership starting after the current one ends.
        """
        # Get current membership to determine new start date
        current = self.get_member_active_membership(gym_id, member_id)
        
        # Determine plan
        plan_id = data.plan_id
        if not plan_id and current:
            plan_id = current.plan_id
        
        if not plan_id:
            raise ValueError("No plan specified and no existing membership found")
        
        # Get plan
        plan = self.db.execute(
            select(Plan).where(
                Plan.gym_id == gym_id,
                Plan.id == plan_id,
            )
        ).scalar_one_or_none()
        
        if not plan:
            raise ValueError("Plan not found")
        
        # Determine start date
        if data.start_date:
            start_date = data.start_date
        elif current:
            # Start day after current membership ends
            start_date = current.end_date + timedelta(days=1)
        else:
            start_date = date.today()
        
        # Calculate end date
        end_date = start_date + timedelta(days=plan.duration_days)
        
        # Amount
        amount_total = data.amount_total if data.amount_total is not None else plan.price
        
        # Create new membership
        membership = Membership(
            gym_id=gym_id,
            member_id=member_id,
            plan_id=plan_id,
            start_date=start_date,
            end_date=end_date,
            amount_total=amount_total,
            amount_paid=data.amount_paid,
            status=MembershipStatus.ACTIVE,
            notes=data.notes,
            created_by=created_by,
        )
        
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def pause_membership(self, membership: Membership) -> Membership:
        """Pause an active membership."""
        if membership.status != MembershipStatus.ACTIVE:
            raise ValueError("Can only pause active memberships")
        
        membership.status = MembershipStatus.PAUSED
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def resume_membership(self, membership: Membership) -> Membership:
        """Resume a paused membership."""
        if membership.status != MembershipStatus.PAUSED:
            raise ValueError("Can only resume paused memberships")
        
        membership.status = MembershipStatus.ACTIVE
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def cancel_membership(self, membership: Membership) -> Membership:
        """Cancel a membership."""
        membership.status = MembershipStatus.CANCELLED
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def update_payment(
        self,
        membership: Membership,
        amount: Decimal,
    ) -> Membership:
        """Update membership payment (add to amount_paid)."""
        membership.amount_paid = membership.amount_paid + amount
        self.db.commit()
        self.db.refresh(membership)
        
        return membership
    
    def list_memberships(
        self,
        gym_id: uuid.UUID,
        status: MembershipStatus | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> MembershipListResponse:
        """List memberships with filtering and pagination."""
        # Base query
        query = select(Membership).where(Membership.gym_id == gym_id)
        
        if status:
            query = query.where(Membership.status == status)
        
        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar() or 0
        
        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(Membership.created_at.desc()).offset(offset).limit(page_size)
        
        result = self.db.execute(query)
        memberships = result.scalars().all()
        
        return MembershipListResponse(
            items=[self._build_summary(m) for m in memberships],
            total=total,
            page=page,
            page_size=page_size,
        )
    
    def expire_memberships(self, gym_id: uuid.UUID) -> int:
        """
        Mark expired memberships as expired.
        
        Should be run daily via scheduled job.
        Returns count of memberships expired.
        """
        today = date.today()
        
        result = self.db.execute(
            select(Membership).where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date < today,
            )
        )
        memberships = result.scalars().all()
        
        for membership in memberships:
            membership.status = MembershipStatus.EXPIRED
        
        self.db.commit()
        
        return len(memberships)
