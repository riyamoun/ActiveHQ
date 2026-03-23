"""
Tests for notification system: SMS, Email, WhatsApp sending and tracking.
"""

import uuid
import pytest
from unittest.mock import patch
from datetime import datetime, timezone, timedelta, date

from fastapi.testclient import TestClient

from app.main import app
from app.models import Notification, Member
from app.models.enums import (
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    Gender,
)


client = TestClient(app)


class TestNotificationSMSSend:
    """Test SMS sending to members."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.member = Member(
            gym_id=test_gym.id,
            name="John Doe",
            email="john@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        self.db.add(self.member)
        self.db.commit()
        self.db.refresh(self.member)
    
    @patch("app.services.messaging.send_sms")
    def test_send_sms_success(self, mock_send):
        """Test successful SMS send."""
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
                "member_id": str(self.member.id),
                "message": "Test SMS",
            },
            headers=self.headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestNotificationBulkSend:
    """Test bulk notification sending."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.members = []
        for i in range(3):
            member = Member(
                gym_id=test_gym.id,
                name=f"Member {i}",
                email=f"member{i}@test.com",
                phone=f"987654321{i}",
                gender=Gender.MALE,
                joined_date=date.today(),
            )
            self.db.add(member)
            self.members.append(member)
        self.db.commit()
    
    @patch("app.services.messaging.send_sms")
    def test_bulk_sms_send(self, mock_send):
        """Test bulk SMS send."""
        from app.services.messaging import SendResult
        
        mock_send.return_value = SendResult(
            success=True,
            channel="sms",
            provider_message_id="SM123456",
            error=None,
        )
        
        member_ids = [str(m.id) for m in self.members]
        response = client.post(
            "/api/v1/notifications/bulk-sms",
            json={
                "member_ids": member_ids,
                "message": "Bulk SMS Test",
            },
            headers=self.headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["sent"] == 3


class TestNotificationEmail:
    """Test email sending to members."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.member = Member(
            gym_id=test_gym.id,
            name="Jane Doe",
            email="jane@test.com",
            phone="9876543210",
            gender=Gender.FEMALE,
            joined_date=date.today(),
        )
        self.db.add(self.member)
        self.db.commit()
    
    @patch("app.services.messaging.send_email")
    def test_send_email_success(self, mock_send):
        """Test successful email send."""
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
                "member_id": str(self.member.id),
                "subject": "Test Subject",
                "body": "Test Body",
            },
            headers=self.headers,
        )
        
        assert response.status_code == 200


class TestNotificationWhatsApp:
    """Test WhatsApp sending."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.member = Member(
            gym_id=test_gym.id,
            name="WhatsApp Member",
            email="wa@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        self.db.add(self.member)
        self.db.commit()
    
    @patch("app.services.messaging.send_whatsapp_then_sms")
    def test_send_whatsapp_success(self, mock_send):
        """Test successful WhatsApp send."""
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
                "member_id": str(self.member.id),
                "message": "Test WhatsApp",
            },
            headers=self.headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestNotificationHistory:
    """Test notification history tracking."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.member = Member(
            gym_id=test_gym.id,
            name="History Member",
            email="history@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        self.db.add(self.member)
        self.db.commit()
        
        for i in range(3):
            notif = Notification(
                gym_id=test_gym.id,
                member_id=self.member.id,
                channel=NotificationChannel.SMS if i % 2 == 0 else NotificationChannel.EMAIL,
                notification_type=NotificationType.CUSTOM,
                status=NotificationStatus.SENT if i < 2 else NotificationStatus.FAILED,
            )
            self.db.add(notif)
        self.db.commit()
    
    def test_get_notification_history(self):
        """Test getting notification history."""
        response = client.get(
            f"/api/v1/notifications/history?member_id={self.member.id}",
            headers=self.headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3


class TestNotificationStats:
    """Test notification statistics."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.member = Member(
            gym_id=test_gym.id,
            name="Stats Member",
            email="stats@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        self.db.add(self.member)
        self.db.commit()
        
        now = datetime.now(timezone.utc)
        for i in range(5):
            notif = Notification(
                gym_id=test_gym.id,
                member_id=self.member.id,
                channel=[
                    NotificationChannel.SMS,
                    NotificationChannel.EMAIL,
                    NotificationChannel.SMS,
                    NotificationChannel.WHATSAPP,
                    NotificationChannel.EMAIL,
                ][i],
                notification_type=NotificationType.CUSTOM,
                status=NotificationStatus.SENT if i < 3 else NotificationStatus.FAILED,
                created_at=now - timedelta(hours=i),
            )
            self.db.add(notif)
        self.db.commit()
    
    def test_get_notification_stats(self):
        """Test getting notification statistics."""
        response = client.get(
            "/api/v1/notifications/stats?days=7",
            headers=self.headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data


class TestNotificationAuth:
    """Test authorization for notification endpoints."""
    
    def test_notifications_require_auth(self):
        """Test that endpoints require authentication."""
        response = client.post(
            "/api/v1/notifications/sms",
            json={
                "member_id": str(uuid.uuid4()),
                "message": "Test",
            },
        )
        
        assert response.status_code in (401, 403)


class TestNotificationRetry:
    """Test retry logic for failed notifications."""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session, test_gym, test_owner_user, owner_token):
        self.db = db_session
        self.gym = test_gym
        self.user = test_owner_user
        self.token = owner_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.member = Member(
            gym_id=test_gym.id,
            name="Retry Member",
            email="retry@test.com",
            phone="9876543210",
            gender=Gender.MALE,
            joined_date=date.today(),
        )
        self.db.add(self.member)
        self.db.commit()
        
        failed_notif = Notification(
            gym_id=test_gym.id,
            member_id=self.member.id,
            channel=NotificationChannel.SMS,
            notification_type=NotificationType.CUSTOM,
            status=NotificationStatus.FAILED,
            error_message="SMS gateway error",
        )
        self.db.add(failed_notif)
        self.db.commit()
    
    @patch("app.services.messaging.send_sms")
    def test_retry_failed_notifications(self, mock_send):
        """Test retrying failed notifications."""
        from app.services.messaging import SendResult
        
        mock_send.return_value = SendResult(
            success=True,
            channel="sms",
            provider_message_id="SM123456",
            error=None,
        )
        
        response = client.post(
            "/api/v1/notifications/retry-failed?hours=24",
            headers=self.headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["retried"] >= 1
