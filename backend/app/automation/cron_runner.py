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


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


def run_renewal_and_payment_automation(db: Session) -> dict[str, Any]:
    """
    For each gym: find active campaigns (renewal_reminder, payment_followup),
    get expiring members / members with dues.
    - If Picky Assist configured: send WhatsApp then SMS (see messaging).
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


def run_inactivity_automation(db: Session, *, inactive_days: int = 7) -> dict[str, Any]:
    """
    For each gym: run INACTIVITY_NUDGE campaigns for members who haven't checked in recently.
    Uses latest Attendance.check_in_time.
    """
    from app.models import Attendance, AutomationCampaign, Gym, Member, Membership
    from sqlalchemy import func

    gyms = db.execute(select(Gym).where(Gym.is_active == True)).scalars().all()  # noqa: E712
    cutoff = datetime.now(timezone.utc) - timedelta(days=inactive_days)
    sent = 0
    failed = 0

    for gym in gyms:
        campaign = db.execute(
            select(AutomationCampaign).where(
                and_(
                    AutomationCampaign.gym_id == gym.id,
                    AutomationCampaign.is_active == True,  # noqa: E712
                    AutomationCampaign.trigger_type == CampaignTriggerType.INACTIVITY_NUDGE,
                )
            )
        ).scalar_one_or_none()
        if not campaign:
            continue

        # Latest check-in per member
        latest_rows = db.execute(
            select(Attendance.member_id, func.max(Attendance.check_in_time).label("last_seen"))
            .where(Attendance.gym_id == gym.id)
            .group_by(Attendance.member_id)
        ).all()
        last_seen_by_member = {mid: last_seen for mid, last_seen in latest_rows if last_seen}

        # Active members with active membership only
        active_members = db.execute(
            select(Member).where(
                and_(
                    Member.gym_id == gym.id,
                    Member.is_active == True,  # noqa: E712
                )
            )
        ).scalars().all()

        for member in active_members:
            last_seen = last_seen_by_member.get(member.id)
            if not last_seen:
                continue
            if last_seen >= cutoff:
                continue

            # Skip if no active membership (optional safety)
            active_membership = db.execute(
                select(Membership).where(
                    and_(
                        Membership.gym_id == gym.id,
                        Membership.member_id == member.id,
                        Membership.status == MembershipStatus.ACTIVE,
                    )
                ).order_by(Membership.end_date.desc())
            ).scalar_one_or_none()
            if not active_membership:
                continue

            days_inactive = int((datetime.now(timezone.utc) - last_seen).total_seconds() // 86400)
            context = {
                "member_name": member.name or "Member",
                "days_inactive": days_inactive,
                "last_seen": last_seen.date().isoformat(),
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

    return {"gyms_processed": len(gyms), "inactive_days": inactive_days, "messages_sent": sent, "messages_failed": failed}


def run_expiry_followup_automation(db: Session, *, lookback_days: int = 30) -> dict[str, Any]:
    """
    For each gym: run EXPIRY_FOLLOWUP campaigns for members whose membership
    has already expired (within the last `lookback_days` days).
    Sends one WhatsApp reminder per member per day.
    """
    from app.models import Membership, Notification
    from app.models.enums import NotificationType

    gyms = db.execute(select(Gym).where(Gym.is_active == True)).scalars().all()  # noqa: E712
    today = date.today()
    cutoff_date = today - timedelta(days=lookback_days)
    sent = 0
    failed = 0
    skipped = 0

    for gym in gyms:
        campaign = db.execute(
            select(AutomationCampaign).where(
                and_(
                    AutomationCampaign.gym_id == gym.id,
                    AutomationCampaign.is_active == True,  # noqa: E712
                    AutomationCampaign.trigger_type == CampaignTriggerType.EXPIRY_FOLLOWUP,
                )
            )
        ).scalar_one_or_none()
        if not campaign:
            continue

        # Find members with expired memberships (expired within last N days)
        expired_rows = db.execute(
            select(Membership, Member).join(
                Member,
                and_(
                    Member.id == Membership.member_id,
                    Member.gym_id == gym.id,
                    Member.is_active == True,  # noqa: E712
                ),
            ).where(
                Membership.gym_id == gym.id,
                Membership.status == MembershipStatus.EXPIRED,
                Membership.end_date >= cutoff_date,
                Membership.end_date < today,
            )
        ).all()

        # Deduplicate: skip if we already sent an expiry followup today
        seen: set[uuid.UUID] = set()
        for membership, member in expired_rows:
            if member.id in seen:
                continue
            seen.add(member.id)

            # Check if we already sent this member a followup today
            today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
            already_sent_today = db.execute(
                select(Notification).where(
                    and_(
                        Notification.gym_id == gym.id,
                        Notification.member_id == member.id,
                        Notification.notification_type == NotificationType.EXPIRY_FOLLOWUP,
                        Notification.sent_at >= today_start,
                    )
                )
            ).scalar_one_or_none()
            if already_sent_today:
                skipped += 1
                continue

            days_since_expiry = (today - membership.end_date).days
            context = {
                "member_name": member.name or "Member",
                "end_date": str(membership.end_date),
                "days_since_expiry": days_since_expiry,
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

    return {
        "gyms_processed": len(gyms),
        "lookback_days": lookback_days,
        "messages_sent": sent,
        "messages_failed": failed,
        "messages_skipped_already_sent_today": skipped,
    }


def run_all_automation(db: Session) -> dict[str, Any]:
    base = run_renewal_and_payment_automation(db)
    inactivity = run_inactivity_automation(db, inactive_days=7)
    expiry_followup = run_expiry_followup_automation(db, lookback_days=30)
    return {"renewal_payment": base, "inactivity": inactivity, "expiry_followup": expiry_followup}

