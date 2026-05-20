import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import TenantDep, require_manager_or_above, DbDep, BiometricDeviceTenantDep
from app.biometric.schemas import (
    BiometricConflictEventResponse,
    BiometricDeviceCreate,
    BiometricDeviceResponse,
    BiometricDeviceTokenResponse,
    BiometricEventIngestRequest,
    BiometricIngestSummary,
    DeviceUserMappingCreate,
    DeviceUserMappingResponse,
)
from app.biometric.service import BiometricService
from app.models import Member

router = APIRouter()


@router.get("/devices", response_model=list[BiometricDeviceResponse])
def list_devices(
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    return [service.device_to_response(d) for d in service.list_devices(tenant)]


@router.post("/devices", response_model=BiometricDeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: BiometricDeviceCreate,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    device = service.create_device(tenant, payload)
    return service.device_to_response(device)


@router.post("/devices/{device_id}/token", response_model=BiometricDeviceTokenResponse)
def rotate_device_token(
    device_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid device id") from exc
    try:
        device, token = service.rotate_ingest_token(tenant, device_uuid)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return BiometricDeviceTokenResponse(device_id=device.id, ingest_token=token)


@router.get("/mappings", response_model=list[DeviceUserMappingResponse])
def list_mappings(
    tenant: TenantDep,
    db: DbDep,
    device_id: str = Query(..., description="Biometric device UUID"),
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid device id") from exc
    rows = service.list_device_mappings(tenant, device_uuid)
    return [DeviceUserMappingResponse(**r) for r in rows]


@router.post("/mappings", response_model=DeviceUserMappingResponse, status_code=status.HTTP_201_CREATED)
def upsert_mapping(
    payload: DeviceUserMappingCreate,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    try:
        mapping = service.upsert_device_mapping(
            tenant,
            device_id=payload.device_id,
            member_id=payload.member_id,
            device_user_id=payload.device_user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    member = db.get(Member, payload.member_id)
    return DeviceUserMappingResponse(
        id=mapping.id,
        device_id=mapping.device_id,
        member_id=mapping.member_id,
        device_user_id=mapping.device_user_id,
        member_name=member.name if member else None,
        member_phone=member.phone if member else None,
    )


@router.delete("/mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mapping(
    mapping_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    try:
        mapping_uuid = uuid.UUID(mapping_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid mapping id") from exc
    if not service.delete_device_mapping(tenant, mapping_uuid):
        raise HTTPException(status_code=404, detail="Mapping not found")


@router.get("/events/conflicts", response_model=list[BiometricConflictEventResponse])
def list_conflict_events(
    tenant: TenantDep,
    db: DbDep,
    limit: int = Query(50, ge=1, le=200),
    device_id: str | None = Query(None),
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    device_uuid = None
    if device_id:
        try:
            device_uuid = uuid.UUID(device_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid device id") from exc
    events = service.list_conflict_events(tenant, limit=limit, device_id=device_uuid)
    return [
        BiometricConflictEventResponse(
            id=e.id,
            device_id=e.device_id,
            person_identifier=e.person_identifier,
            event_time=e.event_time,
            conflict_reason=e.conflict_reason,
            member_id=e.member_id,
        )
        for e in events
    ]


@router.post("/events/ingest", response_model=BiometricIngestSummary)
def ingest_events(
    payload: BiometricEventIngestRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    try:
        return service.ingest_events(tenant, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/events/ingest-device", response_model=BiometricIngestSummary)
def ingest_events_device(
    payload: BiometricEventIngestRequest,
    tenant: BiometricDeviceTenantDep,
    db: DbDep,
):
    service = BiometricService(db)
    try:
        return service.ingest_events(tenant, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
