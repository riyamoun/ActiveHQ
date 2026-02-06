"""
Authentication API endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
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


@router.post("/register", response_model=GymRegisterResponse)
def register_gym(
    request: GymRegister,
    db: DbDep,
):
    """
    Register a new gym with admin account.
    
    This is the onboarding endpoint for new gyms.
    Creates:
    - New gym (tenant)
    - Admin user account
    - Returns auth tokens
    """
    service = AuthService(db)
    
    # Check if gym email already exists
    from sqlalchemy import select
    from app.models import Gym
    
    existing_gym = db.execute(
        select(Gym).where(Gym.email == request.gym_email)
    ).scalar_one_or_none()
    
    if existing_gym:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A gym with this email already exists",
        )
    
    # Check if user email already exists
    existing_user = db.execute(
        select(User).where(User.email == request.owner_email)
    ).scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    
    return service.register_gym(request)


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: DbDep,
):
    """
    Login with email and password.
    
    Returns access and refresh tokens on success.
    """
    service = AuthService(db)
    result = service.login(request)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user, tokens = result
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: RefreshTokenRequest,
    db: DbDep,
):
    """
    Refresh access token using refresh token.
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
):
    """
    List all users (staff) for the current gym.
    
    Requires: Owner or Manager role
    """
    service = AuthService(db)
    users = service.get_users(tenant.gym_id)
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
