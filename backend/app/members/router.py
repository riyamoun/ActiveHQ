"""
Member management API endpoints.
"""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import TenantDep, DbDep
from app.members.schemas import (
    MemberCreate,
    MemberUpdate,
    MemberResponse,
    MemberWithMembership,
    MemberListResponse,
)
from app.members.service import MemberService


router = APIRouter()


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    request: MemberCreate,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Create a new member.
    
    Members are gym customers who have memberships.
    They do not login to the system.
    """
    service = MemberService(db)
    
    # Check if phone already exists
    existing = service.get_member_by_phone(tenant.gym_id, request.phone)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A member with this phone number already exists",
        )
    
    member = service.create_member(tenant.gym_id, request)
    return MemberResponse.model_validate(member)


@router.get("", response_model=MemberListResponse)
def list_members(
    tenant: TenantDep,
    db: DbDep,
    query: str | None = Query(None, description="Search by name, phone, or member code"),
    status: str | None = Query(None, description="Filter: active, expired, or all"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List members with search and filtering.
    
    - **query**: Search by name, phone number, or member code
    - **status**: Filter by membership status (active, expired, or all)
    - Supports pagination
    """
    service = MemberService(db)
    return service.list_members(
        gym_id=tenant.gym_id,
        query=query,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.get("/expiring", response_model=list[MemberWithMembership])
def get_expiring_members(
    tenant: TenantDep,
    db: DbDep,
    days: int = Query(7, ge=1, le=90, description="Days until expiry"),
):
    """
    Get members whose membership is expiring soon.
    
    Useful for sending renewal reminders.
    """
    service = MemberService(db)
    return service.get_expiring_members(tenant.gym_id, days)


@router.get("/with-dues", response_model=list[MemberWithMembership])
def get_members_with_dues(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get members with pending payment dues.
    
    Useful for payment follow-ups.
    """
    service = MemberService(db)
    return service.get_members_with_dues(tenant.gym_id)


@router.get("/{member_id}", response_model=MemberWithMembership)
def get_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get a specific member with their current membership info.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    member = service.get_member_with_membership(tenant.gym_id, member_uuid)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: str,
    request: MemberUpdate,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Update member details.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    # Check phone uniqueness if changing
    if request.phone and request.phone != member.phone:
        existing = service.get_member_by_phone(tenant.gym_id, request.phone)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A member with this phone number already exists",
            )
    
    updated = service.update_member(member, request)
    return MemberResponse.model_validate(updated)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Deactivate a member (soft delete).
    
    Member data is preserved for historical records.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    service.deactivate_member(member)
    return None


@router.post("/{member_id}/reactivate", response_model=MemberResponse)
def reactivate_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Reactivate a previously deactivated member.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    
    # Get member including inactive ones
    from sqlalchemy import select
    from app.models import Member
    
    member = db.execute(
        select(Member).where(
            Member.gym_id == tenant.gym_id,
            Member.id == member_uuid,
        )
    ).scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    if member.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member is already active",
        )
    
    reactivated = service.reactivate_member(member)
    return MemberResponse.model_validate(reactivated)
