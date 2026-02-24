from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import TenantDep, DbDep, require_manager_or_above
from app.automation.schemas import (
    AiOptimizeRequest,
    AiOptimizeResponse,
    CampaignDeliveryLogCreate,
    CampaignSummaryResponse,
    AutomationCampaignCreate,
    AutomationCampaignResponse,
)
from app.automation.service import AutomationService

router = APIRouter()


@router.get("/campaigns", response_model=list[AutomationCampaignResponse])
def list_campaigns(
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = AutomationService(db)
    return service.list_campaigns(tenant)


@router.post("/campaigns", response_model=AutomationCampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: AutomationCampaignCreate,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = AutomationService(db)
    return service.create_campaign(tenant, payload)


@router.post("/campaigns/ai-preview", response_model=AiOptimizeResponse)
def ai_preview(
    payload: AiOptimizeRequest,
    _: object = Depends(require_manager_or_above),
):
    optimized = AutomationService.optimize_message(payload)
    return AiOptimizeResponse(optimized_text=optimized)


@router.post("/campaigns/delivery-log", status_code=status.HTTP_201_CREATED)
def log_campaign_delivery(
    payload: CampaignDeliveryLogCreate,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = AutomationService(db)
    try:
        service.log_delivery(tenant, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"message": "Delivery log stored"}


@router.get("/campaigns/summary", response_model=CampaignSummaryResponse)
def campaign_summary(
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    service = AutomationService(db)
    return service.campaign_summary(tenant)
