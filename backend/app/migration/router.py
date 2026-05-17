"""API endpoints for bulk data import and migration."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import TenantDep, DbDep, require_manager_or_above
from app.migration.schemas import (
    AttendanceImportRequest,
    AttendanceImportResult,
    BiometricSyncOverview,
    DeviceUserMappingRequest,
    DeviceUserMappingResult,
    ImportPreviewResult,
    MemberImportRequest,
    MemberImportResult,
    MembershipImportRequest,
    MembershipImportResult,
    PaymentImportRequest,
    PaymentImportResult,
    PlanImportRequest,
    PlanImportResult,
    ReconciliationReport,
    ReconciliationRequest,
)
from app.migration.service import MigrationService

router = APIRouter()


@router.post("/members/preview", response_model=ImportPreviewResult)
def preview_members(
    payload: MemberImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Dry-run member import — shows create / skip / error per row without writing."""
    return MigrationService(db).preview_members(tenant.gym_id, payload)


@router.post("/members", response_model=MemberImportResult)
def import_members(
    payload: MemberImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Bulk-import members from an old system.

    Send up to 2 000 member records per call.
    Duplicate phones are skipped (or rejected) based on `skip_duplicates`.
    Set `member_code` to the device user ID so biometric attendance maps correctly.
    """
    svc = MigrationService(db)
    return svc.import_members(tenant.gym_id, payload)


@router.post("/plans/preview", response_model=ImportPreviewResult)
def preview_plans(
    payload: PlanImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    return MigrationService(db).preview_plans(tenant.gym_id, payload)


@router.post("/plans", response_model=PlanImportResult)
def import_plans(
    payload: PlanImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Bulk-import membership plans. Duplicate names are skipped."""
    svc = MigrationService(db)
    return svc.import_plans(tenant.gym_id, payload)


@router.post("/memberships/preview", response_model=ImportPreviewResult)
def preview_memberships(
    payload: MembershipImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    return MigrationService(db).preview_memberships(tenant.gym_id, payload)


@router.post("/memberships", response_model=MembershipImportResult)
def import_memberships(
    payload: MembershipImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Bulk-import memberships. Resolves members by phone and plans by name."""
    svc = MigrationService(db)
    return svc.import_memberships(tenant.gym_id, payload)


@router.post("/payments", response_model=PaymentImportResult)
def import_payments(
    payload: PaymentImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Bulk-import historical payments. Resolves members by phone."""
    svc = MigrationService(db)
    return svc.import_payments(tenant.gym_id, payload)


@router.post("/attendance/preview", response_model=ImportPreviewResult)
def preview_attendance(
    payload: AttendanceImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    return MigrationService(db).preview_attendance(tenant.gym_id, payload)


@router.post("/attendance", response_model=AttendanceImportResult)
def import_attendance(
    payload: AttendanceImportRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Bulk-import historical attendance from device CSV / old software export.

    Resolves members by `person_identifier` → `Member.member_code`.
    Up to 10 000 records per call.
    """
    svc = MigrationService(db)
    return svc.import_attendance(tenant.gym_id, payload)


@router.post("/device-mappings", response_model=DeviceUserMappingResult)
def import_device_user_mappings(
    payload: DeviceUserMappingRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Map device user IDs to ActiveHQ members.

    Also sets `member_code` on each member if not already set.
    """
    svc = MigrationService(db)
    return svc.import_device_user_mappings(tenant.gym_id, payload)


@router.post("/reconciliation", response_model=ReconciliationReport)
def reconciliation_report(
    payload: ReconciliationRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Generate a reconciliation report for validating imported data.

    Compares totals (members, memberships, punches, revenue) over the
    requested look-back window so the gym owner can cross-check against
    the old system before cutover.
    """
    svc = MigrationService(db)
    return svc.reconciliation_report(tenant.gym_id, payload.days)


@router.get("/biometric-sync", response_model=BiometricSyncOverview)
def biometric_sync_overview(
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Biometric sync dashboard: device status, event counts, mapped members."""
    svc = MigrationService(db)
    return svc.biometric_sync_overview(tenant.gym_id)
