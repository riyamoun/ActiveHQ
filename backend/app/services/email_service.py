"""
Email service for sending transactional emails via SMTP.
Supports registration, password reset, payment receipts, and renewal notifications.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings
from app.core.logger import logger


class EmailService:
    """Send transactional emails via SMTP."""

    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.smtp_from or "info@activehq.fit"

    def is_configured(self) -> bool:
        """Check if SMTP is properly configured."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text: Optional[str] = None,
    ) -> tuple[bool, Optional[str]]:
        """
        Send email via SMTP.

        Returns:
            (success: bool, error_message: Optional[str])
        """
        if not self.is_configured():
            error = "SMTP not configured"
            logger.warning(f"Email not sent: {error}")
            return False, error

        if not to_email or "@" not in to_email:
            return False, "Invalid recipient email"

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to_email

            # Attach plain text if provided, otherwise convert HTML to plain
            if plain_text:
                msg.attach(MIMEText(plain_text, "plain"))
            else:
                msg.attach(MIMEText("See HTML content", "plain"))

            # Attach HTML
            msg.attach(MIMEText(html_content, "html"))

            # Send
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent to {to_email} with subject '{subject}'")
            return True, None

        except smtplib.SMTPAuthenticationError:
            error = "SMTP authentication failed"
            logger.error(error)
            return False, error
        except smtplib.SMTPException as e:
            error = f"SMTP error: {str(e)}"
            logger.error(error)
            return False, error
        except Exception as e:
            error = f"Email error: {str(e)}"
            logger.error(error)
            return False, error

    def send_registration_confirmation(self, to_email: str, member_name: str) -> tuple[bool, Optional[str]]:
        """Send registration confirmation email."""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb;">Welcome to ActiveHQ! 🎉</h1>
                    <p>Hi {member_name},</p>
                    <p>Your account has been successfully created. You can now log in to your gym's ActiveHQ dashboard.</p>
                    <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Complete your profile information</li>
                            <li>Explore the members management dashboard</li>
                            <li>Set up your membership plans</li>
                            <li>Enable WhatsApp notifications</li>
                        </ul>
                    </div>
                    <p>If you have any questions, feel free to contact us at info@activehq.fit</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        © 2026 ActiveHQ. All rights reserved.<br>
                        <a href="https://activehq.fit" style="color: #2563eb;">Visit our website</a>
                    </p>
                </div>
            </body>
        </html>
        """
        plain_text = f"Welcome to ActiveHQ, {member_name}! Your account is ready to use."
        return self.send_email(to_email, "Welcome to ActiveHQ", html_content, plain_text)

    def send_password_reset(self, to_email: str, reset_link: str, name: str) -> tuple[bool, Optional[str]]:
        """Send password reset email."""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #e11d48;">Password Reset Request</h1>
                    <p>Hi {name},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        © 2026 ActiveHQ. All rights reserved.
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, "Reset Your ActiveHQ Password", html_content)

    def send_payment_receipt(
        self,
        to_email: str,
        member_name: str,
        amount: float,
        payment_method: str,
        membership_type: str,
        transaction_id: str,
    ) -> tuple[bool, Optional[str]]:
        """Send payment receipt email."""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #059669;">Payment Receipt</h1>
                    <p>Hi {member_name},</p>
                    <p>Thank you for your payment! Here's your receipt:</p>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <table style="width: 100%; font-size: 14px;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold;">Amount</td>
                                <td style="padding: 10px; text-align: right;">₹{amount:,.2f}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold;">Membership Plan</td>
                                <td style="padding: 10px; text-align: right;">{membership_type}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold;">Payment Method</td>
                                <td style="padding: 10px; text-align: right;">{payment_method}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Transaction ID</td>
                                <td style="padding: 10px; text-align: right;">{transaction_id}</td>
                            </tr>
                        </table>
                    </div>
                    <p>Keep this email for your records.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        © 2026 ActiveHQ. All rights reserved.
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, "Payment Receipt - ActiveHQ", html_content)

    def send_membership_renewal_reminder(
        self,
        to_email: str,
        member_name: str,
        membership_type: str,
        renewal_date: str,
        amount: float,
    ) -> tuple[bool, Optional[str]]:
        """Send membership renewal reminder email."""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #f97316;">Membership Renewal Reminder</h1>
                    <p>Hi {member_name},</p>
                    <p>Your <strong>{membership_type}</strong> membership is expiring soon!</p>
                    <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
                        <p><strong>Renewal Details:</strong></p>
                        <p>
                            Expiry Date: <strong>{renewal_date}</strong><br>
                            Renewal Amount: <strong>₹{amount:,.2f}</strong>
                        </p>
                    </div>
                    <p>Renew now to continue your fitness journey without interruption.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        © 2026 ActiveHQ. All rights reserved.
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, "Time to Renew Your Membership!", html_content)

    def send_payment_due_reminder(
        self,
        to_email: str,
        member_name: str,
        amount_due: float,
        due_date: str,
    ) -> tuple[bool, Optional[str]]:
        """Send payment due reminder email."""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #dc2626;">Payment Due Reminder</h1>
                    <p>Hi {member_name},</p>
                    <p>You have an outstanding payment pending:</p>
                    <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                        <p><strong>Payment Details:</strong></p>
                        <p>
                            Amount Due: <strong>₹{amount_due:,.2f}</strong><br>
                            Due Date: <strong>{due_date}</strong>
                        </p>
                    </div>
                    <p>Please settle the payment at your earliest convenience to maintain uninterrupted access.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        © 2026 ActiveHQ. All rights reserved.
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, "Payment Due Reminder", html_content)


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get or create email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
