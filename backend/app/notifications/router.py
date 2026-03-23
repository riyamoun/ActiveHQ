"""
Notification API endpoints: Send SMS, Email, WhatsApp to members.
Bulk sends, history, and statistics.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.auth.dependencies import TenantDep, DbDep, require_manager_or_above
from app.models.enums import NotificationChannel, NotificationType
from app.notifications.service import NotificationService
from app.core.logger import logger

router = APIRouter()


# Request models
class SendSMSRequest(BaseModel):
    """Send SMS to a member."""
    member_id: uuid.UUID
    message: str = Field(..., min_length=1, max_length=1000)


class SendEmailRequest(BaseModel):
    """Send email to a member."""
    member_id: uuid.UUID
    subject: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=5000)


class SendWhatsAppRequest(BaseModel):
    """Send WhatsApp (with SMS fallback) to a member."""
    member_id: uuid.UUID
    message: str = Field(..., min_length=1, max_length=1000)


class BulkSMSRequest(BaseModel):
    """Send SMS to multiple members."""
    member_ids: list[uuid.UUID] = Field(..., min_length=1)
    message: str = Field(..., min_length=1, max_length=1000)


class BulkEmailRequest(BaseModel):
    """Send email to multiple members."""
    member_ids: list[uuid.UUID] = Field(..., min_length=1)
    subject: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=5000)


class BulkWhatsAppRequest(BaseModel):
    """Send WhatsApp to multiple members."""
    member_ids: list[uuid.UUID] = Field(..., min_length=1)
    message: str = Field(..., min_length=1, max_length=1000)


@router.post("/notifications/sms", status_code=status.HTTP_200_OK)
def send_sms(
    payload: SendSMSRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Send SMS to a single member."""
    service = NotificationService(db)
    result = service.send_sms_to_member(
        tenant.gym_id,
        payload.member_id,
        payload.message,
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to send SMS"),
        )
    
    logger.info(f"SMS sent to member {payload.member_id}")
    return result


@router.post("/notifications/email", status_code=status.HTTP_200_OK)
def send_email(
    payload: SendEmailRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Send email to a single member."""
    service = NotificationService(db)
    result = service.send_email_to_member(
        tenant.gym_id,
        payload.member_id,
        payload.subject,
        payload.body,
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to send email"),
        )
    
    logger.info(f"Email sent to member {payload.member_id}")
    return result


@router.post("/notifications/whatsapp", status_code=status.HTTP_200_OK)
def send_whatsapp(
    payload: SendWhatsAppRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Send WhatsApp (or SMS fallback) to a single member."""
    service = NotificationService(db)
    result = service.send_whatsapp_to_member(
        tenant.gym_id,
        payload.member_id,
        payload.message,
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to send message"),
        )
    
    logger.info(f"Message sent to member {payload.member_id} via {result['channel']}")
    return result


@router.post("/notifications/bulk-sms", status_code=status.HTTP_200_OK)
def bulk_sms(
    payload: BulkSMSRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Send SMS to multiple members."""
    if not payload.member_ids:
        raise HTTPException(status_code=400, detail="member_ids cannot be empty")
    
    service = NotificationService(db)
    result = service.send_bulk_sms(
        tenant.gym_id,
        payload.member_ids,
        payload.message,
    )
    
    logger.info(f"Bulk SMS: {result['sent']}/{result['total']} sent")
    return result


@router.post("/notifications/bulk-email", status_code=status.HTTP_200_OK)
def bulk_email(
    payload: BulkEmailRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Send email to multiple members."""
    if not payload.member_ids:
        raise HTTPException(status_code=400, detail="member_ids cannot be empty")
    
    service = NotificationService(db)
    result = service.send_bulk_email(
        tenant.gym_id,
        payload.member_ids,
        payload.subject,
        payload.body,
    )
    
    logger.info(f"Bulk email: {result['sent']}/{result['total']} sent")
    return result


@router.post("/notifications/bulk-whatsapp", status_code=status.HTTP_200_OK)
def bulk_whatsapp(
    payload: BulkWhatsAppRequest,
    tenant: TenantDep,
    db: DbDep,
    _: object = Depends(require_manager_or_above),
):
    """Send WhatsApp (or SMS fallback) to multiple members."""
    if not payload.member_ids:
        raise HTTPException(status_code=400, detail="member_ids cannot be empty")
    
    service = NotificationService(db)
    result = service.send_bulk_whatsapp(
        tenant.gym_id,
        payload.member_ids,
        payload.message,
    )
    
    logger.info(f"Bulk WhatsApp: {result['sent']}/{result['total']} sent")
    return result


@router.get("/notifications/history", status_code=status.HTTP_200_OK)
def notification_history(
    tenant: TenantDep,
    db: DbDep,
    member_id: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    _: object = Depends(require_manager_or_above),
):
    """Get notification history for gym or specific member."""
    service = NotificationService(db)
    
    member_uuid = None
    if member_id:
        try:
            member_uuid = uuid.UUID(member_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid member_id format")
    
    notification_channel = None
    if channel:
        try:
            notification_channel = NotificationChannel(channel)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid channel: {channel}")
    
    history = service.get_notification_history(
        tenant.gym_id,
        member_id=member_uuid,
        channel=notification_channel,
        limit=limit,
    )
    
    return {"total": len(history), "notifications": history}


@router.get("/notifications/stats", status_code=status.HTTP_200_OK)
def notification_stats(
    tenant: TenantDep,
    db: DbDep,
    days: int = Query(7, ge=1, le=90),
    _: object = Depends(require_manager_or_above),
):
    """Get notification statistics for the past N days."""
    service = NotificationService(db)
    stats = service.get_notification_stats(tenant.gym_id, days=days)
    
    return {
        "days": days,
        "stats": stats,
    }


@router.post("/notifications/retry-failed", status_code=status.HTTP_200_OK)
def retry_failed_notifications(
    tenant: TenantDep,
    db: DbDep,
    hours: int = Query(24, ge=1, le=720),
    _: object = Depends(require_manager_or_above),
):
    """Retry sending failed notifications from the last N hours."""
    service = NotificationService(db)
    result = service.resend_failed_notifications(tenant.gym_id, hours=hours)
    
    logger.info(f"Retried {result['retried']} notifications, {result['succeeded']} succeeded")
    return result
