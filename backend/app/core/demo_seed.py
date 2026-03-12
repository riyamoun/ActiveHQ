"""
One-time demo data seeding. Used by /setup-database and GET /api/v1/public/seed-demo.
Creates FitZone gym + owner (owner@fitzonegym.com / Owner@123) only when no gyms exist.
"""

from datetime import date, timedelta
from decimal import Decimal
import random

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Gym, User, Member, Plan, Membership
from app.models.enums import (
    SubscriptionStatus,
    BillingCycle,
    UserRole,
    Gender,
    MembershipStatus,
)


def create_demo_data(db: Session) -> bool:
    """
    Create demo gym, owner, plans, members, and memberships if no gym exists.
    Returns True if data was created, False if a gym already existed.
    """
    if db.query(Gym).first():
        return False

    gym = Gym(
        name="FitZone Premium Gym",
        slug="fitzone-premium-gym",
        owner_name="Rajesh Kumar",
        email="contact@fitzonegym.com",
        phone="9876543210",
        address="123, MG Road, Koramangala",
        city="Bangalore",
        state="Karnataka",
        pincode="560034",
        subscription_status=SubscriptionStatus.ACTIVE,
        subscription_start=date.today() - timedelta(days=30),
        subscription_end=date.today() + timedelta(days=335),
        setup_fee_paid=True,
        billing_cycle=BillingCycle.YEARLY,
        settings={"timezone": "Asia/Kolkata", "currency": "INR"},
        is_active=True,
    )
    db.add(gym)
    db.flush()

    owner = User(
        gym_id=gym.id,
        email="owner@fitzonegym.com",
        password_hash=hash_password("Owner@123"),
        name="Rajesh Kumar",
        phone="9876543210",
        role=UserRole.OWNER,
        is_active=True,
    )
    db.add(owner)
    db.flush()

    plans_data = [
        ("Monthly", "Basic monthly membership", 30, 1500),
        ("Quarterly", "3 months membership", 90, 4000),
        ("Half Yearly", "6 months membership", 180, 7500),
        ("Yearly", "Annual membership", 365, 14000),
    ]
    plans = []
    for name, desc, days, price in plans_data:
        plan = Plan(
            gym_id=gym.id,
            name=name,
            description=desc,
            duration_days=days,
            price=Decimal(price),
            is_active=True,
        )
        db.add(plan)
        plans.append(plan)
    db.flush()

    names = ["Rahul Sharma", "Priya Patel", "Amit Singh", "Neha Gupta", "Vikram Reddy"]
    members = []
    for i, name in enumerate(names):
        member = Member(
            gym_id=gym.id,
            name=name,
            phone=f"98765{str(i).zfill(5)}",
            gender=Gender.MALE if i % 2 == 0 else Gender.FEMALE,
            joined_date=date.today() - timedelta(days=random.randint(10, 90)),
            member_code=f"FZ{str(i+1).zfill(4)}",
            is_active=True,
        )
        db.add(member)
        members.append(member)
    db.flush()

    for member in members:
        plan = random.choice(plans)
        start = member.joined_date
        membership = Membership(
            gym_id=gym.id,
            member_id=member.id,
            plan_id=plan.id,
            start_date=start,
            end_date=start + timedelta(days=plan.duration_days),
            amount_total=plan.price,
            amount_paid=plan.price,
            status=MembershipStatus.ACTIVE,
            created_by=owner.id,
        )
        db.add(membership)

    db.commit()
    return True
