from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import TenantContext
from app.automation.schemas import (
    AiOptimizeRequest,
    CampaignDeliveryLogCreate,
    CampaignSummaryResponse,
    AutomationCampaignCreate,
)
from app.models import AutomationCampaign, CampaignDeliveryLog
from app.models.enums import NotificationStatus


class AutomationService:
    def __init__(self, db: Session):
        self.db = db

    def list_campaigns(self, tenant: TenantContext) -> list[AutomationCampaign]:
        return self.db.execute(
            select(AutomationCampaign)
            .where(AutomationCampaign.gym_id == tenant.gym_id)
            .order_by(AutomationCampaign.created_at.desc())
        ).scalars().all()

    def create_campaign(self, tenant: TenantContext, payload: AutomationCampaignCreate) -> AutomationCampaign:
        campaign = AutomationCampaign(
            gym_id=tenant.gym_id,
            name=payload.name,
            trigger_type=payload.trigger_type,
            primary_channel=payload.primary_channel,
            fallback_channel=payload.fallback_channel,
            template_en=payload.template_en,
            template_hi=payload.template_hi,
            ai_enabled=payload.ai_enabled,
            is_active=True,
        )
        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    @staticmethod
    def optimize_message(payload: AiOptimizeRequest) -> str:
        text = payload.input_text.strip()
        tone_prefix = {
            "professional": "Hello {{member_name}},",
            "friendly": "Hi {{member_name}} 👋,",
            "urgent": "Important update for {{member_name}}:",
        }.get(payload.tone.lower(), "Hello {{member_name}},")

        if payload.language.lower() in {"hi", "hindi"}:
            optimized = f"Namaste {{member_name}}, {text} Kripya reply karke confirm karein."
        else:
            optimized = f"{tone_prefix} {text} Please reply to confirm."

        for key, value in payload.personalization_tokens.items():
            optimized = optimized.replace(f"{{{{{key}}}}}", value)
        return optimized

    def log_delivery(self, tenant: TenantContext, payload: CampaignDeliveryLogCreate) -> CampaignDeliveryLog:
        campaign = self.db.execute(
            select(AutomationCampaign).where(
                and_(
                    AutomationCampaign.id == payload.campaign_id,
                    AutomationCampaign.gym_id == tenant.gym_id,
                )
            )
        ).scalar_one_or_none()
        if not campaign:
            raise ValueError("Campaign not found")

        log = CampaignDeliveryLog(
            gym_id=tenant.gym_id,
            campaign_id=payload.campaign_id,
            member_id=payload.member_id,
            channel=payload.channel,
            status=payload.status,
            provider_message_id=payload.provider_message_id,
            ai_variant_used=payload.ai_variant_used,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def campaign_summary(self, tenant: TenantContext) -> CampaignSummaryResponse:
        rows = self.db.execute(
            select(CampaignDeliveryLog.status, func.count(CampaignDeliveryLog.id))
            .where(CampaignDeliveryLog.gym_id == tenant.gym_id)
            .group_by(CampaignDeliveryLog.status)
        ).all()
        counts = {status: count for status, count in rows}

        sent = counts.get(NotificationStatus.SENT, 0)
        failed = counts.get(NotificationStatus.FAILED, 0)
        pending = counts.get(NotificationStatus.PENDING, 0)

        return CampaignSummaryResponse(
            total=sent + failed + pending,
            sent=sent,
            failed=failed,
            pending=pending,
        )
