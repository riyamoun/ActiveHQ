"""Public AI Coach API — deterministic plan + optional Gemini insight prose."""

import logging
from typing import Any

from fastapi import APIRouter, Request

from app.coach.engine import generate_plan_dict
from app.coach.gemini import gemini_coach_insights
from app.coach.schemas import CoachPlanRequest
from app.core.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/plan")
@limiter.limit("30/minute")
async def coach_plan(request: Request, body: CoachPlanRequest) -> dict[str, Any]:
    """
    Build a full coach plan server-side (same maths as the web app) and
    optionally replace the `insights` strings with Gemini Flash prose.
    """
    raw = body.model_dump()
    locale = raw.pop("locale", "en")
    plan = generate_plan_dict(raw)

    ai_insights = await gemini_coach_insights(plan=plan, locale=locale)
    if ai_insights:
        plan["insights"] = ai_insights
    else:
        # already deterministic from engine; log once in debug for operators
        logger.debug("coach_plan_using_deterministic_insights locale=%s", locale)

    return plan
