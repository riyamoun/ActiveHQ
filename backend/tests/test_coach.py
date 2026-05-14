"""Tests for deterministic AI coach engine."""

from app.coach.engine import calculate_bmi, generate_plan_dict


def test_bmi_typical():
    assert calculate_bmi(70, 175) == 22.9


def test_plan_shape_and_macros():
    raw = {
        "sex": "male",
        "age": 30,
        "heightCm": 175,
        "weightKg": 80,
        "activity": "moderate",
        "goal": "lose",
        "level": "beginner",
        "equipment": "gym",
        "diet": "vegetarian",
        "daysPerWeek": 4,
    }
    plan = generate_plan_dict(raw)
    assert "bmi" in plan and "macros" in plan
    assert plan["macros"]["calories"] > 0
    assert plan["macros"]["protein_g"] > 0
    assert len(plan["meals"]) == 5
    assert len(plan["workout"]) == 4
    assert len(plan["insights"]) >= 4
    assert "badge" in plan
