"""
WhatsApp (Interakt) + SMS (Twilio fallback).
Primary: Interakt WhatsApp. Fallback: Twilio SMS if configured.
"""

import re
from dataclasses import dataclass

import httpx

from app.core.config import settings


def normalize_phone_to_e164(phone: str, default_country_code: str = "91") -> str:
    """
    Normalize Indian phone to E.164 e.g. +919958040484.
    Accepts 9958040484 or 919958040484 or +919958040484.
    """
    digits = re.sub(r"\D", "", phone)
    if not digits:
        return ""
    if len(digits) == 10 and digits.startswith(("6", "7", "8", "9")):
        return f"+{default_country_code}{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"+{default_country_code}{digits[1:]}"
    return f"+{digits}" if not digits.startswith("+") else digits


@dataclass
class SendResult:
    success: bool
    channel: str  # "whatsapp" | "sms"
    provider_message_id: str | None
    error: str | None


def _phone_digits_only(phone: str, default_country_code: str = "91") -> str:
    """Return digits only for Interakt (no country code in number)."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10 and digits.startswith(("6", "7", "8", "9")):
        return digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits[-10:] if len(digits) >= 10 else digits


def _interakt_configured() -> bool:
    return bool(settings.interakt_api_key.strip())


def send_whatsapp_interakt(
    to_phone: str,
    template_name: str,
    body_values: list[str],
    *,
    language_code: str = "en",
) -> SendResult:
    """
    Send WhatsApp via Interakt Template API.
    body_values: list of strings for {{1}}, {{2}}, ... in template body (in order).
    Phone: digits only, no country code (Interakt expects countryCode separate).
    """
    if not _interakt_configured():
        return SendResult(
            success=False,
            channel="whatsapp",
            provider_message_id=None,
            error="Interakt not configured",
        )
    phone_digits = _phone_digits_only(to_phone)
    if len(phone_digits) < 10:
        return SendResult(
            success=False,
            channel="whatsapp",
            provider_message_id=None,
            error="Invalid phone",
        )
    payload = {
        "countryCode": settings.interakt_country_code.strip() or "+91",
        "phoneNumber": phone_digits,
        "type": "Template",
        "template": {
            "name": template_name,
            "languageCode": language_code,
            "bodyValues": [str(v) for v in body_values],
        },
    }
    # Interakt: "Authorization: Basic <API Key>". Dashboard may give raw key or base64; we send as-is.
    api_key = settings.interakt_api_key.strip()
    if not api_key:
        return SendResult(success=False, channel="whatsapp", provider_message_id=None, error="Interakt API key empty")
    headers = {
        "Authorization": f"Basic {api_key}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.post(
                "https://api.interakt.ai/v1/public/message/",
                json=payload,
                headers=headers,
            )
        if r.status_code in (200, 201):
            data = r.json()
            msg_id = data.get("id") if isinstance(data, dict) else None
            return SendResult(
                success=True,
                channel="whatsapp",
                provider_message_id=msg_id,
                error=None,
            )
        return SendResult(
            success=False,
            channel="whatsapp",
            provider_message_id=None,
            error=f"Interakt API {r.status_code}: {r.text[:200]}",
        )
    except Exception as e:
        return SendResult(
            success=False,
            channel="whatsapp",
            provider_message_id=None,
            error=str(e),
        )


def _twilio_client():
    """Lazy Twilio client; returns None if credentials missing."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return None
    try:
        from twilio.rest import Client
        return Client(settings.twilio_account_sid, settings.twilio_auth_token)
    except Exception:
        return None


def _from_sms_e164() -> str:
    """Twilio SMS 'from' number in E.164. Must be a Twilio number."""
    raw = (settings.twilio_sms_from or settings.messaging_phone_number).strip()
    return normalize_phone_to_e164(raw)


def send_sms(to_phone: str, body: str) -> SendResult:
    """
    Send SMS via Twilio.
    to_phone: Indian number e.g. 9876543210 → +919876543210
    """
    client = _twilio_client()
    if not client:
        return SendResult(success=False, channel="sms", provider_message_id=None, error="Twilio not configured")
    to_e164 = normalize_phone_to_e164(to_phone)
    if not to_e164:
        return SendResult(success=False, channel="sms", provider_message_id=None, error="Invalid phone")
    from_num = _from_sms_e164()
    try:
        msg = client.messages.create(body=body, from_=from_num, to=to_e164)
        return SendResult(
            success=True,
            channel="sms",
            provider_message_id=msg.sid,
            error=None,
        )
    except Exception as e:
        return SendResult(success=False, channel="sms", provider_message_id=None, error=str(e))


def send_whatsapp(to_phone: str, body: str) -> SendResult:
    """
    Send WhatsApp: not used for template flows. Use send_whatsapp_interakt for Interakt.
    Fallback: Twilio if configured.
    """
    client = _twilio_client()
    if not client:
        return SendResult(success=False, channel="whatsapp", provider_message_id=None, error="Twilio not configured")
    if not settings.twilio_whatsapp_from:
        return SendResult(
            success=False,
            channel="whatsapp",
            provider_message_id=None,
            error="Twilio WhatsApp from not configured",
        )
    to_e164 = normalize_phone_to_e164(to_phone)
    if not to_e164:
        return SendResult(success=False, channel="whatsapp", provider_message_id=None, error="Invalid phone")
    from_wa = settings.twilio_whatsapp_from.strip()
    if not from_wa.startswith("whatsapp:"):
        from_wa = f"whatsapp:{from_wa}" if from_wa.startswith("+") else f"whatsapp:+{from_wa}"
    to_wa = f"whatsapp:{to_e164}"
    try:
        msg = client.messages.create(body=body, from_=from_wa, to=to_wa)
        return SendResult(
            success=True,
            channel="whatsapp",
            provider_message_id=msg.sid,
            error=None,
        )
    except Exception as e:
        return SendResult(success=False, channel="whatsapp", provider_message_id=None, error=str(e))


def send_whatsapp_then_sms(to_phone: str, body: str) -> SendResult:
    """
    Try WhatsApp (Twilio) then SMS. Use when sending free-form text.
    For Interakt use send_whatsapp_interakt with template + bodyValues.
    """
    result = send_whatsapp(to_phone, body)
    if result.success:
        return result
    return send_sms(to_phone, body)


def send_email(to_email: str, subject: str, body: str) -> SendResult:
    """
    Send email via SMTP (GoDaddy / Gmail = free). No per-message cost.
    Returns SendResult with channel="email".
    """
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        return SendResult(
            success=False,
            channel="email",
            provider_message_id=None,
            error="SMTP not configured",
        )
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    to_email = (to_email or "").strip()
    if not to_email or "@" not in to_email:
        return SendResult(success=False, channel="email", provider_message_id=None, error="Invalid email")
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from or settings.smtp_user
        msg["To"] = to_email
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(msg["From"], to_email, msg.as_string())
        return SendResult(success=True, channel="email", provider_message_id=None, error=None)
    except Exception as e:
        return SendResult(success=False, channel="email", provider_message_id=None, error=str(e))
