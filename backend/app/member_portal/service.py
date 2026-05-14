"""
Service layer for the member portal.

Auth flow design:
  * OTP / magic-link / Google all map an *identity* (phone, email or
    google_sub) → list of Member rows that share that identity.
  * If exactly one match → mint the access token directly.
  * If multiple → return a list of {member_id, gym_name, selection_token}
    and ask the caller to POST /select-member. The selection token is a
    short-lived JWT that simply binds the original challenge to a set
    of allowed member ids.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models import (
    Gym,
    Member,
    MemberLoginOtp,
    MemberMagicLink,
)
from app.services.email_service import get_email_service
from app.services.messaging import (
    normalize_phone_pickyassist,
    send_whatsapp_then_sms,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────

MEMBER_SCOPE = "member"
SELECTION_SCOPE = "member_selection"


# ─────────────────────────────────────────────────────────────────────
# Hashing helpers
# ─────────────────────────────────────────────────────────────────────

def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────────────────
# JWT issuance
# ─────────────────────────────────────────────────────────────────────

def create_member_access_token(member: Member) -> tuple[str, int]:
    """Mint a member-scoped JWT. Returns (token, expires_in_seconds)."""
    ttl_minutes = settings.member_access_token_expire_minutes
    exp = _now() + timedelta(minutes=ttl_minutes)
    payload = {
        "sub": str(member.id),
        "gym_id": str(member.gym_id),
        "scope": MEMBER_SCOPE,
        "type": "access",
        "exp": exp,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, ttl_minutes * 60


def create_selection_token(allowed_member_ids: list[uuid.UUID]) -> str:
    """Short-lived JWT bound to a set of member ids the user may pick from."""
    payload = {
        "scope": SELECTION_SCOPE,
        "ids": [str(mid) for mid in allowed_member_ids],
        "exp": _now() + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_selection_token(token: str) -> list[uuid.UUID] | None:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        return None
    if payload.get("scope") != SELECTION_SCOPE:
        return None
    raw_ids = payload.get("ids") or []
    try:
        return [uuid.UUID(s) for s in raw_ids]
    except (ValueError, TypeError):
        return None


def decode_member_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        return None
    if payload.get("scope") != MEMBER_SCOPE:
        return None
    if payload.get("type") != "access":
        return None
    return payload


# ─────────────────────────────────────────────────────────────────────
# Member lookup helpers (multi-gym aware)
# ─────────────────────────────────────────────────────────────────────

def _load_member_with_gym(db: Session, member_id: uuid.UUID) -> Member | None:
    return db.execute(
        select(Member)
        .options(joinedload(Member.gym))
        .where(Member.id == member_id, Member.is_active.is_(True))
    ).scalar_one_or_none()


def find_members_by_phone(db: Session, phone_e164_no_plus: str) -> list[Member]:
    """Look up active members across all gyms by normalised phone."""
    # We store phones in raw form (whatever staff entered). Try a few variants.
    candidates = _phone_variants(phone_e164_no_plus)
    stmt = (
        select(Member)
        .options(joinedload(Member.gym))
        .where(Member.is_active.is_(True))
        .where(Member.phone.in_(candidates))
    )
    members = list(db.execute(stmt).scalars().all())
    # Skip suspended / deleted gyms
    return [m for m in members if m.gym and m.gym.is_active]


def find_members_by_email(db: Session, email: str) -> list[Member]:
    email_norm = email.strip().lower()
    stmt = (
        select(Member)
        .options(joinedload(Member.gym))
        .where(Member.is_active.is_(True))
        .where(Member.email.isnot(None))
    )
    rows = list(db.execute(stmt).scalars().all())
    return [m for m in rows if (m.email or "").strip().lower() == email_norm and m.gym and m.gym.is_active]


def _phone_variants(phone: str) -> list[str]:
    """
    Generate the variants we may have stored in `members.phone`.
    Phones are entered by hand so we keep this forgiving.
    """
    digits = "".join(ch for ch in phone if ch.isdigit())
    out = {phone, digits}
    if len(digits) >= 10:
        out.add(digits[-10:])           # local 10-digit
        out.add("+91" + digits[-10:])   # +91 prefix
        out.add("91" + digits[-10:])    # no +
        out.add("0" + digits[-10:])     # leading 0
    return list(out)


# ─────────────────────────────────────────────────────────────────────
# OTP flow
# ─────────────────────────────────────────────────────────────────────

def _generate_numeric_code(length: int) -> str:
    upper = 10 ** length
    n = secrets.randbelow(upper)
    return str(n).zfill(length)


def issue_login_otp(db: Session, *, phone: str, ip: str | None = None) -> dict[str, Any]:
    """
    Generate + send an OTP to `phone`. Returns a development-only payload
    so we can show the code in non-production envs (handy during demos
    before SMS templates are approved).

    Idempotent-ish: we always create a fresh OTP row; old ones expire on
    their own. We do not leak whether the phone matches a known member.
    """
    phone_norm = normalize_phone_pickyassist(phone)
    if not phone_norm:
        # Still record nothing — but pretend success so we don't leak.
        return {"sent": True, "delivered": False}

    code = _generate_numeric_code(settings.member_otp_length)
    code_hash = _hash(code)
    expires_at = _now() + timedelta(seconds=settings.member_otp_expire_seconds)

    row = MemberLoginOtp(
        phone=phone_norm,
        code_hash=code_hash,
        expires_at=expires_at,
        ip_address=ip,
    )
    db.add(row)
    db.commit()

    body = (
        f"Your ActiveHQ code is {code}. "
        f"Valid for {settings.member_otp_expire_seconds // 60} minutes. "
        f"Don't share it with anyone."
    )

    delivered = False
    try:
        result = send_whatsapp_then_sms(phone, body)
        delivered = result.success
        if not result.success:
            logger.warning(
                "member_otp_send_failed phone=%s channel=%s error=%s",
                phone_norm, result.channel, result.error,
            )
    except Exception as e:  # pragma: no cover — provider hiccup
        logger.warning("member_otp_send_exception phone=%s error=%s", phone_norm, e)

    out: dict[str, Any] = {"sent": True, "delivered": delivered}
    # Reveal code in non-prod so the demo doesn't depend on the SMS round-trip.
    if settings.environment != "production":
        out["debug_code"] = code
    return out


def verify_login_otp(
    db: Session, *, phone: str, code: str
) -> tuple[list[Member], bool]:
    """
    Verify an OTP and return (matched_members, success).

    On verify-success we mark the row consumed even when there are zero
    matched members — so phones that *don't* belong to any gym still
    burn the code, preventing brute force.
    """
    phone_norm = normalize_phone_pickyassist(phone)
    if not phone_norm:
        return [], False
    code_hash = _hash(code.strip())

    stmt = (
        select(MemberLoginOtp)
        .where(MemberLoginOtp.phone == phone_norm)
        .where(MemberLoginOtp.consumed_at.is_(None))
        .where(MemberLoginOtp.expires_at > _now())
        .where(MemberLoginOtp.attempts < settings.member_otp_max_attempts)
        .order_by(MemberLoginOtp.created_at.desc())
    )
    rows = list(db.execute(stmt).scalars().all())
    if not rows:
        return [], False

    matched_row: MemberLoginOtp | None = None
    for row in rows:
        row.attempts = (row.attempts or 0) + 1
        if row.code_hash == code_hash:
            matched_row = row
            break
    db.commit()
    if matched_row is None:
        return [], False

    matched_row.consumed_at = _now()
    db.commit()

    members = find_members_by_phone(db, phone_norm)
    return members, True


# ─────────────────────────────────────────────────────────────────────
# Magic-link flow
# ─────────────────────────────────────────────────────────────────────

def issue_magic_link(
    db: Session,
    *,
    email: str,
    portal_base_url: str,
    ip: str | None = None,
) -> dict[str, Any]:
    """
    Generate a magic-link token and email it. We always pretend success
    so attackers can't enumerate emails. If SMTP isn't configured the
    request still returns success; logs make it visible to operators.
    """
    email_norm = email.strip().lower()
    if "@" not in email_norm:
        return {"sent": True, "delivered": False}

    token = secrets.token_urlsafe(48)
    token_hash = _hash(token)
    expires_at = _now() + timedelta(seconds=settings.member_magic_link_expire_seconds)

    row = MemberMagicLink(
        email=email_norm,
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address=ip,
    )
    db.add(row)
    db.commit()

    link = f"{portal_base_url.rstrip('/')}/m/auth/magic-link?token={token}"
    minutes = settings.member_magic_link_expire_seconds // 60

    html = f"""
    <html>
      <body style="font-family: -apple-system, system-ui, sans-serif; background:#0a0a0a; color:#fafafa; padding:24px;">
        <div style="max-width:520px; margin:0 auto; background:#0f0f0f; border:1px solid #1f1f1f; border-radius:16px; padding:32px;">
          <h2 style="color:#a3e635; margin:0 0 12px;">Sign in to ActiveHQ</h2>
          <p style="color:#9ca3af; margin:0 0 24px;">
            Click the button below to sign in to your gym member portal.
            This link expires in {minutes} minutes.
          </p>
          <p style="text-align:center; margin:32px 0;">
            <a href="{link}"
               style="display:inline-block; background:#a3e635; color:#000; padding:14px 28px; border-radius:999px; text-decoration:none; font-weight:700;">
              Sign in
            </a>
          </p>
          <p style="color:#6b7280; font-size:12px; margin-top:32px;">
            If you didn't request this, you can ignore this email — nothing changes until the link is opened.
          </p>
        </div>
      </body>
    </html>
    """
    plain = f"Sign in to ActiveHQ: {link}\n\nThis link expires in {minutes} minutes."

    delivered = False
    try:
        ok, err = get_email_service().send_email(
            to_email=email_norm,
            subject="Sign in to ActiveHQ",
            html_content=html,
            plain_text=plain,
        )
        delivered = ok
        if not ok:
            logger.warning("member_magic_link_send_failed email=%s error=%s", email_norm, err)
    except Exception as e:  # pragma: no cover
        logger.warning("member_magic_link_send_exception email=%s error=%s", email_norm, e)

    out: dict[str, Any] = {"sent": True, "delivered": delivered}
    if settings.environment != "production":
        out["debug_link"] = link
    return out


def verify_magic_link(db: Session, *, token: str) -> list[Member]:
    """Verify token, mark consumed, return matched members."""
    token_hash = _hash(token.strip())
    row = db.execute(
        select(MemberMagicLink)
        .where(MemberMagicLink.token_hash == token_hash)
        .where(MemberMagicLink.consumed_at.is_(None))
        .where(MemberMagicLink.expires_at > _now())
    ).scalar_one_or_none()
    if row is None:
        return []
    row.consumed_at = _now()
    db.commit()
    return find_members_by_email(db, row.email)


# ─────────────────────────────────────────────────────────────────────
# Google ID token flow
# ─────────────────────────────────────────────────────────────────────

_GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def verify_google_id_token(id_token: str) -> dict[str, Any] | None:
    """
    Verify a Google ID token via Google's tokeninfo endpoint.

    We use tokeninfo (rather than locally caching JWKS) for simplicity —
    member login is low-frequency. Returns None on any failure.
    """
    if not id_token:
        return None
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(_GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
        if resp.status_code != 200:
            logger.warning("google_tokeninfo_status=%s body=%s", resp.status_code, resp.text[:200])
            return None
        data = resp.json()
    except Exception as e:  # pragma: no cover
        logger.warning("google_tokeninfo_exception error=%s", e)
        return None

    # Required audience check
    expected_aud = settings.google_oauth_client_id
    aud = data.get("aud")
    if expected_aud and aud != expected_aud:
        logger.warning("google_tokeninfo_aud_mismatch aud=%s expected=%s", aud, expected_aud)
        return None

    # Issuer check
    iss = data.get("iss") or ""
    if iss not in ("accounts.google.com", "https://accounts.google.com"):
        logger.warning("google_tokeninfo_iss_mismatch iss=%s", iss)
        return None

    # Must be email-verified
    if str(data.get("email_verified", "false")).lower() not in ("true", "1"):
        logger.warning("google_tokeninfo_email_unverified")
        return None

    return data


def resolve_google_members(db: Session, *, google_payload: dict[str, Any]) -> list[Member]:
    """
    Resolve which member rows this Google identity maps to.

    Strategy:
      1. Match members previously linked to this google_sub.
      2. Fallback: match by verified email.
      3. On successful match, persist google_sub on the chosen row(s).
    """
    sub = google_payload.get("sub")
    email = (google_payload.get("email") or "").strip().lower()
    if not sub:
        return []

    # 1) members already linked
    linked = list(
        db.execute(
            select(Member)
            .options(joinedload(Member.gym))
            .where(Member.google_sub == sub)
            .where(Member.is_active.is_(True))
        ).scalars().all()
    )
    if linked:
        return [m for m in linked if m.gym and m.gym.is_active]

    # 2) fallback to email match
    if not email:
        return []
    members = find_members_by_email(db, email)
    # Persist link so future logins skip the fallback
    for m in members:
        m.google_sub = sub
    if members:
        db.commit()
    return members


# ─────────────────────────────────────────────────────────────────────
# Finalisation
# ─────────────────────────────────────────────────────────────────────

def mark_member_logged_in(db: Session, member: Member) -> None:
    member.last_member_login_at = _now()
    db.commit()


def members_to_choices(members: list[Member]) -> tuple[str, list[dict[str, Any]]]:
    """Return (selection_token, choices_payload) for the multi-gym case."""
    token = create_selection_token([m.id for m in members])
    choices = [
        {
            "selection_token": token,
            "member_id": m.id,
            "gym_id": m.gym_id,
            "gym_name": m.gym.name if m.gym else "",
            "gym_city": m.gym.city if m.gym else None,
        }
        for m in members
    ]
    return token, choices


def finalize_login(
    db: Session, members: list[Member]
) -> tuple[Member | None, list[dict[str, Any]] | None]:
    """
    Given the candidate member list from a verified challenge, return
    either a single chosen member (single-gym case) or a list of choices.
    """
    if not members:
        return None, None
    if len(members) == 1:
        member = members[0]
        mark_member_logged_in(db, member)
        return member, None
    _, choices = members_to_choices(members)
    return None, choices


def complete_selection(
    db: Session, *, selection_token: str, member_id: uuid.UUID
) -> Member | None:
    """Validate selection_token and return the picked member if allowed."""
    allowed = decode_selection_token(selection_token)
    if not allowed or member_id not in allowed:
        return None
    member = _load_member_with_gym(db, member_id)
    if not member or not member.gym or not member.gym.is_active:
        return None
    mark_member_logged_in(db, member)
    return member
