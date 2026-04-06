"""
Tests for members endpoints and services.
"""

import uuid
from io import BytesIO

import pytest


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
        assert data["items"][0]["name"] == "Test Member"

    def test_list_members_pagination(self, client, owner_token, test_member):
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
        """List members without auth returns 401 or 403."""
        response = client.get("/api/v1/members")
        assert response.status_code in (401, 403)


class TestMemberCreate:
    """Test create member endpoint."""

    def test_create_member_success(self, client, owner_token, test_gym):
        """Create member successfully."""
        payload = {
            "name": "New Member",
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
        assert data["name"] == "New Member"
        assert data["phone"] == "9999888777"

    def test_create_member_duplicate_phone(self, client, owner_token, test_member):
        """Duplicate phone returns error."""
        payload = {
            "name": "Another Member",
            "phone": "9999999966",
            "email": "another@test.com",
            "date_of_birth": "2000-01-01",
        }
        response = client.post(
            "/api/v1/members",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 400

    def test_create_member_invalid_phone(self, client, owner_token):
        """Invalid phone format."""
        payload = {
            "name": "Member",
            "phone": "123",
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
            "name": "New Member",
            "phone": "9999888777",
            "email": "newmember@test.com",
            "date_of_birth": "2000-01-01",
        }
        response = client.post(
            "/api/v1/members",
            json=payload,
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        assert response.status_code == 403


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
        assert data["id"] == str(test_member.id)
        assert data["name"] == "Test Member"

    def test_member_detail_not_found(self, client, owner_token):
        """Get non-existent member."""
        missing = uuid.uuid4()
        response = client.get(
            f"/api/v1/members/{missing}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 404


class TestMemberUpdate:
    """Test update member endpoint."""

    def test_update_member_success(self, client, owner_token, test_member):
        """Update member successfully."""
        payload = {
            "name": "Updated Member",
            "phone": test_member.phone,
            "email": "updated@test.com",
        }
        response = client.put(
            f"/api/v1/members/{test_member.id}",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Member"

    def test_update_member_manager_allowed(self, client, manager_token, test_member):
        """Manager can update members."""
        payload = {
            "name": "Manager Updated",
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
        """Owner can delete members."""
        response = client.delete(
            f"/api/v1/members/{test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 204

    def test_delete_member_manager_blocked(self, client, manager_token, test_member):
        """Manager cannot delete members."""
        response = client.delete(
            f"/api/v1/members/{test_member.id}",
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        assert response.status_code == 403


class TestMemberPhoto:
    """Test member photo upload/view/delete endpoints."""

    def test_upload_and_get_and_delete_photo(self, client, owner_token, test_member):
        files = {
            "photo": ("member.jpg", BytesIO(b"\xff\xd8\xff\xe0" + b"0" * 128), "image/jpeg"),
        }
        upload = client.post(
            f"/api/v1/members/{test_member.id}/photo",
            files=files,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert upload.status_code == 200
        payload = upload.json()
        assert payload["photo_url"] is not None

        get_photo = client.get(
            f"/api/v1/members/{test_member.id}/photo",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert get_photo.status_code == 200
        assert get_photo.headers["content-type"].startswith("image/")

        delete_photo = client.delete(
            f"/api/v1/members/{test_member.id}/photo",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert delete_photo.status_code == 200
        assert delete_photo.json()["photo_url"] is None

    def test_upload_photo_requires_manager_or_owner(self, client, staff_token, test_member):
        files = {
            "photo": ("member.jpg", BytesIO(b"\xff\xd8\xff\xe0" + b"1" * 64), "image/jpeg"),
        }
        response = client.post(
            f"/api/v1/members/{test_member.id}/photo",
            files=files,
            headers={"Authorization": f"Bearer {staff_token}"},
        )
        assert response.status_code == 403
