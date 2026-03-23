"""
Tests for attendance endpoints and services.
"""

import uuid

import pytest
from datetime import datetime, timedelta


def _mid(member) -> str:
    return str(member.id)


class TestAttendanceCheckIn:
    """Test check-in endpoint."""

    def test_checkin_success(self, client, owner_token, test_member):
        """Check in member successfully."""
        payload = {"member_id": _mid(test_member)}
        response = client.post(
            "/api/v1/attendance/check-in",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["member_id"] == _mid(test_member)
        assert data["check_in_time"] is not None

    def test_checkin_invalid_member(self, client, owner_token):
        """Check in non-existent member."""
        payload = {"member_id": str(uuid.uuid4())}
        response = client.post(
            "/api/v1/attendance/check-in",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 400

    def test_checkin_staff_allowed(self, client, staff_token, test_member):
        """Staff can check in members."""
        payload = {"member_id": _mid(test_member)}
        response = client.post(
            "/api/v1/attendance/check-in",
            json=payload,
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        assert response.status_code == 201


class TestAttendanceCheckOut:
    """Test check-out endpoint."""

    def test_checkout_success(self, client, owner_token, test_member):
        """Check out successfully."""
        client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": _mid(test_member)},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        response = client.post(
            f"/api/v1/attendance/check-out/{_mid(test_member)}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["check_out_time"] is not None

    def test_checkout_no_open_session(self, client, owner_token):
        """Checkout with no open session."""
        response = client.post(
            f"/api/v1/attendance/check-out/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 400


class TestAttendanceList:
    """Test list attendance endpoint."""

    def test_list_attendance_today(self, client, owner_token, test_member):
        """List today's attendance."""
        client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": _mid(test_member)},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        today = datetime.now().date().isoformat()
        response = client.get(
            f"/api/v1/attendance?target_date={today}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    def test_list_attendance_by_member(self, client, owner_token, test_member):
        """Filter attendance by member."""
        response = client.get(
            f"/api/v1/attendance?member_id={test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200

    def test_list_attendance_pagination(self, client, owner_token):
        """Test pagination."""
        response = client.get(
            "/api/v1/attendance?page=1&page_size=20",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "page" in data


class TestAttendanceReport:
    """Test attendance summaries."""

    def test_attendance_today_summary(self, client, owner_token, test_member):
        """Get today's attendance summary."""
        client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": _mid(test_member)},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        response = client.get(
            "/api/v1/attendance/today",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_check_ins" in data
        assert "unique_members" in data

    def test_attendance_daily_summary_param(self, client, owner_token):
        """Daily summary for a date."""
        d = datetime.now().date().isoformat()
        response = client.get(
            f"/api/v1/attendance/daily-summary?target_date={d}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200

    def test_attendance_member_history(self, client, owner_token, test_member):
        """Get member's attendance history."""
        response = client.get(
            f"/api/v1/attendance/member/{test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
