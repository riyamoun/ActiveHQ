"""
Admin routes for platform management (super_admin only).
All endpoints require SuperAdminDep authorization.
"""

import uuid
from fastapi import APIRouter, Query, HTTPException, status
from app.auth.dependencies import SuperAdminDep, DbDep
from app.admin.service import AdminService
from app.core.logger import log_info

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# ============= DASHBOARD & STATS =============

@router.get("/stats")
def get_platform_stats(_: SuperAdminDep, db: DbDep):
    """
    Get platform-wide metrics.
    Super admin only.
    
    Returns:
        - Total/active gyms and members
        - User breakdown by role
        - Revenue this month
    """
    service = AdminService(db)
    return service.get_platform_stats()

# ============= GYMS MANAGEMENT =============

@router.get("/gyms")
def list_gyms(
    _: SuperAdminDep,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List all gyms in the platform.
    Includes subscription status, member count, revenue.
    """
    service = AdminService(db)
    return service.list_all_gyms(page, page_size)

@router.get("/gyms/{gym_id}")
def get_gym_detail(_: SuperAdminDep, gym_id: uuid.UUID, db: DbDep):
    """
    Get detailed information about a specific gym.
    Includes users, members, and revenue.
    """
    service = AdminService(db)
    try:
        return service.get_gym_detail(gym_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

@router.patch("/gyms/{gym_id}/toggle")
def toggle_gym_status(
    admin: SuperAdminDep,
    gym_id: uuid.UUID,
    is_active: bool,
    db: DbDep,
):
    """
    Enable or disable a gym.
    When disabled, all users in that gym cannot access the system.
    """
    service = AdminService(db)
    try:
        result = service.toggle_gym_status(gym_id, is_active)
        log_info(
            f"Gym toggled by admin {admin.email}",
            gym_id=gym_id,
            admin_id=str(admin.id),
            is_active=is_active,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

# ============= USERS MANAGEMENT =============

@router.get("/users")
def list_users(
    _: SuperAdminDep,
    db: DbDep,
    role: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List all users across all gyms.
    Filter by role: owner, manager, staff, super_admin
    """
    service = AdminService(db)
    return service.list_all_users(role, page, page_size)

@router.patch("/users/{user_id}/toggle")
def toggle_user_status(
    admin: SuperAdminDep,
    user_id: uuid.UUID,
    is_active: bool,
    db: DbDep,
):
    """
    Enable or disable a user.
    When disabled, the user cannot log in.
    """
    service = AdminService(db)
    try:
        result = service.toggle_user_status(user_id, is_active)
        log_info(
            f"User toggled by admin {admin.email}",
            user_id=str(user_id),
            admin_id=str(admin.id),
            is_active=is_active,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

# ============= SUPPORT & SALES =============

@router.get("/demo-requests")
def list_demo_requests(
    _: SuperAdminDep,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List all demo/sales requests.
    Useful for sales team and customer acquisition.
    """
    service = AdminService(db)
    return service.list_demo_requests(page, page_size)
