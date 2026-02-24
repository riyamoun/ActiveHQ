from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import TenantDep, require_manager_or_above, DbDep
from app.biometric.schemas import (
    BiometricDeviceCreate,
    BiometricDeviceResponse,
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
    return service.create_device(tenant, payload)


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
