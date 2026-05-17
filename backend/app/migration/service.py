"""Business logic for bulk data import and migration reconciliation."""

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models import (
    Attendance,
    BiometricDevice,
    BiometricEvent,
    DeviceUserMapping,
    Member,
    Membership,
    Payment,
    Plan,
)
from app.models.enums import BiometricEventStatus, BiometricEventType, MembershipStatus

from app.migration.schemas import (
    AttendanceImportRequest,
    AttendanceImportResult,
    BiometricSyncOverview,
    DeviceSyncStatus,
    DeviceUserMappingRequest,
    DeviceUserMappingResult,
    MemberImportRequest,
    MemberImportResult,
    MembershipImportRequest,
    MembershipImportResult,
    PaymentImportRequest,
    PaymentImportResult,
    PlanImportRequest,
    PlanImportResult,
    ReconciliationReport,
)


class MigrationService:
    def __init__(self, db: Session):
        self.db = db

    # ── Members ────────────────────────────────────────────────────

    def import_members(
        self, gym_id: uuid.UUID, req: MemberImportRequest
    ) -> MemberImportResult:
        created = 0
        skipped = 0
        errors: list[str] = []

        existing_phones: set[str] = set(
            self.db.execute(
                select(Member.phone).where(Member.gym_id == gym_id)
            ).scalars().all()
        )

        for idx, row in enumerate(req.members, start=1):
            if row.phone in existing_phones:
                if req.skip_duplicates:
                    skipped += 1
                    continue
                errors.append(f"Row {idx}: phone {row.phone} already exists")
                continue
            try:
                member = Member(
                    gym_id=gym_id,
                    name=row.name,
                    phone=row.phone,
                    email=row.email,
                    gender=row.gender,
                    date_of_birth=row.date_of_birth,
                    address=row.address,
                    joined_date=row.joined_date or date.today(),
                    member_code=row.member_code,
                    notes=row.notes,
                    emergency_contact_name=row.emergency_contact_name,
                    emergency_contact_phone=row.emergency_contact_phone,
                    is_active=True,
                )
                self.db.add(member)
                self.db.flush()
                existing_phones.add(row.phone)
                created += 1
            except Exception as exc:
                errors.append(f"Row {idx}: {exc}")

        self.db.commit()
        return MemberImportResult(
            total_received=len(req.members),
            created=created,
            skipped_duplicates=skipped,
            errors=errors,
        )

    # ── Plans ──────────────────────────────────────────────────────

    def import_plans(
        self, gym_id: uuid.UUID, req: PlanImportRequest
    ) -> PlanImportResult:
        created = 0
        skipped = 0
        errors: list[str] = []

        existing_names: set[str] = {
            n.lower()
            for n in self.db.execute(
                select(Plan.name).where(Plan.gym_id == gym_id)
            ).scalars().all()
        }

        for idx, row in enumerate(req.plans, start=1):
            if row.name.lower() in existing_names:
                skipped += 1
                continue
            try:
                plan = Plan(
                    gym_id=gym_id,
                    name=row.name,
                    description=row.description,
                    duration_days=row.duration_days,
                    price=row.price,
                    is_active=True,
                )
                self.db.add(plan)
                self.db.flush()
                existing_names.add(row.name.lower())
                created += 1
            except Exception as exc:
                errors.append(f"Row {idx}: {exc}")

        self.db.commit()
        return PlanImportResult(
            total_received=len(req.plans),
            created=created,
            skipped_duplicates=skipped,
            errors=errors,
        )

    # ── Memberships ────────────────────────────────────────────────

    def import_memberships(
        self, gym_id: uuid.UUID, req: MembershipImportRequest
    ) -> MembershipImportResult:
        created = 0
        skipped = 0
        errors: list[str] = []

        phone_to_member = self._phone_to_member_map(gym_id)
        name_to_plan = self._name_to_plan_map(gym_id)

        for idx, row in enumerate(req.memberships, start=1):
            member = phone_to_member.get(row.member_phone)
            if not member:
                errors.append(f"Row {idx}: member phone {row.member_phone} not found")
                continue

            plan_name = row.plan_name.strip() or self._derive_plan_name(row.start_date, row.end_date)
            plan = name_to_plan.get(plan_name.lower())
            if not plan:
                try:
                    duration_days = max((row.end_date - row.start_date).days + 1, 1)
                    plan = Plan(
                        gym_id=gym_id,
                        name=plan_name,
                        duration_days=duration_days,
                        price=row.amount_total,
                        description="Created during historical import",
                        is_active=True,
                    )
                    self.db.add(plan)
                    self.db.flush()
                    name_to_plan[plan_name.lower()] = plan
                except Exception as exc:
                    errors.append(f"Row {idx}: could not create plan '{plan_name}': {exc}")
                    continue

            try:
                membership = Membership(
                    gym_id=gym_id,
                    member_id=member.id,
                    plan_id=plan.id,
                    start_date=row.start_date,
                    end_date=row.end_date,
                    amount_total=row.amount_total,
                    amount_paid=row.amount_paid,
                    status=row.status,
                )
                self.db.add(membership)
                self.db.flush()
                created += 1
            except Exception as exc:
                errors.append(f"Row {idx}: {exc}")

        self.db.commit()
        return MembershipImportResult(
            total_received=len(req.memberships),
            created=created,
            skipped=skipped,
            errors=errors,
        )

    # ── Payments ───────────────────────────────────────────────────

    def import_payments(
        self, gym_id: uuid.UUID, req: PaymentImportRequest
    ) -> PaymentImportResult:
        created = 0
        skipped = 0
        errors: list[str] = []

        phone_to_member = self._phone_to_member_map(gym_id)

        for idx, row in enumerate(req.payments, start=1):
            member = phone_to_member.get(row.member_phone)
            if not member:
                errors.append(f"Row {idx}: member phone {row.member_phone} not found")
                continue

            try:
                payment = Payment(
                    gym_id=gym_id,
                    member_id=member.id,
                    amount=row.amount,
                    tax_amount=Decimal("0"),
                    payment_mode=row.payment_mode,
                    payment_date=row.payment_date,
                    reference_number=row.reference_number,
                    notes=row.notes or "Imported from old system",
                )
                self.db.add(payment)
                self.db.flush()
                created += 1
            except Exception as exc:
                errors.append(f"Row {idx}: {exc}")

        self.db.commit()
        return PaymentImportResult(
            total_received=len(req.payments),
            created=created,
            skipped=skipped,
            errors=errors,
        )

    # ── Historical attendance ──────────────────────────────────────

    def import_attendance(
        self, gym_id: uuid.UUID, req: AttendanceImportRequest
    ) -> AttendanceImportResult:
        created = 0
        skipped_unknown = 0
        skipped_dup = 0
        errors: list[str] = []

        code_to_member = self._code_to_member_map(gym_id)

        for idx, row in enumerate(req.records, start=1):
            member = code_to_member.get(row.person_identifier)
            if not member:
                skipped_unknown += 1
                continue

            ts = row.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            existing = self.db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.gym_id == gym_id,
                        Attendance.member_id == member.id,
                        Attendance.check_in_time == ts,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                skipped_dup += 1
                continue

            try:
                if row.punch_type in (BiometricEventType.CHECK_OUT,):
                    open_att = self.db.execute(
                        select(Attendance).where(
                            and_(
                                Attendance.gym_id == gym_id,
                                Attendance.member_id == member.id,
                                Attendance.check_out_time.is_(None),
                            )
                        ).order_by(Attendance.check_in_time.desc())
                    ).scalar_one_or_none()
                    if open_att and ts > open_att.check_in_time:
                        open_att.check_out_time = ts
                        created += 1
                        continue

                att = Attendance(
                    gym_id=gym_id,
                    member_id=member.id,
                    check_in_time=ts,
                    check_out_time=None,
                    marked_by=None,
                )
                self.db.add(att)
                self.db.flush()
                created += 1
            except Exception as exc:
                errors.append(f"Row {idx}: {exc}")

        self.db.commit()
        return AttendanceImportResult(
            total_received=len(req.records),
            created=created,
            skipped_unknown_member=skipped_unknown,
            skipped_duplicate=skipped_dup,
            errors=errors,
        )

    # ── Device-user mapping ────────────────────────────────────────

    def import_device_user_mappings(
        self, gym_id: uuid.UUID, req: DeviceUserMappingRequest
    ) -> DeviceUserMappingResult:
        created = 0
        updated = 0
        errors: list[str] = []

        device = self.db.execute(
            select(BiometricDevice).where(
                and_(
                    BiometricDevice.gym_id == gym_id,
                    BiometricDevice.id == req.device_id,
                )
            )
        ).scalar_one_or_none()
        if not device:
            return DeviceUserMappingResult(
                total_received=len(req.mappings), created=0, updated=0,
                errors=["Device not found"],
            )

        phone_to_member = self._phone_to_member_map(gym_id)

        for idx, row in enumerate(req.mappings, start=1):
            member = phone_to_member.get(row.member_phone)
            if not member:
                errors.append(f"Row {idx}: member phone {row.member_phone} not found")
                continue

            existing = self.db.execute(
                select(DeviceUserMapping).where(
                    and_(
                        DeviceUserMapping.gym_id == gym_id,
                        DeviceUserMapping.device_id == device.id,
                        DeviceUserMapping.device_user_id == row.device_user_id,
                    )
                )
            ).scalar_one_or_none()

            if existing:
                existing.member_id = member.id
                updated += 1
            else:
                mapping = DeviceUserMapping(
                    gym_id=gym_id,
                    device_id=device.id,
                    member_id=member.id,
                    device_user_id=row.device_user_id,
                )
                self.db.add(mapping)
                created += 1

            if not member.member_code:
                member.member_code = row.device_user_id

        self.db.commit()
        return DeviceUserMappingResult(
            total_received=len(req.mappings),
            created=created,
            updated=updated,
            errors=errors,
        )

    # ── Reconciliation ─────────────────────────────────────────────

    def reconciliation_report(
        self, gym_id: uuid.UUID, days: int = 30
    ) -> ReconciliationReport:
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=days)
        today = date.today()

        total_members = self.db.execute(
            select(func.count()).select_from(Member).where(
                Member.gym_id == gym_id,
            )
        ).scalar() or 0

        active_members = self.db.execute(
            select(func.count()).select_from(Member).where(
                and_(Member.gym_id == gym_id, Member.is_active == True)  # noqa: E712
            )
        ).scalar() or 0

        total_memberships = self.db.execute(
            select(func.count()).select_from(Membership).where(
                Membership.gym_id == gym_id,
            )
        ).scalar() or 0

        active_memberships = self.db.execute(
            select(func.count()).select_from(Membership).where(
                and_(
                    Membership.gym_id == gym_id,
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
            )
        ).scalar() or 0

        total_punches = self.db.execute(
            select(func.count()).select_from(Attendance).where(
                and_(
                    Attendance.gym_id == gym_id,
                    Attendance.check_in_time >= since,
                )
            )
        ).scalar() or 0

        total_payments = self.db.execute(
            select(func.count()).select_from(Payment).where(
                and_(
                    Payment.gym_id == gym_id,
                    Payment.payment_date >= (today - timedelta(days=days)),
                )
            )
        ).scalar() or 0

        total_revenue = self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                and_(
                    Payment.gym_id == gym_id,
                    Payment.payment_date >= (today - timedelta(days=days)),
                )
            )
        ).scalar() or Decimal("0")

        unmapped = self.db.execute(
            select(func.count()).select_from(BiometricEvent).where(
                and_(
                    BiometricEvent.gym_id == gym_id,
                    BiometricEvent.member_id.is_(None),
                    BiometricEvent.event_time >= since,
                )
            )
        ).scalar() or 0

        conflicts = self.db.execute(
            select(func.count()).select_from(BiometricEvent).where(
                and_(
                    BiometricEvent.gym_id == gym_id,
                    BiometricEvent.status == BiometricEventStatus.CONFLICT,
                    BiometricEvent.event_time >= since,
                )
            )
        ).scalar() or 0

        return ReconciliationReport(
            period_days=days,
            total_members=total_members,
            active_members=active_members,
            total_memberships=total_memberships,
            active_memberships=active_memberships,
            total_attendance_punches=total_punches,
            total_payments=total_payments,
            total_revenue=Decimal(str(total_revenue)),
            unmapped_device_users=unmapped,
            biometric_conflicts=conflicts,
        )

    # ── Biometric sync overview ────────────────────────────────────

    def biometric_sync_overview(self, gym_id: uuid.UUID) -> BiometricSyncOverview:
        devices: list[BiometricDevice] = list(
            self.db.execute(
                select(BiometricDevice).where(BiometricDevice.gym_id == gym_id)
                .order_by(BiometricDevice.created_at.desc())
            ).scalars().all()
        )

        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(hours=24)

        device_statuses: list[DeviceSyncStatus] = []
        last_event_global: datetime | None = None

        for dev in devices:
            mapped = self.db.execute(
                select(func.count()).select_from(DeviceUserMapping).where(
                    and_(
                        DeviceUserMapping.gym_id == gym_id,
                        DeviceUserMapping.device_id == dev.id,
                    )
                )
            ).scalar() or 0

            total_events = self.db.execute(
                select(func.count()).select_from(BiometricEvent).where(
                    BiometricEvent.device_id == dev.id,
                )
            ).scalar() or 0

            events_24h = self.db.execute(
                select(func.count()).select_from(BiometricEvent).where(
                    and_(
                        BiometricEvent.device_id == dev.id,
                        BiometricEvent.event_time >= yesterday,
                    )
                )
            ).scalar() or 0

            conflict_events = self.db.execute(
                select(func.count()).select_from(BiometricEvent).where(
                    and_(
                        BiometricEvent.device_id == dev.id,
                        BiometricEvent.status == BiometricEventStatus.CONFLICT,
                    )
                )
            ).scalar() or 0

            if dev.last_seen_at:
                if not last_event_global or dev.last_seen_at > last_event_global:
                    last_event_global = dev.last_seen_at

            device_statuses.append(DeviceSyncStatus(
                device_id=dev.id,
                device_name=dev.name,
                vendor=dev.vendor.value,
                is_active=dev.is_active,
                last_seen_at=dev.last_seen_at,
                mapped_members=mapped,
                total_events=total_events,
                events_last_24h=events_24h,
                conflict_events=conflict_events,
            ))

        active_count = sum(1 for d in device_statuses if d.is_active)
        total_mapped = sum(d.mapped_members for d in device_statuses)

        return BiometricSyncOverview(
            total_devices=len(devices),
            active_devices=active_count,
            total_mapped_members=total_mapped,
            last_event_at=last_event_global,
            devices=device_statuses,
        )

    # ── Helpers ────────────────────────────────────────────────────

    def _phone_to_member_map(self, gym_id: uuid.UUID) -> dict[str, Member]:
        members = self.db.execute(
            select(Member).where(Member.gym_id == gym_id)
        ).scalars().all()
        return {m.phone: m for m in members}

    def _code_to_member_map(self, gym_id: uuid.UUID) -> dict[str, Member]:
        members = self.db.execute(
            select(Member).where(
                and_(Member.gym_id == gym_id, Member.member_code.isnot(None))
            )
        ).scalars().all()
        return {m.member_code: m for m in members}

    def _name_to_plan_map(self, gym_id: uuid.UUID) -> dict[str, Plan]:
        plans = self.db.execute(
            select(Plan).where(Plan.gym_id == gym_id)
        ).scalars().all()
        return {p.name.lower(): p for p in plans}

    def _derive_plan_name(self, start_date: date, end_date: date) -> str:
        duration_days = max((end_date - start_date).days + 1, 1)
        if duration_days >= 360:
            return "Yearly"
        if duration_days >= 170:
            return "Half Yearly"
        if duration_days >= 80:
            return "Quarterly"
        return "Monthly"
