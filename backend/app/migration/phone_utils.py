"""Normalize Indian mobile numbers for import matching."""

from __future__ import annotations

import re


def normalize_phone(raw: str | None) -> str | None:
    """Return last 10 digits for Indian mobiles, or None if invalid."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", str(raw).strip())
    if not digits:
        return None
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) < 10:
        return None
    if len(digits) > 10:
        digits = digits[-10:]
    return digits
