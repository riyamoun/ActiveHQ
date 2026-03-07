"""
Reminder list for manual send — zero cost.
Returns expiring + dues members with pre-filled message text.
Staff copies and sends from their own WhatsApp/SMS. No Twilio/API cost.
"""

import uuid
from datetime import date, timedelta
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models import AutomationCampaign, Member, Membership
from app.models.enums import CampaignTriggerType, MembershipStatus
from app.automation.send_service import render_template


def get_reminder_list(
    db: Session,
    gym_id: uuid.UUID,
    *,
    expiring_days: int = 7,
) -> dict[str, Any]:
    """
    Build list of members to remind (expiring + dues) with rendered message text
    per campaign. No sending — for manual copy-paste to WhatsApp/SMS.
    """
    today = date.today()
    campaigns = db.execute(
        select(AutomationCampaign).where(
            and_(
                AutomationCampaign.gym_id == gym_id,
                AutomationCampaign.is_active == True,  # noqa: E712
                AutomationCampaign.trigger_type.in_([
                    CampaignTriggerType.RENEWAL_REMINDER,
                    CampaignTriggerType.PAYMENT_FOLLOWUP,
                ]),
            )
        )
    ).scalars().all()
    expiring_rows = db.execute(
        select(Membership, Member).join(
            Member,
            and_(
                Member.id == Membership.member_id,
                Member.gym_id == gym_id,
                Member.is_active == True,  # noqa: E712
            ),
        ).where(
            Membership.gym_id == gym_id,
            Membership.status == MembershipStatus.ACTIVE,
            Membership.end_date >= today,
            Membership.end_date <= today + timedelta(days=expiring_days),
        )
    ).all()
    dues_rows = db.execute(
        select(Membership, Member).join(
            Member,
            and_(
                Member.id == Membership.member_id,
                Member.gym_id == gym_id,
                Member.is_active == True,  # noqa: E712
            ),
        ).where(
            Membership.gym_id == gym_id,
            Membership.amount_total > Membership.amount_paid,
        )
    ).all()
    # Build by member: one row per member, messages list (one per campaign)
    expiring_by_member: dict[uuid.UUID, dict[str, Any]] = {}
    dues_by_member: dict[uuid.UUID, dict[str, Any]] = {}
    for campaign in campaigns:
        if campaign.trigger_type == CampaignTriggerType.RENEWAL_REMINDER:
            for membership, member in expiring_rows:
                days_left = (membership.end_date - today).days
                context = {
                    "member_name": member.name or "Member",
                    "days_until_expiry": days_left,
                    "end_date": str(membership.end_date),
                    "amount_due": float(membership.amount_total - membership.amount_paid),
                }
                message_text = render_template(campaign.template_en, context)
                if member.id not in expiring_by_member:
                    expiring_by_member[member.id] = {
                        "member_id": str(member.id),
                        "member_name": member.name or "",
                        "phone": member.phone or "",
                        "days_until_expiry": days_left,
                        "end_date": str(membership.end_date),
                        "messages": [],
                    }
                expiring_by_member[member.id]["messages"].append({
                    "campaign_name": campaign.name,
                    "message_text": message_text,
                })
        elif campaign.trigger_type == CampaignTriggerType.PAYMENT_FOLLOWUP:
            for membership, member in dues_rows:
                amount_due = float(membership.amount_total - membership.amount_paid)
                if amount_due <= 0:
                    continue
                context = {
                    "member_name": member.name or "Member",
                    "amount_due": amount_due,
                    "end_date": str(membership.end_date),
                }
                message_text = render_template(campaign.template_en, context)
                if member.id not in dues_by_member:
                    dues_by_member[member.id] = {
                        "member_id": str(member.id),
                        "member_name": member.name or "",
                        "phone": member.phone or "",
                        "amount_due": amount_due,
                        "end_date": str(membership.end_date),
                        "messages": [],
                    }
                dues_by_member[member.id]["messages"].append({
                    "campaign_name": campaign.name,
                    "message_text": message_text,
                })
    return {
        "expiring": list(expiring_by_member.values()),
        "dues": list(dues_by_member.values()),
    }
