"""
Gym management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import (
    require_owner,
    TenantDep,
    DbDep,
)
from app.models import User
from app.gyms.schemas import (
    GymUpdate,
    GymSettingsUpdate,
    GymResponse,
)
from app.gyms.service import GymService


router = APIRouter()


@router.get("/current", response_model=GymResponse)
def get_current_gym(
    tenant: TenantDep,
):
    """
    Get current gym details.
    
    Returns the gym that the authenticated user belongs to.
    """
    return GymResponse.model_validate(tenant.gym)


@router.put("/current", response_model=GymResponse)
def update_current_gym(
    request: GymUpdate,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Update current gym details.
    
    Requires: Owner role
    """
    service = GymService(db)
    gym = service.update_gym(tenant.gym, request)
    return GymResponse.model_validate(gym)


@router.put("/current/settings", response_model=GymResponse)
def update_gym_settings(
    request: GymSettingsUpdate,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Update gym settings.
    
    Settings is a flexible JSON object for storing:
    - Operating hours
    - Default currency
    - Notification preferences
    - UI customizations
    - etc.
    
    Requires: Owner role
    """
    service = GymService(db)
    gym = service.update_settings(tenant.gym, request)
    return GymResponse.model_validate(gym)
