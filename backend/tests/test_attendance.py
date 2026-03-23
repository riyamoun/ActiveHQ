"""
Tests for attendance endpoints and services.
"""

import pytest
from datetime import datetime, timedelta


class TestAttendanceCheckIn:
    """Test check-in endpoint."""
    
    def test_checkin_success(self, client, owner_token, test_member):
        """Check in member successfully."""
        payload = {
            "member_id": test_member.id,
        }
        response = client.post(
            "/api/v1/attendance/check-in",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["member_id"] == test_member.id
        assert data["check_in_time"] is not None
        assert data["check_out_time"] is None

    def test_checkin_invalid_member(self, client, owner_token):
        """Check in non-existent member."""
        payload = {"member_id": 99999}
        response = client.post(
            "/api/v1/attendance/check-in",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 404

    def test_checkin_staff_allowed(self, client, staff_token, test_member):
        """Staff can check in members."""
        payload = {"member_id": test_member.id}
        response = client.post(
            "/api/v1/attendance/check-in",
            json=payload,
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        assert response.status_code == 201


class TestAttendanceCheckOut:
    """Test check-out endpoint."""
    
    def test_checkout_success(self, client, owner_token, test_member, db_session):
        """Check out successfully."""
        # First check in
        checkin_response = client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": test_member.id},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert checkin_response.status_code == 201
        attendance_id = checkin_response.json()["id"]
        
        # Check out
        response = client.post(
            f"/api/v1/attendance/{attendance_id}/check-out",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["check_out_time"] is not None

    def test_checkout_no_open_session(self, client, owner_token):
        """Checkout with no open session."""
        response = client.post(
            "/api/v1/attendance/99999/check-out",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 404


class TestAttendanceList:
    """Test list attendance endpoint."""
    
    def test_list_attendance_today(self, client, owner_token, test_member):
        """List today's attendance."""
        # Check in first
        client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": test_member.id},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        
        # List
        today = datetime.now().date().isoformat()
        response = client.get(
            f"/api/v1/attendance?date={today}",
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
    """Test attendance reports."""
    
    def test_attendance_today_summary(self, client, owner_token, test_member):
        """Get today's attendance summary."""
        # Check in first
        client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": test_member.id},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        
        today = datetime.now().date().isoformat()
        response = client.get(
            f"/api/v1/reports/attendance/daily?date={today}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_checkins" in data
        assert "members_present" in data

    def test_attendance_weekly_report(self, client, owner_token):
        """Get weekly attendance report."""
        start_date = (datetime.now() - timedelta(days=7)).date().isoformat()
        end_date = datetime.now().date().isoformat()
        
        response = client.get(
            f"/api/v1/reports/attendance/weekly?start_date={start_date}&end_date={end_date}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code in [200, 404]  # 404 if no data

    def test_attendance_member_history(self, client, owner_token, test_member):
        """Get member's attendance history."""
        response = client.get(
            f"/api/v1/attendance/member/{test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
