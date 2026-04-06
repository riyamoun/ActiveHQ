"""
Member photo storage helpers.
"""

from __future__ import annotations

import mimetypes
import uuid
from pathlib import Path

from fastapi import UploadFile


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_PHOTO_ROOT = _BACKEND_ROOT / "storage" / "member_photos"


def _gym_dir(gym_id: uuid.UUID) -> Path:
    path = _PHOTO_ROOT / str(gym_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_member_photo(gym_id: uuid.UUID, member_id: uuid.UUID, upload: UploadFile) -> str:
    content_type = (upload.content_type or "").lower()
    extension = ALLOWED_CONTENT_TYPES.get(content_type)
    if not extension:
        raise ValueError("Only JPG, PNG, or WEBP images are allowed")

    data = upload.file.read()
    if not data:
        raise ValueError("Uploaded file is empty")
    if len(data) > MAX_PHOTO_BYTES:
        raise ValueError("Image too large. Max size is 5MB")

    gym_path = _gym_dir(gym_id)

    # Remove old files for this member (different extension replacements).
    for existing in gym_path.glob(f"{member_id}.*"):
        try:
            existing.unlink()
        except OSError:
            pass

    filename = f"{member_id}{extension}"
    filepath = gym_path / filename
    filepath.write_bytes(data)
    return filename


def get_member_photo_file_path(gym_id: uuid.UUID, photo_name: str) -> Path:
    return _gym_dir(gym_id) / photo_name


def delete_member_photo_file(gym_id: uuid.UUID, photo_name: str) -> None:
    path = get_member_photo_file_path(gym_id, photo_name)
    if path.exists():
        try:
            path.unlink()
        except OSError:
            pass


def guess_media_type(photo_name: str) -> str:
    media_type, _ = mimetypes.guess_type(photo_name)
    return media_type or "application/octet-stream"
