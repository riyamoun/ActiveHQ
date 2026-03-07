"""
Run automated campaign sends: renewal reminders + payment due.
Call from Render Cron or external scheduler (e.g. every day 9 AM).
Protected by CRON_SECRET.
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import AutomationCampaign, Gym, Member
from app.models.enums import CampaignTriggerType, MembershipStatus
from app.automation.send_service import send_campaign_message, send_campaign_message_email


def _interakt_configured() -> bool:
    return bool(settings.interakt_api_key and settings.interakt_template_renewal and settings.interakt_template_payment_due)

def _twilio_configured() -> bool:
    return bool(settings.twilio_account_sid and settings.twilio_auth_token)


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


def run_renewal_and_payment_automation(db: Session) -> dict[str, Any]:
    """
    For each gym: find active campaigns (renewal_reminder, payment_followup),
    get expiring members / members with dues.
    - If Twilio configured: send WhatsApp then SMS.
    - Else if SMTP configured: send email (members with email only). Free.
    - Else: skip send (use GET /automation/reminder-list for manual copy-paste).
    Returns counts: gyms_processed, messages_sent, messages_failed.
    """
    gyms = db.execute(select(Gym).where(Gym.is_active == True)).scalars().all()  # noqa: E712
    today = date.today()
    sent = 0
    failed = 0
    for gym in gyms:
        campaigns = db.execute(
            select(AutomationCampaign).where(
                and_(
                    AutomationCampaign.gym_id == gym.id,
                    AutomationCampaign.is_active == True,  # noqa: E712
                    AutomationCampaign.trigger_type.in_([
                        CampaignTriggerType.RENEWAL_REMINDER,
                        CampaignTriggerType.PAYMENT_FOLLOWUP,
                    ]),
                )
            )
        ).scalars().all()
        if not campaigns:
            continue
        # Expiring members (next 7 days)
        from app.models import Membership
        expiring_rows = db.execute(
            select(Membership, Member).join(
                Member,
                and_(
                    Member.id == Membership.member_id,
                    Member.gym_id == gym.id,
                    Member.is_active == True,  # noqa: E712
                ),
            ).where(
                Membership.gym_id == gym.id,
                Membership.status == MembershipStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= today + timedelta(days=7),
            )
        ).all()
        # Members with dues
        dues_rows = db.execute(
            select(Membership, Member).join(
                Member,
                and_(
                    Member.id == Membership.member_id,
                    Member.gym_id == gym.id,
                    Member.is_active == True,  # noqa: E712
                ),
            ).where(
                Membership.gym_id == gym.id,
                Membership.amount_total > Membership.amount_paid,
            )
        ).all()
        # Dedupe by member_id so one message per member per campaign per run
        seen_renewal: set[uuid.UUID] = set()
        seen_dues: set[uuid.UUID] = set()
        for campaign in campaigns:
            if campaign.trigger_type == CampaignTriggerType.RENEWAL_REMINDER:
                for membership, member in expiring_rows:
                    if member.id in seen_renewal:
                        continue
                    seen_renewal.add(member.id)
                    days_left = (membership.end_date - today).days
                    context = {
                        "member_name": member.name or "Member",
                        "days_until_expiry": days_left,
                        "end_date": str(membership.end_date),
                        "amount_due": float(membership.amount_total - membership.amount_paid),
                    }
                    result = send_campaign_message(
                        db,
                        gym_id=gym.id,
                        campaign_id=campaign.id,
                        campaign_name=campaign.name,
                        trigger_type=campaign.trigger_type,
                        template_en=campaign.template_en,
                        template_hi=campaign.template_hi,
                        member=member,
                        context=context,
                    )
                    if result.success:
                        sent += 1
                    else:
                        failed += 1
            elif campaign.trigger_type == CampaignTriggerType.PAYMENT_FOLLOWUP:
                for membership, member in dues_rows:
                    if member.id in seen_dues:
                        continue
                    amount_due = float(membership.amount_total - membership.amount_paid)
                    if amount_due <= 0:
                        continue
                    seen_dues.add(member.id)
                    context = {
                        "member_name": member.name or "Member",
                        "amount_due": amount_due,
                        "end_date": str(membership.end_date),
                    }
                    result = send_campaign_message(
                        db,
                        gym_id=gym.id,
                        campaign_id=campaign.id,
                        campaign_name=campaign.name,
                        trigger_type=campaign.trigger_type,
                        template_en=campaign.template_en,
                        template_hi=campaign.template_hi,
                        member=member,
                        context=context,
                    )
                    if result.success:
                        sent += 1
                    else:
                        failed += 1
    return {"gyms_processed": len(gyms), "messages_sent": sent, "messages_failed": failed}
