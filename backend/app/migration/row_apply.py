"""Apply import row fields onto Member / Membership ORM instances."""

from datetime import date
from decimal import Decimal

from app.migration.phone_utils import normalize_phone
from app.migration.schemas import MemberImportRow, MembershipImportRow
from app.models import Member, Membership
from app.models.enums import MembershipStatus


def _merge_str(current: str | None, new: str | None) -> str | None:
    if new is not None and str(new).strip():
        return str(new).strip()
    return current


def apply_member_import_row(member: Member, row: MemberImportRow, *, is_create: bool) -> None:
    """Merge import row onto member; empty CSV cells do not wipe existing data."""
    member.name = _merge_str(member.name, row.name) or member.name
    if row.email is not None:
        member.email = _merge_str(member.email, row.email)
    if row.gender is not None:
        member.gender = row.gender
    if row.date_of_birth is not None:
        member.date_of_birth = row.date_of_birth
    if row.address is not None:
        member.address = _merge_str(member.address, row.address)
    if row.city is not None:
        member.city = _merge_str(member.city, row.city)
    if row.state is not None:
        member.state = _merge_str(member.state, row.state)
    if row.pincode is not None:
        member.pincode = _merge_str(member.pincode, row.pincode)
    if row.emergency_contact_name is not None:
        member.emergency_contact_name = _merge_str(member.emergency_contact_name, row.emergency_contact_name)
    if row.emergency_contact_phone is not None:
        member.emergency_contact_phone = normalize_phone(row.emergency_contact_phone) or member.emergency_contact_phone
    if row.member_code is not None:
        member.member_code = _merge_str(member.member_code, row.member_code)
    if row.external_id is not None:
        member.external_id = _merge_str(member.external_id, row.external_id)
    if row.notes is not None:
        member.notes = _merge_str(member.notes, row.notes)
    if row.remarks is not None:
        member.remarks = _merge_str(member.remarks, row.remarks)
    if row.source_system is not None:
        member.source_system = _merge_str(member.source_system, row.source_system)
    if row.enrollment_status is not None:
        member.enrollment_status = row.enrollment_status.strip().upper()
    if row.aadhaar_verified is not None:
        member.aadhaar_verified = row.aadhaar_verified

    alt = normalize_phone(row.alternate_phone) if row.alternate_phone else None
    if not alt and row.alternative_phone:
        alt = normalize_phone(row.alternative_phone)
    if alt:
        if is_create or not member.alternate_phone:
            member.alternate_phone = alt
        elif not member.alternative_phone:
            member.alternative_phone = alt

    if row.import_metadata:
        base = dict(member.import_metadata or {})
        base.update(row.import_metadata)
        member.import_metadata = base

    if is_create:
        member.joined_date = row.joined_date or date.today()
        member.is_active = True
        if row.enrollment_status:
            member.enrollment_status = row.enrollment_status.strip().upper()
        else:
            member.enrollment_status = member.enrollment_status or "ACTIVE"


def build_member_from_import(gym_id, row: MemberImportRow, phone: str) -> Member:
    member = Member(
        gym_id=gym_id,
        name=row.name.strip(),
        phone=phone,
        biometric_enrolled=False,
        aadhaar_verified=row.aadhaar_verified or False,
    )
    apply_member_import_row(member, row, is_create=True)
    return member


def apply_membership_import_row(membership: Membership, row: MembershipImportRow) -> None:
    membership.start_date = row.start_date
    membership.end_date = row.end_date
    membership.amount_total = row.amount_total
    membership.amount_paid = row.amount_paid
    membership.status = row.status
    if row.renewal_date is not None:
        membership.renewal_date = row.renewal_date
    if row.freeze_start_date is not None:
        membership.freeze_start_date = row.freeze_start_date
    if row.freeze_end_date is not None:
        membership.freeze_end_date = row.freeze_end_date
    if row.discount_amount is not None:
        membership.discount_amount = row.discount_amount
    if row.payment_method is not None:
        membership.payment_method = row.payment_method
    if row.auto_renewal is not None:
        membership.auto_renewal = row.auto_renewal
    if row.import_ref is not None:
        membership.import_ref = row.import_ref.strip()
    if row.source_system is not None:
        membership.source_system = row.source_system.strip()
