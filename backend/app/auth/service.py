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
    hash_refresh_token,
)
from app.models import Gym, User, RefreshToken
from app.models.mobile_push_token import MobilePushToken
from app.models.enums import UserRole, SubscriptionStatus
from app.auth.schemas import (
    LoginRequest,
    TokenResponse,
    TotpSetupResponse,
    UserCreate,
    GymRegister,
    GymRegisterResponse,
    UserResponse,
)
from app.auth.totp import generate_totp_secret, provisioning_uri, verify_totp_code


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

    def _store_refresh_token(self, user_id: uuid.UUID, refresh_token: str) -> None:
        """Store hashed refresh token in DB with expiry."""
        payload = decode_token(refresh_token)
        if not payload or "exp" not in payload:
            return
        from datetime import timezone
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        token_hash = hash_refresh_token(refresh_token)
        row = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
        )
        self.db.add(row)
        self.db.commit()
    
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
        
        If the same email exists across multiple gyms, we try each
        matching user until one passes the password check.
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            User if authentication successful, None otherwise
        """
        users = self.db.execute(
            select(User).where(
                User.email == email,
                User.is_active == True,  # noqa: E712
            )
        ).scalars().all()
        
        if not users:
            return None
        
        for user in users:
            if verify_password(password, user.password_hash):
                return user
        
        return None
    
    def login(self, request: LoginRequest) -> tuple[User, TokenResponse] | None:
        """
        Login user and return tokens. Stores refresh token in DB for revocation/replay protection.
        """
        user = self.authenticate_by_email_only(request.email, request.password)
        if not user:
            return None

        if user.totp_enabled:
            if not request.totp_code:
                raise ValueError("totp_required")
            if not user.totp_secret or not verify_totp_code(user.totp_secret, request.totp_code):
                return None

        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()

        tokens = self._create_tokens(user)
        try:
            self._store_refresh_token(user.id, tokens.refresh_token)
        except Exception as e:
            # Don't fail login if refresh_tokens table missing or DB error (e.g. migrations not run)
            import logging
            logging.getLogger(__name__).warning("Could not store refresh token: %s", e)
        return user, tokens
    
    def refresh_tokens(self, refresh_token: str) -> TokenResponse | None:
        """
        Refresh access token. Validates token via DB (hash match, not revoked, not expired),
        revokes old token, issues new pair and stores new refresh token.
        """
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        try:
            user_uuid = uuid.UUID(user_id_str)
        except ValueError:
            return None

        token_hash = hash_refresh_token(refresh_token)
        now = datetime.now(timezone.utc)
        row = self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_uuid,
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,  # noqa: E712
                RefreshToken.expires_at > now,
            )
        ).scalar_one_or_none()
        if not row:
            return None

        user = self.db.execute(
            select(User).where(
                User.id == user_uuid,
                User.is_active == True,  # noqa: E712
            )
        ).scalar_one_or_none()
        if not user:
            return None

        # Revoke old refresh token (rotation)
        row.revoked = True
        self.db.commit()

        tokens = self._create_tokens(user)
        try:
            self._store_refresh_token(user.id, tokens.refresh_token)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning("Could not store refresh token on refresh: %s", e)
        return tokens
    
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
    
    def get_users(
        self,
        gym_id: uuid.UUID,
        page: int = 1,
        page_size: int = 100,
    ) -> list[User]:
        """Get users for a gym with pagination."""
        result = self.db.execute(
            select(User)
            .where(User.gym_id == gym_id)
            .order_by(User.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
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

    def setup_totp(self, user: User) -> TotpSetupResponse:
        """Generate a new TOTP secret (does not enable until verified)."""
        secret = generate_totp_secret()
        user.totp_secret = secret
        user.totp_enabled = False
        self.db.commit()
        return TotpSetupResponse(
            secret=secret,
            provisioning_uri=provisioning_uri(secret, user.email),
        )

    def enable_totp(self, user: User, code: str) -> bool:
        if not user.totp_secret or not verify_totp_code(user.totp_secret, code):
            return False
        user.totp_enabled = True
        self.db.commit()
        return True

    def disable_totp(self, user: User, password: str, code: str) -> bool:
        if not verify_password(password, user.password_hash):
            return False
        if not user.totp_secret or not verify_totp_code(user.totp_secret, code):
            return False
        user.totp_secret = None
        user.totp_enabled = False
        self.db.commit()
        return True

    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """
        Revoke a refresh token (e.g. on logout). Marks the token as revoked in DB.
        Returns True if a matching token was found and revoked.
        """
        token_hash = hash_refresh_token(refresh_token)
        row = self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,  # noqa: E712
            )
        ).scalar_one_or_none()
        if not row:
            return False
        row.revoked = True
        self.db.commit()
        return True

    def deactivate_own_account(self, user: User, password: str) -> None:
        """
        Owner/staff self-service deletion (soft delete).
        Also deactivates gym when the owner account is deleted.
        """
        if not verify_password(password, user.password_hash):
            raise ValueError("Current password is incorrect")

        # Revoke all refresh tokens for this user to force immediate logout on all devices.
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked == False,  # noqa: E712
        ).update({"revoked": True}, synchronize_session=False)

        # Deactivate all push tokens so no notifications are sent to a deleted account.
        self.db.query(MobilePushToken).filter(
            MobilePushToken.user_id == user.id,
        ).update({"is_active": False}, synchronize_session=False)

        user.is_active = False
        user.totp_enabled = False
        user.totp_secret = None

        if user.role == UserRole.OWNER:
            gym = self.db.execute(
                select(Gym).where(Gym.id == user.gym_id)
            ).scalar_one_or_none()
            if gym:
                gym.is_active = False

        self.db.commit()
