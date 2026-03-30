from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import TenantDep, require_manager_or_above, DbDep, BiometricDeviceTenantDep
from app.biometric.schemas import (
    BiometricDeviceCreate,
    BiometricDeviceResponse,
    BiometricDeviceTokenResponse,
    BiometricEventIngestRequest,
    BiometricIngestSummary,
)
from app.biometric.service import BiometricService

router = APIRouter()


@router.get("/devices", response_model=list[BiometricDeviceResponse])
def list_devices(
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    return service.list_devices(tenant)


@router.post("/devices", response_model=BiometricDeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: BiometricDeviceCreate,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    device = service.create_device(tenant, payload)
    resp = BiometricDeviceResponse(**device.to_dict(), has_ingest_token=bool(device.ingest_token_hash))
    return resp


@router.post("/devices/{device_id}/token", response_model=BiometricDeviceTokenResponse)
def rotate_device_token(
    device_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = BiometricService(db)
    import uuid
    try:
        device_uuid = uuid.UUID(device_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid device id") from exc
    try:
        device, token = service.rotate_ingest_token(tenant, device_uuid)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return BiometricDeviceTokenResponse(device_id=device.id, ingest_token=token)


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
