"""Request / response models for POST /api/coach/plan."""

from typing import Literal

from pydantic import BaseModel, Field


class CoachPlanRequest(BaseModel):
    sex: Literal["male", "female"]
    age: int = Field(ge=12, le=90)
    heightCm: float = Field(ge=120, le=230)
    weightKg: float = Field(ge=30, le=250)
    activity: Literal["sedentary", "light", "moderate", "active", "athlete"]
    goal: Literal["lose", "maintain", "gain"]
    level: Literal["beginner", "intermediate", "advanced"]
    equipment: Literal["home", "gym"]
    diet: Literal["omnivore", "vegetarian", "vegan", "eggetarian"]
    daysPerWeek: int = Field(ge=2, le=6)
    locale: Literal["en", "hi"] = "en"
