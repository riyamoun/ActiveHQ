"""
Authentication endpoints for the member portal.

Mounted at /api/m/auth.

All endpoints are deliberately enumeration-safe: requests for unknown
phones / emails return success the same way as known ones, and only
the OTP/magic-link verify step reveals whether a member exists.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limit import limiter
from app.member_portal import service as member_service
from app.member_portal.schemas import (
    AuthChallengeResponse,
    GoogleAuthRequest,
    MagicLinkRequest,
    MagicLinkVerify,
    MemberGymOption,
    MemberMe,
    MemberTokenResponse,
    OtpRequest,
    OtpVerify,
    SelectMemberRequest,
)


logger = logging.getLogger(__name__)
router = APIRouter()


def _portal_base_url(request: Request) -> str:
    """Resolve the base URL the magic-link should point back to."""
    if settings.member_portal_url:
        return settings.member_portal_url
    # Derive from request as a best-effort fallback (works in dev).
    return str(request.base_url).rstrip("/")


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _token_response_for(member) -> MemberTokenResponse:
    token, ttl = member_service.create_member_access_token(member)
    return MemberTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=ttl,
        member=MemberMe(
            id=member.id,
            gym_id=member.gym_id,
            gym_name=member.gym.name if member.gym else "",
            name=member.name,
            email=member.email,
            phone=member.phone,
            photo_url=member.photo_url,
            joined_date=member.joined_date,
        ),
    )


# ─────────────────────────────────────────────────────────────────────
# OTP
# ─────────────────────────────────────────────────────────────────────

@router.post("/otp/request", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
def otp_request(
    request: Request,
    body: OtpRequest,
    db: Annotated[Session, Depends(get_db)],
):
    result = member_service.issue_login_otp(
        db, phone=body.phone, ip=_client_ip(request)
    )
    return result


@router.post("/otp/verify", response_model=AuthChallengeResponse)
@limiter.limit("10/minute")
def otp_verify(
    request: Request,
    body: OtpVerify,
    db: Annotated[Session, Depends(get_db)],
):
    members, ok = member_service.verify_login_otp(db, phone=body.phone, code=body.code)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code",
        )
    if not members:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active membership found for this phone. Ask your gym to add you.",
        )

    member, choices = member_service.finalize_login(db, members)
    if member:
        return AuthChallengeResponse(token=_token_response_for(member))
    return AuthChallengeResponse(
        choices=[MemberGymOption(**c) for c in (choices or [])]
    )


# ─────────────────────────────────────────────────────────────────────
# Magic link
# ─────────────────────────────────────────────────────────────────────

@router.post("/magic-link/request", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
def magic_link_request(
    request: Request,
    body: MagicLinkRequest,
    db: Annotated[Session, Depends(get_db)],
):
    result = member_service.issue_magic_link(
        db,
        email=body.email,
        portal_base_url=_portal_base_url(request),
        ip=_client_ip(request),
    )
    return result


@router.post("/magic-link/verify", response_model=AuthChallengeResponse)
@limiter.limit("20/minute")
def magic_link_verify(
    request: Request,
    body: MagicLinkVerify,
    db: Annotated[Session, Depends(get_db)],
):
    members = member_service.verify_magic_link(db, token=body.token)
    if not members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This sign-in link is invalid or has expired. Request a new one.",
        )
    member, choices = member_service.finalize_login(db, members)
    if member:
        return AuthChallengeResponse(token=_token_response_for(member))
    return AuthChallengeResponse(
        choices=[MemberGymOption(**c) for c in (choices or [])]
    )


# ─────────────────────────────────────────────────────────────────────
# Google
# ─────────────────────────────────────────────────────────────────────

@router.post("/google", response_model=AuthChallengeResponse)
@limiter.limit("20/minute")
def google_login(
    request: Request,
    body: GoogleAuthRequest,
    db: Annotated[Session, Depends(get_db)],
):
    payload = member_service.verify_google_id_token(body.id_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google sign-in could not be verified. Please try again.",
        )
    members = member_service.resolve_google_members(db, google_payload=payload)
    if not members:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No active membership is linked to this Google account. "
                "Ask your gym to add your email."
            ),
        )
    member, choices = member_service.finalize_login(db, members)
    if member:
        return AuthChallengeResponse(token=_token_response_for(member))
    return AuthChallengeResponse(
        choices=[MemberGymOption(**c) for c in (choices or [])]
    )


# ─────────────────────────────────────────────────────────────────────
# Selection (multi-gym disambiguation)
# ─────────────────────────────────────────────────────────────────────

@router.post("/select-member", response_model=MemberTokenResponse)
@limiter.limit("30/minute")
def select_member(
    request: Request,
    body: SelectMemberRequest,
    db: Annotated[Session, Depends(get_db)],
):
    member = member_service.complete_selection(
        db, selection_token=body.selection_token, member_id=body.member_id
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selection has expired. Please sign in again.",
        )
    return _token_response_for(member)
