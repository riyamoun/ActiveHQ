"""
Plan management API endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import require_owner, require_manager_or_above, TenantDep, DbDep
from app.models import User
from app.plans.schemas import (
    PlanCreate,
    PlanUpdate,
    PlanResponse,
    PlanSummary,
)
from app.plans.service import PlanService


router = APIRouter()


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    request: PlanCreate,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Create a new membership plan.
    
    Requires: Owner role
    """
    service = PlanService(db)
    plan = service.create_plan(tenant.gym_id, request)
    return PlanResponse.model_validate(plan)


@router.get("", response_model=list[PlanResponse])
def list_plans(
    tenant: TenantDep,
    db: DbDep,
    include_inactive: bool = Query(False, description="Include inactive plans"),
):
    """
    List all membership plans.
    
    By default, only active plans are returned.
    """
    service = PlanService(db)
    plans = service.list_plans(tenant.gym_id, active_only=not include_inactive)
    return [PlanResponse.model_validate(p) for p in plans]


@router.get("/active", response_model=list[PlanSummary])
def list_active_plans(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get active plans for dropdowns/selection.
    
    Returns minimal plan info.
    """
    service = PlanService(db)
    plans = service.list_plans(tenant.gym_id, active_only=True)
    return [PlanSummary.model_validate(p) for p in plans]


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get a specific plan by ID.
    """
    try:
        plan_uuid = uuid.UUID(plan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan ID format",
        )
    
    service = PlanService(db)
    plan = service.get_plan(tenant.gym_id, plan_uuid)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found",
        )
    
    return PlanResponse.model_validate(plan)


@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: str,
    request: PlanUpdate,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Update plan details.
    
    Requires: Owner role
    
    Note: Changing plan details does not affect existing memberships.
    """
    try:
        plan_uuid = uuid.UUID(plan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan ID format",
        )
    
    service = PlanService(db)
    plan = service.get_plan(tenant.gym_id, plan_uuid)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found",
        )
    
    updated = service.update_plan(plan, request)
    return PlanResponse.model_validate(updated)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: str,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Deactivate a plan (soft delete).
    
    Requires: Owner role
    
    The plan will no longer be available for new memberships,
    but existing memberships are not affected.
    """
    try:
        plan_uuid = uuid.UUID(plan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan ID format",
        )
    
    service = PlanService(db)
    plan = service.get_plan(tenant.gym_id, plan_uuid)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found",
        )
    
    service.deactivate_plan(plan)
    return None
