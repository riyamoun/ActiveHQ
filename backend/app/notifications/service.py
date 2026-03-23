"""
Notification Service: Send SMS, Email, and WhatsApp to members/users.
Supports bulk sends, scheduling, and delivery tracking.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import TenantContext
from app.models import Member, Notification, User
from app.models.enums import NotificationChannel, NotificationStatus, NotificationType
from app.services.messaging import send_email, send_sms, send_whatsapp_then_sms, SendResult
from app.core.logger import logger


class BulkNotificationRequest:
    """Define a bulk notification send."""
    def __init__(
        self,
        recipients: list[str],
        channel: NotificationChannel,
        subject: str = "",
        body: str = "",
        notification_type: NotificationType = NotificationType.CUSTOM,
    ):
        self.recipients = recipients  # emails or phone numbers
        self.channel = channel
        self.subject = subject
        self.body = body
        self.notification_type = notification_type


class NotificationService:
    """Handle notification sending, tracking, and delivery."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def send_sms_to_member(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        message: str,
        notification_type: NotificationType = NotificationType.CUSTOM,
    ) -> dict:
        """
        Send SMS to a member.
        Returns: {"success": bool, "message_id": str, "error": str or None}
        """
        member = self.db.execute(
            select(Member).where(
                and_(Member.id == member_id, Member.gym_id == gym_id)
            )
        ).scalar_one_or_none()
        
        if not member:
            return {"success": False, "message_id": None, "error": "Member not found"}
        
        if not member.phone:
            return {"success": False, "message_id": None, "error": "Member has no phone"}
        
        # Send SMS via Twilio
        result = send_sms(member.phone, message)
        
        # Log notification
        notification = Notification(
            gym_id=gym_id,
            member_id=member_id,
            channel=NotificationChannel.SMS,
            type=notification_type,
            status=NotificationStatus.SENT if result.success else NotificationStatus.FAILED,
            provider_message_id=result.provider_message_id,
            error_message=result.error,
        )
        self.db.add(notification)
        self.db.commit()
        
        if result.success:
            logger.info(f"SMS sent to member {member_id}: {result.provider_message_id}")
        else:
            logger.error(f"SMS failed for member {member_id}: {result.error}")
        
        return {
            "success": result.success,
            "message_id": result.provider_message_id,
            "error": result.error,
        }
    
    def send_email_to_member(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        subject: str,
        body: str,
        notification_type: NotificationType = NotificationType.CUSTOM,
    ) -> dict:
        """
        Send email to a member.
        Returns: {"success": bool, "error": str or None}
        """
        member = self.db.execute(
            select(Member).where(
                and_(Member.id == member_id, Member.gym_id == gym_id)
            )
        ).scalar_one_or_none()
        
        if not member:
            return {"success": False, "error": "Member not found"}
        
        if not member.email:
            return {"success": False, "error": "Member has no email"}
        
        # Send email via SMTP
        result = send_email(member.email, subject, body)
        
        # Log notification
        notification = Notification(
            gym_id=gym_id,
            member_id=member_id,
            channel=NotificationChannel.EMAIL,
            type=notification_type,
            status=NotificationStatus.SENT if result.success else NotificationStatus.FAILED,
            error_message=result.error,
        )
        self.db.add(notification)
        self.db.commit()
        
        if result.success:
            logger.info(f"Email sent to member {member_id}")
        else:
            logger.error(f"Email failed for member {member_id}: {result.error}")
        
        return {
            "success": result.success,
            "error": result.error,
        }
    
    def send_whatsapp_to_member(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        message: str,
        notification_type: NotificationType = NotificationType.CUSTOM,
    ) -> dict:
        """
        Send WhatsApp (Twilio) or SMS fallback to a member.
        Returns: {"success": bool, "channel": str, "error": str or None}
        """
        member = self.db.execute(
            select(Member).where(
                and_(Member.id == member_id, Member.gym_id == gym_id)
            )
        ).scalar_one_or_none()
        
        if not member:
            return {"success": False, "channel": None, "error": "Member not found"}
        
        if not member.phone:
            return {"success": False, "channel": None, "error": "Member has no phone"}
        
        # Try WhatsApp, fall back to SMS
        result = send_whatsapp_then_sms(member.phone, message)
        
        # Map result channel to NotificationChannel
        channel_map = {"whatsapp": NotificationChannel.WHATSAPP, "sms": NotificationChannel.SMS}
        notification_channel = channel_map.get(result.channel, NotificationChannel.SMS)
        
        # Log notification
        notification = Notification(
            gym_id=gym_id,
            member_id=member_id,
            channel=notification_channel,
            type=notification_type,
            status=NotificationStatus.SENT if result.success else NotificationStatus.FAILED,
            provider_message_id=result.provider_message_id,
            error_message=result.error,
        )
        self.db.add(notification)
        self.db.commit()
        
        if result.success:
            logger.info(f"Message sent to member {member_id} via {result.channel}")
        else:
            logger.error(f"Message failed for member {member_id}: {result.error}")
        
        return {
            "success": result.success,
            "channel": result.channel,
            "error": result.error,
        }
    
    def send_bulk_sms(
        self,
        gym_id: uuid.UUID,
        member_ids: list[uuid.UUID],
        message: str,
        notification_type: NotificationType = NotificationType.CUSTOM,
    ) -> dict:
        """
        Send SMS to multiple members.
        Returns: {"total": int, "sent": int, "failed": int, "results": []}
        """
        results = []
        sent_count = 0
        failed_count = 0
        
        for member_id in member_ids:
            result = self.send_sms_to_member(gym_id, member_id, message, notification_type)
            results.append({"member_id": str(member_id), **result})
            if result["success"]:
                sent_count += 1
            else:
                failed_count += 1
        
        logger.info(f"Bulk SMS: {sent_count}/{len(member_ids)} sent successfully")
        
        return {
            "total": len(member_ids),
            "sent": sent_count,
            "failed": failed_count,
            "results": results,
        }
    
    def send_bulk_email(
        self,
        gym_id: uuid.UUID,
        member_ids: list[uuid.UUID],
        subject: str,
        body: str,
        notification_type: NotificationType = NotificationType.CUSTOM,
    ) -> dict:
        """
        Send email to multiple members.
        Returns: {"total": int, "sent": int, "failed": int, "results": []}
        """
        results = []
        sent_count = 0
        failed_count = 0
        
        for member_id in member_ids:
            result = self.send_email_to_member(gym_id, member_id, subject, body, notification_type)
            results.append({"member_id": str(member_id), **result})
            if result["success"]:
                sent_count += 1
            else:
                failed_count += 1
        
        logger.info(f"Bulk email: {sent_count}/{len(member_ids)} sent successfully")
        
        return {
            "total": len(member_ids),
            "sent": sent_count,
            "failed": failed_count,
            "results": results,
        }
    
    def send_bulk_whatsapp(
        self,
        gym_id: uuid.UUID,
        member_ids: list[uuid.UUID],
        message: str,
        notification_type: NotificationType = NotificationType.CUSTOM,
    ) -> dict:
        """
        Send WhatsApp (with SMS fallback) to multiple members.
        Returns: {"total": int, "sent": int, "failed": int, "results": []}
        """
        results = []
        sent_count = 0
        failed_count = 0
        
        for member_id in member_ids:
            result = self.send_whatsapp_to_member(gym_id, member_id, message, notification_type)
            results.append({"member_id": str(member_id), **result})
            if result["success"]:
                sent_count += 1
            else:
                failed_count += 1
        
        logger.info(f"Bulk WhatsApp: {sent_count}/{len(member_ids)} sent successfully")
        
        return {
            "total": len(member_ids),
            "sent": sent_count,
            "failed": failed_count,
            "results": results,
        }
    
    def get_notification_history(
        self,
        gym_id: uuid.UUID,
        member_id: Optional[uuid.UUID] = None,
        channel: Optional[NotificationChannel] = None,
        limit: int = 50,
    ) -> list[dict]:
        """
        Get notification history for a gym or specific member.
        Returns: List of notifications with details.
        """
        query = select(Notification).where(Notification.gym_id == gym_id)
        
        if member_id:
            query = query.where(Notification.member_id == member_id)
        
        if channel:
            query = query.where(Notification.channel == channel)
        
        notifications = self.db.execute(
            query.order_by(Notification.created_at.desc()).limit(limit)
        ).scalars().all()
        
        return [
            {
                "id": str(n.id),
                "member_id": str(n.member_id),
                "channel": n.channel,
                "type": n.type,
                "status": n.status,
                "error_message": n.error_message,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ]
    
    def get_notification_stats(
        self,
        gym_id: uuid.UUID,
        days: int = 7,
    ) -> dict:
        """
        Get notification statistics for the past N days.
        Returns: {"sms": {sent, failed}, "email": {sent, failed}, "whatsapp": {sent, failed}}
        """
        from datetime import timedelta
        
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        notifications = self.db.execute(
            select(Notification).where(
                and_(
                    Notification.gym_id == gym_id,
                    Notification.created_at >= cutoff,
                )
            )
        ).scalars().all()
        
        stats = {
            "sms": {"sent": 0, "failed": 0},
            "email": {"sent": 0, "failed": 0},
            "whatsapp": {"sent": 0, "failed": 0},
        }
        
        for notif in notifications:
            channel_key = notif.channel.value
            if channel_key not in stats:
                stats[channel_key] = {"sent": 0, "failed": 0}
            
            if notif.status == NotificationStatus.SENT:
                stats[channel_key]["sent"] += 1
            else:
                stats[channel_key]["failed"] += 1
        
        return stats
    
    def resend_failed_notifications(
        self,
        gym_id: uuid.UUID,
        hours: int = 24,
    ) -> dict:
        """
        Retry sending failed notifications from the last N hours.
        Returns: {"retried": int, "succeeded": int, "failed": int}
        """
        from datetime import timedelta
        
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        failed_notifications = self.db.execute(
            select(Notification).where(
                and_(
                    Notification.gym_id == gym_id,
                    Notification.status == NotificationStatus.FAILED,
                    Notification.created_at >= cutoff,
                )
            )
        ).scalars().all()
        
        retried_count = 0
        succeeded_count = 0
        failed_count = 0
        
        for notif in failed_notifications:
            if not notif.member_id:
                continue
            
            try:
                if notif.channel == NotificationChannel.SMS:
                    result = self.send_sms_to_member(
                        gym_id, notif.member_id, "Retry: " + str(notif.error_message), notif.type
                    )
                elif notif.channel == NotificationChannel.EMAIL:
                    result = self.send_email_to_member(
                        gym_id, notif.member_id, "Notification", str(notif.error_message), notif.type
                    )
                else:  # WhatsApp
                    result = self.send_whatsapp_to_member(
                        gym_id, notif.member_id, "Retry: " + str(notif.error_message), notif.type
                    )
                
                retried_count += 1
                if result.get("success"):
                    succeeded_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(f"Retry failed for notification {notif.id}: {e}")
                retried_count += 1
                failed_count += 1
        
        logger.info(f"Retry notifications: {retried_count} retried, {succeeded_count} succeeded")
        
        return {
            "retried": retried_count,
            "succeeded": succeeded_count,
            "failed": failed_count,
        }
