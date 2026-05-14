"""Gemini Flash — rewrite coach *insights* prose only (numbers stay server-side)."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if m:
        text = m.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def gemini_coach_insights(*, plan: dict[str, Any], locale: str) -> list[str] | None:
    """
    Ask Gemini for 5 coaching insight strings. Returns None on any failure
    so the caller can fall back to deterministic insights.
    """
    key = (settings.gemini_api_key or "").strip()
    if not key:
        return None

    model = (settings.gemini_model or "gemini-2.0-flash").strip()
    lang = "Hindi, written in Devanagari script (देवनागरी). Do not use Romanized Hindi." if locale == "hi" else "English"

    inp_bits = {
        "bmi": plan.get("bmi"),
        "bmiBand": plan.get("bmiBand"),
        "bmr": plan.get("bmr"),
        "tdee": plan.get("tdee"),
        "macros": plan.get("macros"),
        "badge": plan.get("badge"),
        "workout_focus_days": [d.get("focus") for d in (plan.get("workout") or [])],
    }

    schema_hint = '{"insights": ["...", "..."]}'
    prompt = f"""You are a supportive strength & nutrition coach for gym members in India.

Write EXACTLY 5 short insight strings for the mobile app "Coach insights" section.

Rules (critical):
- Output VALID JSON only, shape {schema_hint}. No markdown fences.
- Each insight is 1–2 sentences max, practical and encouraging.
- Language: {lang}
- Do NOT restate or invent specific calorie/macro/BMI/TDEE numbers — the UI already shows those. You may refer to goals in general terms (energy, consistency, protein across meals, sleep, hydration, walking, Indian food habits).
- Do not contradict medical safety: no extreme cuts, no steroid advice.

Context JSON:
{json.dumps(inp_bits, ensure_ascii=False)}
"""

    url = GEMINI_URL.format(model=model)
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.65,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post(url, params={"key": key}, json=payload)
        if r.status_code != 200:
            logger.warning("gemini_http_%s body=%s", r.status_code, r.text[:300])
            return None
        data = r.json()
        parts = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [])
        )
        if not parts:
            logger.warning("gemini_empty_parts %s", data)
            return None
        raw_text = parts[0].get("text", "")
        parsed: dict[str, Any] | None = None
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            parsed = _extract_json(raw_text)
        if not parsed or "insights" not in parsed:
            return None
        insights = parsed["insights"]
        if not isinstance(insights, list):
            return None
        out = [str(x).strip() for x in insights if str(x).strip()]
        if len(out) < 3:
            return None
        return out[:8]
    except Exception as e:  # pragma: no cover
        logger.warning("gemini_exception %s", e)
        return None
