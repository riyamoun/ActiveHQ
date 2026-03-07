"""
Send automated WhatsApp/SMS from campaigns.
Uses templates with {{member_name}}, {{days_until_expiry}}, {{amount_due}}, etc.
Primary: WhatsApp. Fallback: SMS. Sender: config messaging_phone_number (9958040484).
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models import CampaignDeliveryLog, Member, Notification
from app.models.enums import (
    CampaignTriggerType,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)
from app.core.config import settings
from app.services.messaging import (
    send_email,
    send_whatsapp_interakt,
    send_whatsapp_then_sms,
    SendResult,
)


# Map campaign trigger to notification type for DB
TRIGGER_TO_NOTIFICATION_TYPE = {
    CampaignTriggerType.RENEWAL_REMINDER: NotificationType.EXPIRY_REMINDER,
    CampaignTriggerType.PAYMENT_FOLLOWUP: NotificationType.PAYMENT_DUE,
    CampaignTriggerType.INACTIVITY_NUDGE: NotificationType.CUSTOM,
    CampaignTriggerType.CUSTOM: NotificationType.CUSTOM,
}


def render_template(template: str, context: dict[str, Any]) -> str:
    """Replace {{key}} with context[key]. Keys case-sensitive."""
    out = template
    for key, value in context.items():
        out = out.replace(f"{{{{{key}}}}}", str(value))
    return out


def send_campaign_message(
    db: Session,
    *,
    gym_id: uuid.UUID,
    campaign_id: uuid.UUID,
    campaign_name: str,
    trigger_type: CampaignTriggerType,
    template_en: str,
    template_hi: str | None,
    member: Member,
    context: dict[str, Any],
    prefer_hindi: bool = False,
) -> SendResult:
    """
    Render template (EN or HI), send via WhatsApp then SMS fallback,
    create Notification and CampaignDeliveryLog.
    context: e.g. {"member_name": member.name, "days_until_expiry": 3, "amount_due": 500}
    """
    template = (template_hi or template_en) if prefer_hindi else template_en
    context.setdefault("member_name", member.name or "Member")
    context.setdefault("member_phone", member.phone or "")
    message = render_template(template, context)
    to_phone = (member.phone or "").strip()
    if not to_phone:
        return SendResult(
            success=False,
            channel="whatsapp",
            provider_message_id=None,
            error="Member has no phone",
        )
    # Interakt (WhatsApp template): use when API key + template name set
    result = None
    if settings.interakt_api_key.strip():
        if trigger_type == CampaignTriggerType.RENEWAL_REMINDER and settings.interakt_template_renewal.strip():
            body_values = [
                context.get("member_name", "Member"),
                str(context.get("days_until_expiry", "")),
                str(context.get("end_date", "")),
            ]
            result = send_whatsapp_interakt(
                to_phone,
                settings.interakt_template_renewal.strip(),
                body_values,
            )
        elif trigger_type == CampaignTriggerType.PAYMENT_FOLLOWUP and settings.interakt_template_payment_due.strip():
            body_values = [
                context.get("member_name", "Member"),
                str(context.get("amount_due", "")),
                str(context.get("end_date", "")),
            ]
            result = send_whatsapp_interakt(
                to_phone,
                settings.interakt_template_payment_due.strip(),
                body_values,
            )
    if result is None or not result.success:
        result = send_whatsapp_then_sms(to_phone, message)
    notif_type = TRIGGER_TO_NOTIFICATION_TYPE.get(trigger_type, NotificationType.CUSTOM)
    channel_enum = (
        NotificationChannel.WHATSAPP
        if result.channel == "whatsapp"
        else NotificationChannel.SMS
    )
    status = NotificationStatus.SENT if result.success else NotificationStatus.FAILED
    now = datetime.now(timezone.utc)
    notification = Notification(
        gym_id=gym_id,
        member_id=member.id,
        notification_type=notif_type,
        channel=channel_enum,
        message=message,
        status=status,
        sent_at=now if result.success else None,
        error_message=result.error,
        external_id=result.provider_message_id,
    )
    db.add(notification)
    db.flush()
    log = CampaignDeliveryLog(
        gym_id=gym_id,
        campaign_id=campaign_id,
        member_id=member.id,
        channel=channel_enum,
        status=status,
        provider_message_id=result.provider_message_id,
    )
    db.add(log)
    db.commit()
    return result


def send_campaign_message_email(
    db: Session,
    *,
    gym_id: uuid.UUID,
    campaign_id: uuid.UUID,
    campaign_name: str,
    trigger_type: CampaignTriggerType,
    template_en: str,
    member: Member,
    context: dict[str, Any],
    subject_prefix: str = "Reminder",
) -> SendResult:
    """
    Send reminder by email (free: GoDaddy/Gmail SMTP). Use when Twilio not configured.
    Member must have email. Logs Notification + CampaignDeliveryLog with channel=email.
    """
    context.setdefault("member_name", member.name or "Member")
    message = render_template(template_en, context)
    to_email = (member.email or "").strip()
    if not to_email or "@" not in to_email:
        return SendResult(
            success=False,
            channel="email",
            provider_message_id=None,
            error="Member has no email",
        )
    subject = f"{subject_prefix}: {campaign_name}"
    result = send_email(to_email, subject, message)
    notif_type = TRIGGER_TO_NOTIFICATION_TYPE.get(trigger_type, NotificationType.CUSTOM)
    status = NotificationStatus.SENT if result.success else NotificationStatus.FAILED
    now = datetime.now(timezone.utc)
    notification = Notification(
        gym_id=gym_id,
        member_id=member.id,
        notification_type=notif_type,
        channel=NotificationChannel.EMAIL,
        message=message,
        status=status,
        sent_at=now if result.success else None,
        error_message=result.error,
    )
    db.add(notification)
    db.flush()
    log = CampaignDeliveryLog(
        gym_id=gym_id,
        campaign_id=campaign_id,
        member_id=member.id,
        channel=NotificationChannel.EMAIL,
        status=status,
        provider_message_id=result.provider_message_id,
    )
    db.add(log)
    db.commit()
    return result
