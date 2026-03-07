"""
Enum definitions for the ActiveHQ platform.
Using Python enums with string values for PostgreSQL ENUM types.
"""

import enum


class SubscriptionStatus(str, enum.Enum):
    """Gym platform subscription status."""
    TRIAL = "trial"
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class BillingCycle(str, enum.Enum):
    """Gym billing cycle for platform subscription."""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class UserRole(str, enum.Enum):
    """User roles: super_admin (platform), owner/manager/staff (gym-scoped)."""
    SUPER_ADMIN = "super_admin"
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"


class Gender(str, enum.Enum):
    """Member gender options."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class MembershipStatus(str, enum.Enum):
    """Member's membership status."""
    ACTIVE = "active"
    EXPIRED = "expired"
    PAUSED = "paused"  # Common in Indian gyms
    CANCELLED = "cancelled"


class PaymentMode(str, enum.Enum):
    """Payment method options (India-focused)."""
    CASH = "cash"
    UPI = "upi"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"


class NotificationType(str, enum.Enum):
    """Types of notifications sent to members."""
    EXPIRY_REMINDER = "expiry_reminder"
    PAYMENT_DUE = "payment_due"
    WELCOME = "welcome"
    CUSTOM = "custom"


class NotificationChannel(str, enum.Enum):
    """Notification delivery channels."""
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"


class NotificationStatus(str, enum.Enum):
    """Notification delivery status."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class DeviceVendor(str, enum.Enum):
    """Supported biometric device vendors."""
    ESSL = "essl"
    GENERIC = "generic"


class BiometricEventType(str, enum.Enum):
    """Biometric attendance event type."""
    CHECK_IN = "check_in"
    CHECK_OUT = "check_out"
    UNKNOWN = "unknown"


class BiometricEventStatus(str, enum.Enum):
    """Ingestion lifecycle status for biometric events."""
    PENDING = "pending"
    PROCESSED = "processed"
    DUPLICATE = "duplicate"
    CONFLICT = "conflict"
    FAILED = "failed"


class CampaignTriggerType(str, enum.Enum):
    """Automation trigger categories."""
    RENEWAL_REMINDER = "renewal_reminder"
    PAYMENT_FOLLOWUP = "payment_followup"
    INACTIVITY_NUDGE = "inactivity_nudge"
    CUSTOM = "custom"
