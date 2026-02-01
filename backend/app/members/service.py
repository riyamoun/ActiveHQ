"""
Member management service.
"""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session

from app.models import Member, Membership, Plan
from app.models.enums import MembershipStatus
from app.members.schemas import (
    MemberCreate,
    MemberUpdate,
    MemberSummary,
    MemberWithMembership,
    MemberListResponse,
)


class MemberService:
    """Service class for member operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_member(
        self,
        gym_id: uuid.UUID,
        data: MemberCreate,
    ) -> Member:
        """Create a new member."""
        member = Member(
            gym_id=gym_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            alternate_phone=data.alternate_phone,
            gender=data.gender,
            date_of_birth=data.date_of_birth,
            address=data.address,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
            photo_url=data.photo_url,
            joined_date=data.joined_date or date.today(),
            notes=data.notes,
            member_code=data.member_code,
            is_active=True,
        )
        
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        
        return member
    
    def get_member(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
    ) -> Member | None:
        """Get member by ID."""
        return self.db.execute(
            select(Member).where(
                Member.gym_id == gym_id,
                Member.id == member_id,
            )
        ).scalar_one_or_none()
    
    def get_member_by_phone(
        self,
        gym_id: uuid.UUID,
        phone: str,
    ) -> Member | None:
        """Get member by phone number."""
        return self.db.execute(
            select(Member).where(
                Member.gym_id == gym_id,
                Member.phone == phone,
            )
        ).scalar_one_or_none()
    
    def update_member(
        self,
        member: Member,
        data: MemberUpdate,
    ) -> Member:
        """Update member details."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(member, field, value)
        
        self.db.commit()
        self.db.refresh(member)
        
        return member
    
    def deactivate_member(self, member: Member) -> Member:
        """Soft delete a member."""
        member.is_active = False
        self.db.commit()
        self.db.refresh(member)
        return member
    
    def reactivate_member(self, member: Member) -> Member:
        """Reactivate a deleted member."""
        member.is_active = True
        self.db.commit()
        self.db.refresh(member)
        return member
    
    def list_members(
        self,
        gym_id: uuid.UUID,
        query: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> MemberListResponse:
        """
        List members with search and pagination.
        
        Args:
            gym_id: Gym ID for tenant scoping
            query: Search term (name or phone)
            status: Filter by membership status (active, expired, all)
            page: Page number (1-indexed)
            page_size: Number of items per page
        """
        # Base query
        base_query = select(Member).where(
            Member.gym_id == gym_id,
            Member.is_active == True,  # noqa: E712
        )
        
        # Search filter
        if query:
            search_filter = or_(
                Member.name.ilike(f"%{query}%"),
                Member.phone.ilike(f"%{query}%"),
                Member.member_code.ilike(f"%{query}%"),
            )
            base_query = base_query.where(search_filter)
        
        # Status filter (requires join with memberships)
        today = date.today()
        
        if status == "active":
            # Members with active, non-expired membership
            subquery = (
                select(Membership.member_id)
                .where(
                    Membership.gym_id == gym_id,
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
                .distinct()
            )
            base_query = base_query.where(Member.id.in_(subquery))
        elif status == "expired":
            # Members with no active membership
            active_subquery = (
                select(Membership.member_id)
                .where(
                    Membership.gym_id == gym_id,
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
                .distinct()
            )
            base_query = base_query.where(Member.id.notin_(active_subquery))
        
        # Count total
        count_query = select(func.count()).select_from(base_query.subquery())
        total = self.db.execute(count_query).scalar() or 0
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Fetch items
        items_query = base_query.order_by(Member.name).offset(offset).limit(page_size)
        result = self.db.execute(items_query)
        members = result.scalars().all()
        
        return MemberListResponse(
            items=[MemberSummary.model_validate(m) for m in members],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    
    def get_member_with_membership(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
    ) -> MemberWithMembership | None:
        """Get member with current membership info."""
        member = self.get_member(gym_id, member_id)
        
        if not member:
            return None
        
        # Get current/latest membership
        today = date.today()
        current_membership = self.db.execute(
            select(Membership)
            .where(
                Membership.gym_id == gym_id,
                Membership.member_id == member_id,
            )
            .order_by(Membership.end_date.desc())
            .limit(1)
        ).scalar_one_or_none()
        
        # Build response
        response_data = {
            **member.__dict__,
            "current_membership_status": None,
            "current_membership_end": None,
            "current_plan_name": None,
            "amount_due": None,
        }
        
        if current_membership:
            # Determine actual status based on date
            if current_membership.status == MembershipStatus.ACTIVE and current_membership.end_date < today:
                response_data["current_membership_status"] = MembershipStatus.EXPIRED
            else:
                response_data["current_membership_status"] = current_membership.status
            
            response_data["current_membership_end"] = current_membership.end_date
            response_data["amount_due"] = float(current_membership.amount_total - current_membership.amount_paid)
            
            # Get plan name
            plan = self.db.execute(
                select(Plan).where(Plan.id == current_membership.plan_id)
            ).scalar_one_or_none()
            
            if plan:
                response_data["current_plan_name"] = plan.name
        
        return MemberWithMembership(**response_data)
    
    def get_expiring_members(
        self,
        gym_id: uuid.UUID,
        days: int = 7,
    ) -> list[MemberWithMembership]:
        """
        Get members whose membership is expiring within given days.
        
        Used for sending reminder notifications.
        """
        today = date.today()
        end_date = date.today()
        
        # Import timedelta here to avoid circular imports
        from datetime import timedelta
        end_date = today + timedelta(days=days)
        
        # Find active memberships expiring soon
        expiring_memberships = self.db.execute(
            select(Membership)
            .where(
                Membership.gym_id == gym_id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= end_date,
            )
            .order_by(Membership.end_date)
        ).scalars().all()
        
        results = []
        for membership in expiring_memberships:
            member_data = self.get_member_with_membership(gym_id, membership.member_id)
            if member_data:
                results.append(member_data)
        
        return results
    
    def get_members_with_dues(
        self,
        gym_id: uuid.UUID,
    ) -> list[MemberWithMembership]:
        """Get members with pending payment dues."""
        # Find memberships with amount due
        memberships_with_dues = self.db.execute(
            select(Membership)
            .where(
                Membership.gym_id == gym_id,
                Membership.amount_total > Membership.amount_paid,
            )
            .order_by(Membership.created_at.desc())
        ).scalars().all()
        
        # Get unique members
        seen_members = set()
        results = []
        
        for membership in memberships_with_dues:
            if membership.member_id not in seen_members:
                seen_members.add(membership.member_id)
                member_data = self.get_member_with_membership(gym_id, membership.member_id)
                if member_data:
                    results.append(member_data)
        
        return results
