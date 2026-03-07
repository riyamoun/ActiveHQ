from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import settings
from app.auth.dependencies import TenantDep, DbDep, require_manager_or_above
from app.automation.cron_runner import run_renewal_and_payment_automation
from app.automation.reminder_list import get_reminder_list
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


@router.get("/reminder-list")
def reminder_list(
    tenant: TenantDep,
    db: DbDep,
    expiring_days: int = Query(7, ge=1, le=30),
    _: object = Depends(require_manager_or_above),
):
    """
    Get list of members to remind (expiring + dues) with pre-filled message text.
    Zero cost: copy message and send from your own WhatsApp/SMS. No Twilio needed.
    """
    return get_reminder_list(db, tenant.gym_id, expiring_days=expiring_days)


@router.get("/run-cron")
def run_cron(
    db: DbDep,
    secret: str = Query(..., description="CRON_SECRET"),
):
    """
    Run renewal + payment-due automation (WhatsApp/SMS).
    Call from Render Cron or external scheduler (e.g. daily 9 AM).
    Requires: ?secret=<CRON_SECRET>
    """
    if not settings.cron_secret or secret != settings.cron_secret:
        raise HTTPException(status_code=403, detail="Invalid or missing cron secret")
    result = run_renewal_and_payment_automation(db)
    return result
