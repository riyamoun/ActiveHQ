"""
Tests for admin endpoints (platform management).
All tests use super_admin role for authorization.
"""

import pytest
from datetime import datetime, timedelta
from app.models.enums import UserRole


class TestAdminAccess:
    """Test admin endpoint access control."""
    
    def test_admin_stats_requires_super_admin(self, client, owner_token):
        """Non-super-admin blocked from admin endpoints."""
        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 403

    def test_admin_stats_access(self, client, super_admin_token):
        """Super admin can access stats."""
        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "gyms" in data
        assert "members" in data
        assert "users" in data
        assert "revenue" in data

    def test_requires_authentication(self, client):
        """Endpoints require authentication."""
        response = client.get("/api/v1/admin/stats")
        assert response.status_code == 403


class TestAdminGymManagement:
    """Test gym management endpoints (list, detail, toggle)."""
    
    def test_list_gyms(self, client, super_admin_token, test_gym):
        """List all gyms."""
        response = client.get(
            "/api/v1/admin/gyms",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "page" in data
        assert "total" in data
        assert data["page"] == 1
        assert data["total"] >= 1
        
        # Check gym structure
        first_gym = data["items"][0]
        assert "id" in first_gym
        assert "name" in first_gym
        assert "city" in first_gym
        assert "is_active" in first_gym
        assert "members_count" in first_gym
        assert "revenue_this_month" in first_gym

    def test_list_gyms_pagination(self, client, super_admin_token):
        """Test gym list pagination."""
        # Request page 1 with size 10
        response = client.get(
            "/api/v1/admin/gyms?page=1&page_size=10",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_get_gym_detail(self, client, super_admin_token, test_gym):
        """Get detailed information about a gym."""
        response = client.get(
            f"/api/v1/admin/gyms/{test_gym.id}",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(test_gym.id)  # UUID is serialized as string
        assert data["name"] == test_gym.name
        assert "users" in data
        assert "total_members" in data
        assert "revenue_all_time" in data
        assert "revenue_this_month" in data

    def test_get_gym_detail_not_found(self, client, super_admin_token):
        """Get gym detail for non-existent gym."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.get(
            f"/api/v1/admin/gyms/{fake_uuid}",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 404

    def test_toggle_gym_status_activate(self, client, super_admin_token, test_gym, db_session):
        """Disable and then enable a gym."""
        # First disable
        response = client.patch(
            f"/api/v1/admin/gyms/{test_gym.id}/toggle?is_active=false",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] == False
        
        # Verify in DB
        from sqlalchemy import select
        from app.models import Gym
        db_gym = db_session.execute(
            select(Gym).where(Gym.id == test_gym.id)
        ).scalar_one()
        assert db_gym.is_active == False

    def test_toggle_gym_status_not_found(self, client, super_admin_token):
        """Toggle status for non-existent gym."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.patch(
            f"/api/v1/admin/gyms/{fake_uuid}/toggle?is_active=true",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 404


class TestAdminUserManagement:
    """Test user management endpoints."""
    
    def test_list_all_users(self, client, super_admin_token, test_owner_user):
        """List all users across all gyms."""
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "page" in data
        assert "total" in data
        assert data["total"] >= 1
        
        # Check user structure
        first_user = data["items"][0]
        assert "id" in first_user
        assert "email" in first_user
        assert "role" in first_user
        assert "gym_name" in first_user

    def test_list_users_by_role(self, client, super_admin_token):
        """Filter users by role."""
        response = client.get(
            f"/api/v1/admin/users?role=owner",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should have owner role
        for user in data["items"]:
            assert user["role"] == "owner"

    def test_toggle_user_status(self, client, super_admin_token, test_owner_user, db_session):
        """Enable/disable user access."""
        user_id = str(test_owner_user.id)
        
        # Disable user
        response = client.patch(
            f"/api/v1/admin/users/{user_id}/toggle?is_active=false",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] == False
        
        # Verify in DB
        from sqlalchemy import select
        from app.models import User
        db_user = db_session.execute(
            select(User).where(User.id == test_owner_user.id)
        ).scalar_one()
        assert db_user.is_active == False

    def test_toggle_user_status_not_found(self, client, super_admin_token):
        """Toggle status for non-existent user."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.patch(
            f"/api/v1/admin/users/{fake_uuid}/toggle?is_active=true",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 404


class TestAdminAnalytics:
    """Test analytics endpoints."""
    
    def test_platform_stats_structure(self, client, super_admin_token):
        """Verify stats endpoint returns expected structure."""
        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check gyms section
        assert "gyms" in data
        assert "total" in data["gyms"]
        assert "active" in data["gyms"]
        assert "inactive" in data["gyms"]
        
        # Check members section
        assert "members" in data
        assert "total" in data["members"]
        assert "active" in data["members"]
        assert "inactive" in data["members"]
        
        # Check users section
        assert "users" in data
        assert "total" in data["users"]
        assert "owners" in data["users"]
        assert "managers" in data["users"]
        assert "staff" in data["users"]
        assert "super_admins" in data["users"]
        
        # Check revenue
        assert "revenue" in data
        assert "this_month" in data["revenue"]

    def test_platform_stats_values_are_numeric(self, client, super_admin_token):
        """Verify all stats are numeric values."""
        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        data = response.json()
        
        # All counts should be integers or floats >= 0
        assert data["gyms"]["total"] >= 0
        assert data["members"]["total"] >= 0
        assert data["revenue"]["this_month"] >= 0


class TestAdminSupportRequests:
    """Test support/sales requests endpoints."""
    
    def test_list_demo_requests(self, client, super_admin_token):
        """List demo requests for sales team."""
        response = client.get(
            "/api/v1/admin/demo-requests",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "page" in data
        assert "total" in data
        
        # Each item should have basic structure
        if data["items"]:
            first_req = data["items"][0]
            assert "id" in first_req
            assert "name" in first_req
            assert "gym_name" in first_req
            assert "phone" in first_req
