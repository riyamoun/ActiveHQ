"""
WhatsApp + SMS via Picky Assist Push API only.
https://help.pickyassist.com/api-documentation-v2/push-api/sending-single-message-push
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


def normalize_phone_pickyassist(phone: str, default_country_code: str = "91") -> str:
    """
    Picky Assist: full country code, no + or leading 0 (e.g. 919958040484).
    """
    e164 = normalize_phone_to_e164(phone, default_country_code)
    return re.sub(r"\D", "", e164)


@dataclass
class SendResult:
    success: bool
    channel: str  # "whatsapp" | "sms"
    provider_message_id: str | None
    error: str | None


def _pickyassist_configured() -> bool:
    return bool((settings.pickyassist_api_token or "").strip())


def send_pickyassist_push(
    to_phone: str,
    body: str,
    *,
    channel: str,
    application: str | None = None,
) -> SendResult:
    """
    POST https://app.pickyassist.com/api/v2/push
    channel: "whatsapp" | "sms" — used for SendResult only; application selects channel in Picky.
    """
    if not _pickyassist_configured():
        return SendResult(
            success=False,
            channel=channel,
            provider_message_id=None,
            error="Picky Assist not configured (set PICKYASSIST_API_TOKEN)",
        )
    number = normalize_phone_pickyassist(to_phone)
    if len(number) < 10:
        return SendResult(success=False, channel=channel, provider_message_id=None, error="Invalid phone")
    app_id = (application or "").strip()
    if not app_id:
        app_id = (
            settings.pickyassist_application_whatsapp.strip()
            if channel == "whatsapp"
            else settings.pickyassist_application_sms.strip()
        )
    if not app_id:
        return SendResult(
            success=False,
            channel=channel,
            provider_message_id=None,
            error=f"Picky Assist application id not set for {channel}",
        )
    msg = (body or "").strip()
    if not msg:
        return SendResult(success=False, channel=channel, provider_message_id=None, error="Message empty")
    url = (settings.pickyassist_push_url or "").strip() or "https://app.pickyassist.com/api/v2/push"
    payload = {
        "token": settings.pickyassist_api_token.strip(),
        "application": app_id,
        "globalmessage": msg,
        "data": [{"number": number, "message": msg}],
    }
    try:
        with httpx.Client(timeout=25.0) as client:
            r = client.post(url, json=payload, headers={"Content-Type": "application/json"})
        if r.status_code not in (200, 201):
            return SendResult(
                success=False,
                channel=channel,
                provider_message_id=None,
                error=f"Picky Assist HTTP {r.status_code}: {r.text[:400]}",
            )
        data = r.json() if r.content else {}
        if not isinstance(data, dict):
            return SendResult(
                success=False,
                channel=channel,
                provider_message_id=None,
                error="Picky Assist: invalid response",
            )
        status = data.get("status")
        if status == 100:
            msg_id = data.get("push_id")
            inner = data.get("data")
            if isinstance(inner, list) and inner and isinstance(inner[0], dict):
                msg_id = inner[0].get("msg_id") or msg_id
            return SendResult(
                success=True,
                channel=channel,
                provider_message_id=str(msg_id) if msg_id is not None else None,
                error=None,
            )
        err_text = data.get("message") or data.get("error") or str(data)[:300]
        return SendResult(
            success=False,
            channel=channel,
            provider_message_id=None,
            error=f"Picky Assist: {err_text}",
        )
    except Exception as e:
        return SendResult(success=False, channel=channel, provider_message_id=None, error=str(e))


def send_sms(to_phone: str, body: str) -> SendResult:
    """SMS via Picky Assist (application 3 = SMS Phone Automation by default)."""
    return send_pickyassist_push(to_phone, body, channel="sms", application=None)


def send_whatsapp(to_phone: str, body: str) -> SendResult:
    """WhatsApp via Picky Assist (channel id from dashboard)."""
    return send_pickyassist_push(to_phone, body, channel="whatsapp", application=None)


def send_whatsapp_then_sms(to_phone: str, body: str) -> SendResult:
    """Try WhatsApp first, then SMS on failure (both Picky Assist)."""
    wa = send_whatsapp(to_phone, body)
    if wa.success:
        return wa
    sms = send_sms(to_phone, body)
    if sms.success:
        return sms
    err = (wa.error or "") + ("; " if wa.error and sms.error else "") + (sms.error or "")
    return SendResult(success=False, channel="sms", provider_message_id=None, error=err or "Send failed")


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
