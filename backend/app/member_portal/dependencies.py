"""FastAPI dependency to resolve the current logged-in member from JWT."""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.member_portal.service import decode_member_access_token
from app.models import Member


member_bearer = HTTPBearer(auto_error=False)


def get_current_member(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(member_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> Member:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_member_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        member_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token",
        )

    member = db.execute(
        select(Member)
        .options(joinedload(Member.gym))
        .where(Member.id == member_id, Member.is_active.is_(True))
    ).scalar_one_or_none()

    if member is None or member.gym is None or not member.gym.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member account is no longer active",
        )
    return member


CurrentMemberDep = Annotated[Member, Depends(get_current_member)]
