from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import BiometricEventType, DeviceVendor


class BiometricDeviceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    vendor: DeviceVendor = DeviceVendor.GENERIC
    external_device_id: str = Field(..., min_length=2, max_length=120)
    timezone: str = Field(default="Asia/Kolkata", min_length=2, max_length=64)
    location_label: str | None = Field(default=None, max_length=120)


class BiometricDeviceResponse(BaseModel):
    id: UUID
    name: str
    vendor: DeviceVendor
    external_device_id: str
    timezone: str
    location_label: str | None
    is_active: bool
    last_seen_at: datetime | None


class BiometricEventIngestItem(BaseModel):
    external_event_id: str = Field(..., min_length=2, max_length=120)
    person_identifier: str = Field(..., min_length=1, max_length=120)
    event_time: datetime
    event_type: BiometricEventType = BiometricEventType.UNKNOWN
    device_offset_minutes: int = 0
    raw_payload: dict | None = None


class BiometricEventIngestRequest(BaseModel):
    external_device_id: str = Field(..., min_length=2, max_length=120)
    events: list[BiometricEventIngestItem] = Field(..., min_length=1, max_length=500)


class BiometricIngestSummary(BaseModel):
    total_received: int
    processed: int
    duplicates: int
    conflicts: int
    failed: int
