from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CampaignTriggerType, NotificationChannel, NotificationStatus


class AutomationCampaignCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    trigger_type: CampaignTriggerType
    primary_channel: NotificationChannel = NotificationChannel.WHATSAPP
    fallback_channel: NotificationChannel | None = NotificationChannel.SMS
    template_en: str = Field(..., min_length=10, max_length=500)
    template_hi: str | None = Field(default=None, max_length=500)
    ai_enabled: bool = True


class AutomationCampaignResponse(BaseModel):
    id: UUID
    name: str
    trigger_type: CampaignTriggerType
    primary_channel: NotificationChannel
    fallback_channel: NotificationChannel | None
    template_en: str
    template_hi: str | None
    ai_enabled: bool
    is_active: bool


class AiOptimizeRequest(BaseModel):
    input_text: str = Field(..., min_length=10, max_length=500)
    tone: str = Field(default="professional", max_length=40)
    language: str = Field(default="en", max_length=10)
    personalization_tokens: dict[str, str] = Field(default_factory=dict)


class AiOptimizeResponse(BaseModel):
    optimized_text: str


class CampaignDeliveryLogCreate(BaseModel):
    campaign_id: UUID
    member_id: UUID | None = None
    channel: NotificationChannel
    status: NotificationStatus = NotificationStatus.PENDING
    provider_message_id: str | None = None
    ai_variant_used: str | None = None


class CampaignSummaryResponse(BaseModel):
    total: int
    sent: int
    failed: int
    pending: int
