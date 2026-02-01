"""
Authentication dependencies for FastAPI.
Use these with Depends() to protect routes.
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import credentials_exception, permission_exception
from app.models import User, Gym
from app.models.enums import UserRole
from app.auth.schemas import CurrentUser


# HTTP Bearer token extractor
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    Dependency to get the current authenticated user from JWT.
    
    Usage:
        @app.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception
    
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception
    
    # Fetch user from database
    user = db.execute(
        select(User).where(
            User.id == user_uuid,
            User.is_active == True,  # noqa: E712
        )
    ).scalar_one_or_none()
    
    if not user:
        raise credentials_exception
    
    # Check gym is active
    gym = db.execute(
        select(Gym).where(
            Gym.id == user.gym_id,
            Gym.is_active == True,  # noqa: E712
        )
    ).scalar_one_or_none()
    
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Gym account is suspended or inactive",
        )
    
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Dependency that ensures user is active.
    (Redundant check since get_current_user already checks, but explicit.)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    Factory function to create a dependency that requires specific roles.
    
    Usage:
        @app.get("/admin-only")
        def admin_route(user: User = Depends(require_role(UserRole.OWNER, UserRole.MANAGER))):
            ...
    """
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise permission_exception
        return current_user
    
    return role_checker


# Pre-built role dependencies
require_owner = require_role(UserRole.OWNER)
require_manager_or_above = require_role(UserRole.OWNER, UserRole.MANAGER)
require_staff_or_above = require_role(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)


class TenantContext:
    """
    Context class that holds tenant information for multi-tenant queries.
    
    Usage:
        @app.get("/members")
        def get_members(
            tenant: TenantContext = Depends(get_tenant_context),
            db: Session = Depends(get_db),
        ):
            members = db.query(Member).filter(Member.gym_id == tenant.gym_id).all()
    """
    
    def __init__(self, user: User, gym: Gym):
        self.user = user
        self.gym = gym
        self.gym_id = gym.id
        self.user_id = user.id
        self.role = user.role


async def get_tenant_context(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TenantContext:
    """
    Dependency that provides tenant context for multi-tenant operations.
    
    This is the RECOMMENDED way to access gym_id in route handlers.
    It ensures proper tenant isolation.
    """
    gym = db.execute(
        select(Gym).where(Gym.id == current_user.gym_id)
    ).scalar_one_or_none()
    
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found",
        )
    
    return TenantContext(user=current_user, gym=gym)


# Type aliases for cleaner route signatures
CurrentUserDep = Annotated[User, Depends(get_current_user)]
TenantDep = Annotated[TenantContext, Depends(get_tenant_context)]
DbDep = Annotated[Session, Depends(get_db)]
