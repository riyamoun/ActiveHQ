"""
Authentication service - business logic for auth operations.
"""

import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models import Gym, User
from app.models.enums import UserRole, SubscriptionStatus
from app.auth.schemas import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    GymRegister,
    GymRegisterResponse,
    UserResponse,
)


class AuthService:
    """Service class for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _generate_slug(self, name: str) -> str:
        """Generate URL-friendly slug from name."""
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[-\s]+", "-", slug)
        return slug[:100]
    
    def _make_unique_slug(self, base_slug: str) -> str:
        """Ensure slug is unique by appending number if needed."""
        slug = base_slug
        counter = 1
        
        while True:
            existing = self.db.execute(
                select(Gym).where(Gym.slug == slug)
            ).scalar_one_or_none()
            
            if not existing:
                return slug
            
            slug = f"{base_slug}-{counter}"
            counter += 1
    
    def _create_tokens(self, user: User) -> TokenResponse:
        """Generate access and refresh tokens for user."""
        token_data = {
            "sub": str(user.id),
            "gym_id": str(user.gym_id),
            "email": user.email,
            "role": user.role.value,
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )
    
    def authenticate_user(
        self,
        gym_id: uuid.UUID,
        email: str,
        password: str,
    ) -> User | None:
        """
        Authenticate user with email and password.
        
        Args:
            gym_id: The gym ID for tenant scoping
            email: User email
            password: Plain text password
            
        Returns:
            User if authentication successful, None otherwise
        """
        user = self.db.execute(
            select(User).where(
                User.gym_id == gym_id,
                User.email == email,
                User.is_active == True,  # noqa: E712
            )
        ).scalar_one_or_none()
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    def authenticate_by_email_only(
        self,
        email: str,
        password: str,
    ) -> User | None:
        """
        Authenticate user by email only (no gym_id required).
        Used when user doesn't know their gym_id (e.g., login page).
        
        Note: This assumes email is globally unique. If a user works
        at multiple gyms, they should use gym-specific login.
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            User if authentication successful, None otherwise
        """
        user = self.db.execute(
            select(User).where(
                User.email == email,
                User.is_active == True,  # noqa: E712
            )
        ).scalar_one_or_none()
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    def login(self, request: LoginRequest) -> tuple[User, TokenResponse] | None:
        """
        Login user and return tokens.
        
        Args:
            request: Login request with email and password
            
        Returns:
            Tuple of (User, TokenResponse) if successful, None otherwise
        """
        user = self.authenticate_by_email_only(request.email, request.password)
        
        if not user:
            return None
        
        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()
        
        tokens = self._create_tokens(user)
        return user, tokens
    
    def refresh_tokens(self, refresh_token: str) -> TokenResponse | None:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New TokenResponse if valid, None otherwise
        """
        payload = decode_token(refresh_token)
        
        if not payload:
            return None
        
        if payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = self.db.execute(
            select(User).where(
                User.id == uuid.UUID(user_id),
                User.is_active == True,  # noqa: E712
            )
        ).scalar_one_or_none()
        
        if not user:
            return None
        
        return self._create_tokens(user)
    
    def register_gym(self, request: GymRegister) -> GymRegisterResponse:
        """
        Register a new gym with admin user.
        
        Args:
            request: Gym registration data
            
        Returns:
            GymRegisterResponse with gym, user, and tokens
            
        Raises:
            HTTPException: If gym email or user email already exists
        """
        # Generate unique slug
        base_slug = self._generate_slug(request.gym_name)
        unique_slug = self._make_unique_slug(base_slug)
        
        # Create gym
        gym = Gym(
            name=request.gym_name,
            slug=unique_slug,
            owner_name=request.owner_name,
            email=request.gym_email,
            phone=request.gym_phone,
            city=request.city,
            state=request.state,
            subscription_status=SubscriptionStatus.TRIAL,
            is_active=True,
        )
        self.db.add(gym)
        self.db.flush()  # Get gym.id
        
        # Create owner user
        user = User(
            gym_id=gym.id,
            email=request.owner_email,
            password_hash=hash_password(request.owner_password),
            name=request.owner_name,
            role=UserRole.OWNER,
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(gym)
        self.db.refresh(user)
        
        # Generate tokens
        tokens = self._create_tokens(user)
        
        return GymRegisterResponse(
            gym_id=gym.id,
            gym_name=gym.name,
            user=UserResponse.model_validate(user),
            tokens=tokens,
        )
    
    def create_user(
        self,
        gym_id: uuid.UUID,
        request: UserCreate,
        created_by: User | None = None,
    ) -> User:
        """
        Create a new user (staff) for a gym.
        
        Args:
            gym_id: Gym to create user for
            request: User creation data
            created_by: User who is creating this user (for audit)
            
        Returns:
            Created User
        """
        user = User(
            gym_id=gym_id,
            email=request.email,
            password_hash=hash_password(request.password),
            name=request.name,
            phone=request.phone,
            role=request.role,
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def get_user_by_id(self, gym_id: uuid.UUID, user_id: uuid.UUID) -> User | None:
        """Get user by ID within a gym."""
        return self.db.execute(
            select(User).where(
                User.gym_id == gym_id,
                User.id == user_id,
            )
        ).scalar_one_or_none()
    
    def get_users(self, gym_id: uuid.UUID) -> list[User]:
        """Get all users for a gym."""
        result = self.db.execute(
            select(User).where(User.gym_id == gym_id).order_by(User.name)
        )
        return list(result.scalars().all())
    
    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> bool:
        """
        Change user's password.
        
        Args:
            user: User to change password for
            current_password: Current password for verification
            new_password: New password to set
            
        Returns:
            True if successful, False if current password wrong
        """
        if not verify_password(current_password, user.password_hash):
            return False
        
        user.password_hash = hash_password(new_password)
        self.db.commit()
        
        return True
