"""
Membership management API endpoints.
"""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import TenantDep, DbDep
from app.models.enums import MembershipStatus
from app.memberships.schemas import (
    MembershipCreate,
    MembershipUpdate,
    MembershipRenew,
    MembershipResponse,
    MembershipListResponse,
)
from app.memberships.service import MembershipService


router = APIRouter()


@router.post("", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def create_membership(
    request: MembershipCreate,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Create a new membership for a member.
    
    Assigns a membership plan to a member with start/end dates.
    """
    service = MembershipService(db)
    
    try:
        membership = service.create_membership(
            gym_id=tenant.gym_id,
            data=request,
            created_by=tenant.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(membership)


@router.get("", response_model=MembershipListResponse)
def list_memberships(
    tenant: TenantDep,
    db: DbDep,
    status: MembershipStatus | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List memberships with filtering and pagination.
    """
    service = MembershipService(db)
    return service.list_memberships(
        gym_id=tenant.gym_id,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.get("/member/{member_id}", response_model=list[MembershipResponse])
def get_member_memberships(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get all memberships for a specific member.
    
    Returns membership history ordered by start date (newest first).
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MembershipService(db)
    memberships = service.get_member_memberships(tenant.gym_id, member_uuid)
    
    return [service._build_response(m) for m in memberships]


@router.get("/{membership_id}", response_model=MembershipResponse)
def get_membership(
    membership_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get a specific membership by ID.
    """
    try:
        membership_uuid = uuid.UUID(membership_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid membership ID format",
        )
    
    service = MembershipService(db)
    membership = service.get_membership(tenant.gym_id, membership_uuid)
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    
    return service._build_response(membership)


@router.put("/{membership_id}", response_model=MembershipResponse)
def update_membership(
    membership_id: str,
    request: MembershipUpdate,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Update membership details.
    """
    try:
        membership_uuid = uuid.UUID(membership_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid membership ID format",
        )
    
    service = MembershipService(db)
    membership = service.get_membership(tenant.gym_id, membership_uuid)
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    
    updated = service.update_membership(membership, request)
    return service._build_response(updated)


@router.post("/member/{member_id}/renew", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def renew_membership(
    member_id: str,
    request: MembershipRenew,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Renew a member's membership.
    
    Creates a new membership that starts after the current one ends.
    If no plan is specified, uses the same plan as the current membership.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MembershipService(db)
    
    try:
        membership = service.renew_membership(
            gym_id=tenant.gym_id,
            member_id=member_uuid,
            data=request,
            created_by=tenant.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(membership)


@router.post("/{membership_id}/pause", response_model=MembershipResponse)
def pause_membership(
    membership_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Pause an active membership.
    
    Common in Indian gyms for temporary holds.
    """
    try:
        membership_uuid = uuid.UUID(membership_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid membership ID format",
        )
    
    service = MembershipService(db)
    membership = service.get_membership(tenant.gym_id, membership_uuid)
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    
    try:
        paused = service.pause_membership(membership)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(paused)


@router.post("/{membership_id}/resume", response_model=MembershipResponse)
def resume_membership(
    membership_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Resume a paused membership.
    """
    try:
        membership_uuid = uuid.UUID(membership_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid membership ID format",
        )
    
    service = MembershipService(db)
    membership = service.get_membership(tenant.gym_id, membership_uuid)
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    
    try:
        resumed = service.resume_membership(membership)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return service._build_response(resumed)


@router.post("/{membership_id}/cancel", response_model=MembershipResponse)
def cancel_membership(
    membership_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Cancel a membership.
    """
    try:
        membership_uuid = uuid.UUID(membership_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid membership ID format",
        )
    
    service = MembershipService(db)
    membership = service.get_membership(tenant.gym_id, membership_uuid)
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    
    cancelled = service.cancel_membership(membership)
    return service._build_response(cancelled)
