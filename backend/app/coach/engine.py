"""
Deterministic AI Coach plan generator (Python port of `frontend/src/lib/coach.ts`).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal, TypedDict

Activity = Literal["sedentary", "light", "moderate", "active", "athlete"]
Goal = Literal["lose", "maintain", "gain"]
Level = Literal["beginner", "intermediate", "advanced"]
Equipment = Literal["home", "gym"]
Diet = Literal["omnivore", "vegetarian", "vegan", "eggetarian"]
Sex = Literal["male", "female"]
BmiBand = Literal["underweight", "normal", "overweight", "obese"]


class CoachInput(TypedDict):
    sex: Sex
    age: int
    heightCm: float
    weightKg: float
    activity: Activity
    goal: Goal
    level: Level
    equipment: Equipment
    diet: Diet
    daysPerWeek: int


_DATA: dict[str, Any] | None = None


def _load_data() -> dict[str, Any]:
    global _DATA
    if _DATA is None:
        p = Path(__file__).resolve().parent / "data.json"
        _DATA = json.loads(p.read_text(encoding="utf-8"))
    return _DATA


ACTIVITY_MULT: dict[Activity, float] = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "athlete": 1.9,
}


def clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    if height_cm <= 0:
        return 0.0
    m = height_cm / 100.0
    return round(weight_kg / (m * m), 1)


def bmi_band(bmi: float) -> BmiBand:
    if bmi < 18.5:
        return "underweight"
    if bmi < 25:
        return "normal"
    if bmi < 30:
        return "overweight"
    return "obese"


def calculate_bmr(inp: dict[str, Any]) -> int:
    base = 10 * inp["weightKg"] + 6.25 * inp["heightCm"] - 5 * inp["age"]
    return int(round(base + 5 if inp["sex"] == "male" else base - 161))


def calculate_tdee(inp: CoachInput) -> int:
    return int(round(calculate_bmr(inp) * ACTIVITY_MULT[inp["activity"]]))


def calculate_macros(inp: CoachInput) -> dict[str, float | int]:
    tdee = calculate_tdee(inp)
    calories = tdee
    if inp["goal"] == "lose":
        calories = int(round(tdee * 0.82))
    elif inp["goal"] == "gain":
        calories = int(round(tdee * 1.12))

    protein_g = int(round(inp["weightKg"] * (2.0 if inp["goal"] == "lose" else 1.8)))
    fat_kcal = calories * 0.25
    fat_g = int(round(fat_kcal / 9))
    protein_kcal = protein_g * 4
    carbs_g = max(0, int(round((calories - protein_kcal - fat_kcal) / 4)))
    water_l = round(((inp["weightKg"] * 35) + (inp["daysPerWeek"] * 70)) / 1000, 1)
    fiber_g = int(round(min(40, calories / 100)))

    return {
        "calories": calories,
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
        "water_l": water_l,
        "fiber_g": fiber_g,
    }


def pick_split(days: int, goal: Goal) -> list[str]:
    if days <= 2:
        return ["full", "full"]
    if days == 3:
        return ["full", "cardio", "full"] if goal == "lose" else ["push", "pull", "legs"]
    if days == 4:
        return ["full", "cardio", "full", "core"] if goal == "lose" else ["push", "pull", "legs", "full"]
    if days == 5:
        return ["push", "pull", "legs", "cardio", "core"]
    return ["push", "pull", "legs", "push", "pull", "cardio"]


def focus_label(key: str) -> str:
    return {
        "push": "Push (chest, shoulders, triceps)",
        "pull": "Pull (back, biceps)",
        "legs": "Legs (quads, hamstrings, glutes)",
        "full": "Full body",
        "cardio": "Cardio + conditioning",
        "core": "Core + mobility",
    }.get(key, key)


DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def build_workout(inp: CoachInput) -> list[dict[str, Any]]:
    d = _load_data()
    ex = d["ex"]
    days = int(clamp(inp["daysPerWeek"], 2, 6))
    split = pick_split(days, inp["goal"])
    equip: Equipment = inp["equipment"]
    out: list[dict[str, Any]] = []
    for idx, focus in enumerate(split):
        bank = ex[focus][equip][:5]
        out.append(
            {
                "day": DAY_NAMES[idx] if idx < len(DAY_NAMES) else f"Day {idx + 1}",
                "focus": focus_label(focus),
                "exercises": bank,
            }
        )
    return out


def build_meals(inp: CoachInput, macros: dict[str, Any]) -> list[dict[str, Any]]:
    d = _load_data()
    bank_root: dict[str, list] = d["meal_bank"]
    slot_meta = d["slot_meta"]
    diet: Diet = inp["diet"]
    bank = bank_root[diet]
    seed = int((inp["weightKg"] + inp["age"]) % 7)
    kcal_per = int(round(macros["calories"] / len(slot_meta)))
    meals: list[dict[str, Any]] = []
    for i, meta in enumerate(slot_meta):
        options = bank[i] if i < len(bank) else []
        if options:
            choice = options[(seed + i) % len(options)]
        else:
            choice = {"title": "Balanced plate", "items": []}
        meals.append(
            {
                "slot": meta["slot"],
                "time": meta["time"],
                "title": choice["title"],
                "items": choice["items"],
                "approxKcal": kcal_per,
            }
        )
    return meals


def build_insights(inp: CoachInput, macros: dict[str, Any], bmi_val: float) -> list[str]:
    band = bmi_band(bmi_val)
    out: list[str] = []

    if inp["goal"] == "lose":
        out.append(
            "You're in a ~18% calorie deficit. Expect a healthy 0.4–0.7 kg/week loss — "
            "anything faster usually means muscle loss."
        )
    elif inp["goal"] == "gain":
        out.append(
            "You're in a ~12% surplus. Aim for ~0.25–0.50 kg/week gain. More than that is mostly fat."
        )
    else:
        out.append("Calories are set to maintenance. Stay within ±5% of target and watch weight weekly.")

    out.append(
        f"Protein target: {macros['protein_g']} g/day — split it across 4 meals "
        f"(~{round(macros['protein_g'] / 4)} g each) for best muscle synthesis."
    )
    out.append(
        f"Drink {macros['water_l']} L water. Add 500 ml extra on training days. "
        "Indian summers? Bump by another 500 ml."
    )
    if band in ("overweight", "obese"):
        out.append(
            f"Your BMI is in the {band} band. Pair this plan with 7–9 k steps daily — that alone moves the needle."
        )
    if band == "underweight":
        out.append(
            'Your BMI is underweight — prioritise calorie surplus + heavy compound lifts. '
            'Eat even on "not hungry" days.'
        )
    out.append(
        "Sleep 7+ hours. Without it, fat loss stalls and muscle recovery drops ~30%. This isn't optional."
    )
    return out


def plan_badge(inp: CoachInput) -> str:
    weeks = 12 if inp["goal"] == "lose" else 16 if inp["goal"] == "gain" else 8
    verb = "lean cut" if inp["goal"] == "lose" else "muscle build" if inp["goal"] == "gain" else "recomp"
    return f"{weeks}-week {verb}"


def normalize_input(raw: dict[str, Any]) -> CoachInput:
    return {
        "sex": raw["sex"],
        "age": int(clamp(float(raw["age"]), 12, 90)),
        "heightCm": float(clamp(float(raw["heightCm"]), 120, 230)),
        "weightKg": float(clamp(float(raw["weightKg"]), 30, 250)),
        "activity": raw["activity"],
        "goal": raw["goal"],
        "level": raw["level"],
        "equipment": raw["equipment"],
        "diet": raw["diet"],
        "daysPerWeek": int(clamp(float(raw["daysPerWeek"]), 2, 6)),
    }


def generate_plan_dict(raw: dict[str, Any]) -> dict[str, Any]:
    safe = normalize_input(raw)
    bmi = calculate_bmi(safe["weightKg"], safe["heightCm"])
    bmr = calculate_bmr(safe)
    tdee = calculate_tdee(safe)
    macros = calculate_macros(safe)
    return {
        "bmi": bmi,
        "bmiBand": bmi_band(bmi),
        "bmr": bmr,
        "tdee": tdee,
        "macros": macros,
        "meals": build_meals(safe, macros),
        "workout": build_workout(safe),
        "insights": build_insights(safe, macros, bmi),
        "badge": plan_badge(safe),
    }
