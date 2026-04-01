"""Schemas for bulk data import / gym migration."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import (
    BiometricEventType,
    Gender,
    MembershipStatus,
    PaymentMode,
)


# ── Member import ──────────────────────────────────────────────────

class MemberImportRow(BaseModel):
    """One member record coming from the old system."""
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=10, max_length=15)
    email: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    address: str | None = None
    joined_date: date | None = None
    member_code: str | None = Field(None, max_length=50,
        description="Device user ID from the biometric device. "
                    "Will be stored as member_code for attendance mapping.")
    notes: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


class MemberImportRequest(BaseModel):
    members: list[MemberImportRow] = Field(..., min_length=1, max_length=2000)
    skip_duplicates: bool = Field(True,
        description="If true, skip rows whose phone already exists; "
                    "if false, reject entire batch on first duplicate.")


class MemberImportResult(BaseModel):
    total_received: int
    created: int
    skipped_duplicates: int
    errors: list[str]


# ── Plan import ────────────────────────────────────────────────────

class PlanImportRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    duration_days: int = Field(..., ge=1, le=3650)
    price: Decimal = Field(..., ge=0)
    description: str | None = None


class PlanImportRequest(BaseModel):
    plans: list[PlanImportRow] = Field(..., min_length=1, max_length=100)


class PlanImportResult(BaseModel):
    total_received: int
    created: int
    skipped_duplicates: int
    errors: list[str]


# ── Membership import ──────────────────────────────────────────────

class MembershipImportRow(BaseModel):
    """Link a member (by phone) to a plan (by name)."""
    member_phone: str = Field(..., min_length=10, max_length=15)
    plan_name: str
    start_date: date
    end_date: date
    amount_total: Decimal = Field(..., ge=0)
    amount_paid: Decimal = Field(Decimal("0"), ge=0)
    status: MembershipStatus = MembershipStatus.ACTIVE


class MembershipImportRequest(BaseModel):
    memberships: list[MembershipImportRow] = Field(..., min_length=1, max_length=2000)


class MembershipImportResult(BaseModel):
    total_received: int
    created: int
    skipped: int
    errors: list[str]


# ── Payment import ─────────────────────────────────────────────────

class PaymentImportRow(BaseModel):
    member_phone: str = Field(..., min_length=10, max_length=15)
    amount: Decimal = Field(..., ge=0)
    payment_date: date
    payment_mode: PaymentMode = PaymentMode.CASH
    reference_number: str | None = None
    notes: str | None = None


class PaymentImportRequest(BaseModel):
    payments: list[PaymentImportRow] = Field(..., min_length=1, max_length=5000)


class PaymentImportResult(BaseModel):
    total_received: int
    created: int
    skipped: int
    errors: list[str]


# ── Attendance import ──────────────────────────────────────────────

class AttendanceImportRow(BaseModel):
    """One attendance punch from the old system or device export."""
    person_identifier: str = Field(..., min_length=1, max_length=120,
        description="Device user ID / member_code from old system")
    timestamp: datetime
    punch_type: BiometricEventType = BiometricEventType.UNKNOWN


class AttendanceImportRequest(BaseModel):
    """Bulk historical attendance import (up to 10 000 rows per call)."""
    records: list[AttendanceImportRow] = Field(..., min_length=1, max_length=10_000)
    source_label: str = Field("csv_import", max_length=120,
        description="Label for audit trail, e.g. 'eTimeTrackLite_export'")


class AttendanceImportResult(BaseModel):
    total_received: int
    created: int
    skipped_unknown_member: int
    skipped_duplicate: int
    errors: list[str]


# ── Device-user mapping ───────────────────────────────────────────

class DeviceUserMappingRow(BaseModel):
    device_user_id: str = Field(..., min_length=1, max_length=120)
    member_phone: str = Field(..., min_length=10, max_length=15,
        description="Phone of the ActiveHQ member this device user maps to")


class DeviceUserMappingRequest(BaseModel):
    device_id: UUID
    mappings: list[DeviceUserMappingRow] = Field(..., min_length=1, max_length=2000)


class DeviceUserMappingResult(BaseModel):
    total_received: int
    created: int
    updated: int
    errors: list[str]


# ── Reconciliation ─────────────────────────────────────────────────

class ReconciliationRequest(BaseModel):
    days: int = Field(30, ge=1, le=365, description="Look-back window in days")


class ReconciliationReport(BaseModel):
    period_days: int
    total_members: int
    active_members: int
    total_memberships: int
    active_memberships: int
    total_attendance_punches: int
    total_payments: int
    total_revenue: Decimal
    unmapped_device_users: int
    biometric_conflicts: int


# ── Biometric sync status ─────────────────────────────────────────

class DeviceSyncStatus(BaseModel):
    device_id: UUID
    device_name: str
    vendor: str
    is_active: bool
    last_seen_at: datetime | None
    mapped_members: int
    total_events: int
    events_last_24h: int
    conflict_events: int


class BiometricSyncOverview(BaseModel):
    total_devices: int
    active_devices: int
    total_mapped_members: int
    last_event_at: datetime | None
    devices: list[DeviceSyncStatus]
