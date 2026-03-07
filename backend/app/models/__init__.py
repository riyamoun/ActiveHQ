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
    DeviceVendor,
    BiometricEventType,
    BiometricEventStatus,
    CampaignTriggerType,
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
from app.models.biometric_device import BiometricDevice
from app.models.biometric_event import BiometricEvent
from app.models.automation_campaign import AutomationCampaign, CampaignDeliveryLog
from app.models.refresh_token import RefreshToken
from app.models.audit_log import AuditLog

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
    "DeviceVendor",
    "BiometricEventType",
    "BiometricEventStatus",
    "CampaignTriggerType",
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
    "BiometricDevice",
    "BiometricEvent",
    "AutomationCampaign",
    "CampaignDeliveryLog",
    "RefreshToken",
    "AuditLog",
]
