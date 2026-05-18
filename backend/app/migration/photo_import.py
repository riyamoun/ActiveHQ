"""Best-effort member photo import from URLs or base64 during migration."""

from __future__ import annotations

import base64
import binascii
import re
import uuid
from pathlib import Path

import httpx

from app.members.photo_storage import ALLOWED_CONTENT_TYPES, _gym_dir

_DATA_URL_RE = re.compile(
    r"^data:(image/(?:jpeg|png|webp));base64,(.+)$",
    re.IGNORECASE | re.DOTALL,
)


def _write_member_photo_bytes(
    gym_id: uuid.UUID, member_id: uuid.UUID, data: bytes, extension: str
) -> str | None:
    if not data or len(data) > 5 * 1024 * 1024:
        return None
    gym_path = _gym_dir(gym_id)
    for existing in gym_path.glob(f"{member_id}.*"):
        try:
            existing.unlink()
        except OSError:
            pass
    filename = f"{member_id}{extension}"
    (gym_path / filename).write_bytes(data)
    return filename


def import_member_photo_value(
    gym_id: uuid.UUID, member_id: uuid.UUID, raw: str | None
) -> str | None:
    """Download or decode a photo; returns stored filename. Never raises."""
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None

    try:
        match = _DATA_URL_RE.match(value)
        if match:
            content_type = match.group(1).lower()
            ext = ALLOWED_CONTENT_TYPES.get(content_type)
            if not ext:
                return None
            data = base64.b64decode(match.group(2), validate=True)
            return _write_member_photo_bytes(gym_id, member_id, data, ext)

        if value.lower().startswith(("http://", "https://")):
            with httpx.Client(timeout=20.0, follow_redirects=True) as client:
                resp = client.get(value)
                resp.raise_for_status()
            content_type = (resp.headers.get("content-type") or "").split(";")[0].lower()
            ext = ALLOWED_CONTENT_TYPES.get(content_type)
            if not ext:
                guessed = Path(value.split("?")[0]).suffix.lower()
                ext = {".jpg": ".jpg", ".jpeg": ".jpg", ".png": ".png", ".webp": ".webp"}.get(
                    guessed
                )
            if not ext:
                return None
            return _write_member_photo_bytes(gym_id, member_id, resp.content, ext)

        if len(value) > 100 and " " not in value and "/" not in value:
            data = base64.b64decode(value, validate=True)
            return _write_member_photo_bytes(gym_id, member_id, data, ".jpg")
    except (httpx.HTTPError, binascii.Error, ValueError, OSError):
        return None

    return None
