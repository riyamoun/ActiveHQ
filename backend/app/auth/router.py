"""
Authentication API endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.auth.schemas import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserCreate,
    UserUpdate,
    PasswordChange,
    UserResponse,
    GymRegister,
    GymRegisterResponse,
    TotpSetupResponse,
    TotpEnableRequest,
    TotpDisableRequest,
)
from app.auth.service import AuthService
from app.auth.dependencies import (
    get_current_user,
    require_owner,
    require_manager_or_above,
    CurrentUserDep,
    TenantDep,
    DbDep,
)
from app.models import User
from app.models.enums import UserRole


router = APIRouter()


@router.post(
    "/register",
    response_model=GymRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")  # Rate limit: 5 registrations per minute
def register_gym(
    request: Request,
    body: GymRegister,
    db: DbDep,
):
    """
    Register a new gym with admin account.
    
    This is the onboarding endpoint for new gyms.
    Creates:
    - New gym (tenant)
    - Admin user account
    - Returns auth tokens
    
    Rate limited: 5 registrations per minute per IP
    """
    service = AuthService(db)
    
    # Check if gym email already exists
    from sqlalchemy import select
    from app.models import Gym
    
    existing_gym = db.execute(
        select(Gym).where(Gym.email == body.gym_email)
    ).scalar_one_or_none()
    
    if existing_gym:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A gym with this email already exists",
        )
    
    # Check if user email already exists
    existing_user = db.execute(
        select(User).where(User.email == body.owner_email)
    ).scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    
    return service.register_gym(body)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    body: LoginRequest,
    db: DbDep,
):
    """
    Login with email and password.

    Returns access and refresh tokens on success.
    Rate limited per client IP. SlowAPI requires the first param to be named `request`.
    """
    service = AuthService(db)
    try:
        result = service.login(body)
    except ValueError as exc:
        if str(exc) == "totp_required":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="totp_required",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
        raise

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, password, or authenticator code",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user, tokens = result
    return tokens


@router.post("/totp/setup", response_model=TotpSetupResponse)
def setup_totp(
    current_user: CurrentUserDep,
    db: DbDep,
):
    """Start 2FA enrollment — scan provisioning_uri in an authenticator app."""
    service = AuthService(db)
    user = service.get_user_by_id(current_user.gym_id, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return service.setup_totp(user)


@router.post("/totp/enable", status_code=status.HTTP_204_NO_CONTENT)
def enable_totp(
    body: TotpEnableRequest,
    current_user: CurrentUserDep,
    db: DbDep,
):
    service = AuthService(db)
    user = service.get_user_by_id(current_user.gym_id, current_user.id)
    if not user or not service.enable_totp(user, body.code):
        raise HTTPException(status_code=400, detail="Invalid authenticator code")
    return None


@router.post("/totp/disable", status_code=status.HTTP_204_NO_CONTENT)
def disable_totp(
    body: TotpDisableRequest,
    current_user: CurrentUserDep,
    db: DbDep,
):
    service = AuthService(db)
    user = service.get_user_by_id(current_user.gym_id, current_user.id)
    if not user or not service.disable_totp(user, body.password, body.code):
        raise HTTPException(status_code=400, detail="Invalid password or authenticator code")
    return None


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: RefreshTokenRequest,
    db: DbDep,
):
    """
    Refresh access token using refresh token.
    DB-backed: old token is revoked, new pair issued and stored.
    """
    service = AuthService(db)
    tokens = service.refresh_tokens(request.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return tokens


@router.post("/logout")
def logout(
    request: RefreshTokenRequest,
    db: DbDep,
):
    """
    Revoke the given refresh token (e.g. on logout).
    Client should send the current refresh_token; it will be invalidated.
    """
    service = AuthService(db)
    service.revoke_refresh_token(request.refresh_token)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: CurrentUserDep,
):
    """
    Get current authenticated user's information.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me/password")
def change_password(
    request: PasswordChange,
    current_user: CurrentUserDep,
    db: DbDep,
):
    """
    Change current user's password.
    """
    service = AuthService(db)
    success = service.change_password(
        current_user,
        request.current_password,
        request.new_password,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    return {"message": "Password changed successfully"}


# Staff management endpoints (Owner/Manager only)

@router.get("/users", response_model=list[UserResponse])
def list_users(
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_manager_or_above),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List users (staff) for the current gym with pagination.
    Requires: Owner or Manager role
    """
    service = AuthService(db)
    users = service.get_users(tenant.gym_id, page=page, page_size=page_size)
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreate,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Create a new user (staff) for the current gym.
    
    Requires: Owner role
    """
    service = AuthService(db)
    
    # Check if email already exists in this gym
    existing = db.execute(
        select(User).where(
            User.gym_id == tenant.gym_id,
            User.email == request.email,
        )
    ).scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in this gym",
        )
    
    # Only platform can create super_admin; gym owners cannot
    if request.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create super_admin from gym context",
        )
    # Owners cannot create other owners
    if request.role == UserRole.OWNER and current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create owner accounts",
        )
    
    user = service.create_user(tenant.gym_id, request, current_user)
    return UserResponse.model_validate(user)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_manager_or_above),
):
    """
    Get a specific user by ID.
    
    Requires: Owner or Manager role
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    
    service = AuthService(db)
    user = service.get_user_by_id(tenant.gym_id, user_uuid)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    request: UserUpdate,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Update a user's details.
    
    Requires: Owner role
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    
    service = AuthService(db)
    user = service.get_user_by_id(tenant.gym_id, user_uuid)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent demoting yourself
    if user.id == current_user.id and request.role and request.role != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    
    # Prevent deactivating yourself
    if user.id == current_user.id and request.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    
    # Update fields
    if request.name is not None:
        user.name = request.name
    if request.phone is not None:
        user.phone = request.phone
    if request.role is not None:
        user.role = request.role
    if request.is_active is not None:
        user.is_active = request.is_active
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: str,
    tenant: TenantDep,
    db: DbDep,
    current_user: User = Depends(require_owner),
):
    """
    Deactivate a user (soft delete).
    
    Requires: Owner role
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    
    service = AuthService(db)
    user = service.get_user_by_id(tenant.gym_id, user_uuid)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    
    user.is_active = False
    db.commit()
    
    return None
