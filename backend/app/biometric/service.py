from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.auth.dependencies import TenantContext
from app.models import Attendance, BiometricDevice, BiometricEvent, DeviceUserMapping, Member
from app.models.enums import (
    BiometricEventStatus,
    BiometricEventType,
    DeviceVendor,
)
from app.biometric.schemas import (
    BiometricDeviceCreate,
    BiometricEventIngestRequest,
    BiometricIngestSummary,
)


class BiometricService:
    def __init__(self, db: Session):
        self.db = db

    def list_devices(self, tenant: TenantContext) -> list[BiometricDevice]:
        return self.db.execute(
            select(BiometricDevice)
            .where(BiometricDevice.gym_id == tenant.gym_id)
            .order_by(BiometricDevice.created_at.desc())
        ).scalars().all()

    def device_to_response(self, device: BiometricDevice):
        from app.biometric.schemas import BiometricDeviceResponse
        return BiometricDeviceResponse(
            **device.to_dict(),
            has_ingest_token=bool(device.ingest_token_hash),
        )

    def list_device_mappings(self, tenant: TenantContext, device_id) -> list[dict]:
        """Return mappings for a device with member display fields."""
        rows = self.db.execute(
            select(DeviceUserMapping, Member)
            .join(Member, Member.id == DeviceUserMapping.member_id)
            .where(
                and_(
                    DeviceUserMapping.gym_id == tenant.gym_id,
                    DeviceUserMapping.device_id == device_id,
                )
            )
            .order_by(DeviceUserMapping.device_user_id)
        ).all()
        out = []
        for mapping, member in rows:
            out.append({
                "id": mapping.id,
                "device_id": mapping.device_id,
                "member_id": mapping.member_id,
                "device_user_id": mapping.device_user_id,
                "member_name": member.name,
                "member_phone": member.phone,
            })
        return out

    def upsert_device_mapping(
        self,
        tenant: TenantContext,
        *,
        device_id,
        member_id,
        device_user_id: str,
    ) -> DeviceUserMapping:
        device = self.db.execute(
            select(BiometricDevice).where(
                and_(
                    BiometricDevice.gym_id == tenant.gym_id,
                    BiometricDevice.id == device_id,
                )
            )
        ).scalar_one_or_none()
        if not device:
            raise ValueError("Device not found")

        member = self.db.execute(
            select(Member).where(
                and_(
                    Member.gym_id == tenant.gym_id,
                    Member.id == member_id,
                    Member.is_active == True,  # noqa: E712
                )
            )
        ).scalar_one_or_none()
        if not member:
            raise ValueError("Member not found")

        device_user_id = device_user_id.strip()
        existing = self.db.execute(
            select(DeviceUserMapping).where(
                and_(
                    DeviceUserMapping.gym_id == tenant.gym_id,
                    DeviceUserMapping.device_id == device_id,
                    DeviceUserMapping.device_user_id == device_user_id,
                )
            )
        ).scalar_one_or_none()

        if existing and existing.member_id != member_id:
            existing.member_id = member_id
            mapping = existing
        elif existing:
            mapping = existing
        else:
            mapping = DeviceUserMapping(
                gym_id=tenant.gym_id,
                device_id=device_id,
                member_id=member_id,
                device_user_id=device_user_id,
            )
            self.db.add(mapping)

        # Keep member_code in sync so agent + direct ingest both work.
        if not member.member_code:
            member.member_code = device_user_id

        self.db.commit()
        self.db.refresh(mapping)
        return mapping

    def delete_device_mapping(self, tenant: TenantContext, mapping_id) -> bool:
        row = self.db.execute(
            select(DeviceUserMapping).where(
                and_(
                    DeviceUserMapping.gym_id == tenant.gym_id,
                    DeviceUserMapping.id == mapping_id,
                )
            )
        ).scalar_one_or_none()
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def create_device(self, tenant: TenantContext, payload: BiometricDeviceCreate) -> BiometricDevice:
        device = BiometricDevice(
            gym_id=tenant.gym_id,
            name=payload.name,
            vendor=payload.vendor if isinstance(payload.vendor, DeviceVendor) else DeviceVendor.GENERIC,
            external_device_id=payload.external_device_id,
            timezone=payload.timezone,
            location_label=payload.location_label,
        )
        self.db.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def rotate_ingest_token(self, tenant: TenantContext, device_id) -> tuple[BiometricDevice, str]:
        device = self.db.execute(
            select(BiometricDevice).where(
                and_(
                    BiometricDevice.gym_id == tenant.gym_id,
                    BiometricDevice.id == device_id,
                )
            )
        ).scalar_one_or_none()
        if not device:
            raise ValueError("Device not found")

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        device.ingest_token_hash = token_hash
        device.ingest_token_rotated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(device)
        return device, token

    def ingest_events(self, tenant: TenantContext, payload: BiometricEventIngestRequest) -> BiometricIngestSummary:
        device = self.db.execute(
            select(BiometricDevice).where(
                and_(
                    BiometricDevice.gym_id == tenant.gym_id,
                    BiometricDevice.external_device_id == payload.external_device_id,
                    BiometricDevice.is_active == True,  # noqa: E712
                )
            )
        ).scalar_one_or_none()

        if not device:
            raise ValueError("Device not found or inactive")

        processed = 0
        duplicates = 0
        conflicts = 0
        failed = 0

        for item in payload.events:
            existing = self.db.execute(
                select(BiometricEvent).where(
                    and_(
                        BiometricEvent.gym_id == tenant.gym_id,
                        BiometricEvent.device_id == device.id,
                        BiometricEvent.external_event_id == item.external_event_id,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                duplicates += 1
                continue

            event_time = item.event_time
            if event_time.tzinfo is None:
                event_time = event_time.replace(tzinfo=timezone.utc)
            if item.device_offset_minutes:
                event_time = event_time - timedelta(minutes=item.device_offset_minutes)

            member = self.db.execute(
                select(Member).where(
                    and_(
                        Member.gym_id == tenant.gym_id,
                        Member.member_code == item.person_identifier,
                        Member.is_active == True,  # noqa: E712
                    )
                )
            ).scalar_one_or_none()

            # Fallback for biometric devices that use local face/fingerprint user IDs.
            # These are mapped to ActiveHQ members via device_user_mappings.
            if not member:
                mapping = self.db.execute(
                    select(DeviceUserMapping).where(
                        and_(
                            DeviceUserMapping.gym_id == tenant.gym_id,
                            DeviceUserMapping.device_id == device.id,
                            DeviceUserMapping.device_user_id == item.person_identifier,
                        )
                    )
                ).scalar_one_or_none()
                if mapping:
                    member = self.db.execute(
                        select(Member).where(
                            and_(
                                Member.gym_id == tenant.gym_id,
                                Member.id == mapping.member_id,
                                Member.is_active == True,  # noqa: E712
                            )
                        )
                    ).scalar_one_or_none()

            event = BiometricEvent(
                gym_id=tenant.gym_id,
                device_id=device.id,
                member_id=member.id if member else None,
                external_event_id=item.external_event_id,
                person_identifier=item.person_identifier,
                event_type=item.event_type,
                event_time=event_time,
                status=BiometricEventStatus.PENDING,
                raw_payload=item.raw_payload,
            )
            self.db.add(event)
            self.db.flush()

            try:
                status = self._apply_event_to_attendance(tenant, event, member)
                event.status = status
                if status == BiometricEventStatus.PROCESSED:
                    processed += 1
                elif status == BiometricEventStatus.DUPLICATE:
                    duplicates += 1
                elif status == BiometricEventStatus.CONFLICT:
                    conflicts += 1
                else:
                    failed += 1
            except Exception:
                event.status = BiometricEventStatus.FAILED
                event.conflict_reason = "processing_error"
                failed += 1

        device.last_seen_at = payload.events[-1].event_time
        self.db.commit()

        return BiometricIngestSummary(
            total_received=len(payload.events),
            processed=processed,
            duplicates=duplicates,
            conflicts=conflicts,
            failed=failed,
        )

    def _apply_event_to_attendance(
        self,
        tenant: TenantContext,
        event: BiometricEvent,
        member: Member | None,
    ) -> BiometricEventStatus:
        if not member:
            event.conflict_reason = "unknown_member"
            return BiometricEventStatus.CONFLICT

        open_attendance = self.db.execute(
            select(Attendance).where(
                and_(
                    Attendance.gym_id == tenant.gym_id,
                    Attendance.member_id == member.id,
                    Attendance.check_out_time.is_(None),
                )
            ).order_by(Attendance.check_in_time.desc())
        ).scalar_one_or_none()

        event_type = event.event_type
        if event_type == BiometricEventType.UNKNOWN:
            event_type = BiometricEventType.CHECK_OUT if open_attendance else BiometricEventType.CHECK_IN

        if event_type == BiometricEventType.CHECK_IN:
            latest_entry = self.db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.gym_id == tenant.gym_id,
                        Attendance.member_id == member.id,
                    )
                ).order_by(Attendance.check_in_time.desc())
            ).scalar_one_or_none()
            if latest_entry and abs((event.event_time - latest_entry.check_in_time).total_seconds()) <= 180:
                event.conflict_reason = "duplicate_punch"
                return BiometricEventStatus.DUPLICATE

            self.db.add(
                Attendance(
                    gym_id=tenant.gym_id,
                    member_id=member.id,
                    check_in_time=event.event_time,
                    check_out_time=None,
                    marked_by=None,
                )
            )
            return BiometricEventStatus.PROCESSED

        if not open_attendance:
            event.conflict_reason = "checkout_without_open_session"
            return BiometricEventStatus.CONFLICT

        if event.event_time < open_attendance.check_in_time:
            event.conflict_reason = "clock_drift_negative_duration"
            return BiometricEventStatus.CONFLICT

        open_attendance.check_out_time = event.event_time
        return BiometricEventStatus.PROCESSED
