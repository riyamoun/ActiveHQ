"""
Tests for notification system: SMS, Email, WhatsApp sending and tracking.
Uses the shared `client` fixture so DB overrides apply.
"""

import uuid
from datetime import datetime, timezone, timedelta, date
from unittest.mock import patch

import pytest

from app.models import Notification, Member
from app.models.enums import (
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    Gender,
)


@pytest.fixture
def notify_member(db_session, test_gym) -> Member:
    m = Member(
        gym_id=test_gym.id,
        name="John Doe",
        email="john@test.com",
        phone="9876543210",
        gender=Gender.MALE,
        joined_date=date.today(),
    )
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)
    return m


class TestNotificationSMSSend:
    @patch("app.notifications.service.send_sms")
    def test_send_sms_success(self, mock_send, client, owner_token, notify_member):
        from app.services.messaging import SendResult

        mock_send.return_value = SendResult(
            success=True,
            channel="sms",
            provider_message_id="SM123456",
            error=None,
        )
        response = client.post(
            "/api/v1/notifications/sms",
            json={
                "member_id": str(notify_member.id),
                "message": "Test SMS",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("success") is True


class TestNotificationBulkSend:
    @patch("app.notifications.service.send_sms")
    def test_bulk_sms_send(self, mock_send, client, owner_token, test_gym, db_session):
        from app.services.messaging import SendResult

        mock_send.return_value = SendResult(
            success=True,
            channel="sms",
            provider_message_id="SM123456",
            error=None,
        )
        members = []
        for i in range(3):
            m = Member(
                gym_id=test_gym.id,
                name=f"Member {i}",
                email=f"member{i}@test.com",
                phone=f"987654321{i}",
                gender=Gender.MALE,
                joined_date=date.today(),
            )
            db_session.add(m)
            members.append(m)
        db_session.commit()

        member_ids = [str(m.id) for m in members]
        response = client.post(
            "/api/v1/notifications/bulk-sms",
            json={
                "member_ids": member_ids,
                "message": "Bulk SMS Test",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["sent"] == 3


class TestNotificationEmail:
    @patch("app.notifications.service.send_email")
    def test_send_email_success(self, mock_send, client, owner_token, notify_member):
        from app.services.messaging import SendResult

        mock_send.return_value = SendResult(
            success=True,
            channel="email",
            provider_message_id=None,
            error=None,
        )
        response = client.post(
            "/api/v1/notifications/email",
            json={
                "member_id": str(notify_member.id),
                "subject": "Test Subject",
                "body": "Test Body",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200


class TestNotificationWhatsApp:
    @patch("app.notifications.service.send_whatsapp_then_sms")
    def test_send_whatsapp_success(self, mock_send, client, owner_token, notify_member):
        from app.services.messaging import SendResult

        mock_send.return_value = SendResult(
            success=True,
            channel="whatsapp",
            provider_message_id="WA123456",
            error=None,
        )
        response = client.post(
            "/api/v1/notifications/whatsapp",
            json={
                "member_id": str(notify_member.id),
                "message": "Test WhatsApp",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("success") is True


class TestNotificationHistory:
    def test_get_notification_history(self, client, owner_token, test_gym, db_session):
        member = Member(
            gym_id=test_gym.id,
            name="History Member",
            email="history@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

        for i in range(3):
            notif = Notification(
                gym_id=test_gym.id,
                member_id=member.id,
                channel=NotificationChannel.SMS if i % 2 == 0 else NotificationChannel.EMAIL,
                notification_type=NotificationType.CUSTOM,
                message=f"msg {i}",
                status=NotificationStatus.SENT if i < 2 else NotificationStatus.FAILED,
            )
            db_session.add(notif)
        db_session.commit()

        response = client.get(
            f"/api/v1/notifications/history?member_id={member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3


class TestNotificationStats:
    def test_get_notification_stats(self, client, owner_token, test_gym, db_session):
        member = Member(
            gym_id=test_gym.id,
            name="Stats Member",
            email="stats@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

        now = datetime.now(timezone.utc)
        for i in range(5):
            notif = Notification(
                gym_id=test_gym.id,
                member_id=member.id,
                channel=[
                    NotificationChannel.SMS,
                    NotificationChannel.EMAIL,
                    NotificationChannel.SMS,
                    NotificationChannel.WHATSAPP,
                    NotificationChannel.EMAIL,
                ][i],
                notification_type=NotificationType.CUSTOM,
                message=f"stat {i}",
                status=NotificationStatus.SENT if i < 3 else NotificationStatus.FAILED,
            )
            db_session.add(notif)
        db_session.commit()

        response = client.get(
            "/api/v1/notifications/stats?days=7",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        assert "stats" in response.json()


class TestNotificationAuth:
    def test_notifications_require_auth(self, client):
        response = client.post(
            "/api/v1/notifications/sms",
            json={
                "member_id": str(uuid.uuid4()),
                "message": "Test",
            },
        )
        assert response.status_code in (401, 403)


class TestNotificationRetry:
    @patch("app.notifications.service.send_sms")
    def test_retry_failed_notifications(self, mock_send, client, owner_token, test_gym, db_session):
        from app.services.messaging import SendResult

        mock_send.return_value = SendResult(
            success=True,
            channel="sms",
            provider_message_id="SM123456",
            error=None,
        )
        member = Member(
            gym_id=test_gym.id,
            name="Retry Member",
            email="retry@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

        failed_notif = Notification(
            gym_id=test_gym.id,
            member_id=member.id,
            channel=NotificationChannel.SMS,
            notification_type=NotificationType.CUSTOM,
            message="failed",
            status=NotificationStatus.FAILED,
            error_message="SMS gateway error",
        )
        db_session.add(failed_notif)
        db_session.commit()

        response = client.post(
            "/api/v1/notifications/retry-failed?hours=24",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
