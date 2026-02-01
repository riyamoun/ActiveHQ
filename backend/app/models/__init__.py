"""
SQLAlchemy models for ActiveHQ.

All models are imported here for:
1. Easy access from other modules
2. Alembic migration auto-discovery
"""

from app.models.enums import (
    SubscriptionStatus,
    BillingCycle,
    UserRole,
    Gender,
    MembershipStatus,
    PaymentMode,
    NotificationType,
    NotificationChannel,
    NotificationStatus,
)
from app.models.gym import Gym
from app.models.user import User
from app.models.member import Member
from app.models.plan import Plan
from app.models.membership import Membership
from app.models.payment import Payment
from app.models.attendance import Attendance
from app.models.notification import Notification
from app.models.demo_request import DemoRequest

__all__ = [
    # Enums
    "SubscriptionStatus",
    "BillingCycle",
    "UserRole",
    "Gender",
    "MembershipStatus",
    "PaymentMode",
    "NotificationType",
    "NotificationChannel",
    "NotificationStatus",
    # Models
    "Gym",
    "User",
    "Member",
    "Plan",
    "Membership",
    "Payment",
    "Attendance",
    "Notification",
    "DemoRequest",
]
