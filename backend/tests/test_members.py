"""
Tests for members endpoints and services.
"""

import pytest
from datetime import datetime


class TestMembersList:
    """Test list members endpoint."""
    
    def test_list_members_success(self, client, owner_token, test_member):
        """List members with valid token."""
        response = client.get(
            "/api/v1/members",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1
        assert data["items"][0]["full_name"] == "Test Member"

    def test_list_members_pagination(self, client, owner_token, test_member, db_session):
        """Test pagination."""
        response = client.get(
            "/api/v1/members?page=1&page_size=10",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "page" in data
        assert "page_size" in data
        assert data["page"] == 1

    def test_list_members_no_auth(self, client):
        """List members without auth returns 401."""
        response = client.get("/api/v1/members")
        assert response.status_code == 401


class TestMemberCreate:
    """Test create member endpoint."""
    
    def test_create_member_success(self, client, owner_token, test_gym):
        """Create member successfully."""
        payload = {
            "full_name": "New Member",
            "phone": "9999888777",
            "email": "newmember@test.com",
            "date_of_birth": "2000-01-01",
        }
        response = client.post(
            "/api/v1/members",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == "New Member"
        assert data["phone"] == "9999888777"

    def test_create_member_duplicate_phone(self, client, owner_token, test_member):
        """Duplicate phone returns error."""
        payload = {
            "full_name": "Another Member",
            "phone": "9999999966",  # Same as test_member
            "email": "another@test.com",
            "date_of_birth": "2000-01-01",
        }
        response = client.post(
            "/api/v1/members",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 400  # Duplicate

    def test_create_member_invalid_phone(self, client, owner_token):
        """Invalid phone format."""
        payload = {
            "full_name": "Member",
            "phone": "123",  # Too short
            "email": "member@test.com",
            "date_of_birth": "2000-01-01",
        }
        response = client.post(
            "/api/v1/members",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 422

    def test_create_member_staff_blocked(self, client, staff_token):
        """Staff cannot create members."""
        payload = {
            "full_name": "New Member",
            "phone": "9999888777",
            "email": "newmember@test.com",
            "date_of_birth": "2000-01-01",
        }
        response = client.post(
            "/api/v1/members",
            json=payload,
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        assert response.status_code == 403  # Forbidden


class TestMemberDetail:
    """Test member detail endpoint."""
    
    def test_member_detail_success(self, client, owner_token, test_member):
        """Get member detail."""
        response = client.get(
            f"/api/v1/members/{test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_member.id
        assert data["full_name"] == "Test Member"

    def test_member_detail_not_found(self, client, owner_token):
        """Get non-existent member."""
        response = client.get(
            "/api/v1/members/99999",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 404


class TestMemberUpdate:
    """Test update member endpoint."""
    
    def test_update_member_success(self, client, owner_token, test_member):
        """Update member successfully."""
        payload = {
            "full_name": "Updated Member",
            "phone": test_member.phone,  # Keep same
            "email": "updated@test.com",
        }
        response = client.put(
            f"/api/v1/members/{test_member.id}",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Member"

    def test_update_member_manager_allowed(self, client, manager_token, test_member):
        """Manager can update members."""
        payload = {
            "full_name": "Manager Updated",
            "phone": test_member.phone,
            "email": "manager@updated.com",
        }
        response = client.put(
            f"/api/v1/members/{test_member.id}",
            json=payload,
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        assert response.status_code == 200


class TestMemberDelete:
    """Test delete member endpoint."""
    
    def test_delete_member_owner_only(self, client, owner_token, test_member):
        """Only owner can delete members."""
        response = client.delete(
            f"/api/v1/members/{test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200

    def test_delete_member_manager_blocked(self, client, manager_token, test_member):
        """Manager cannot delete members."""
        response = client.delete(
            f"/api/v1/members/{test_member.id}",
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        assert response.status_code == 403  # Forbidden
