"""
Tests for authentication endpoints and services.
"""

import pytest
from fastapi.testclient import TestClient


class TestAuthRegister:
    """Test gym registration flow."""

    def test_register_new_gym(self, client: TestClient):
        """Register a new gym and owner."""
        payload = {
            "gym_name": "New Gym",
            "gym_email": "newgym@example.com",
            "gym_phone": "9876543210",
            "owner_email": "newowner@test.com",
            "owner_password": "SecurePass@123",
            "owner_name": "New Owner",
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["gym_name"] == "New Gym"
        assert "user" in data
        assert "tokens" in data
        assert data["user"]["email"] == "newowner@test.com"

    def test_register_invalid_email(self, client: TestClient):
        """Reject invalid email format."""
        payload = {
            "gym_name": "Test Gym",
            "gym_email": "valid@example.com",
            "gym_phone": "9876543210",
            "owner_email": "invalid-email",
            "owner_password": "SecurePass@123",
            "owner_name": "Owner",
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422

    def test_register_weak_password(self, client: TestClient):
        """Reject weak password."""
        payload = {
            "gym_name": "Test Gym",
            "gym_email": "gym@example.com",
            "gym_phone": "9876543210",
            "owner_email": "owner@test.com",
            "owner_password": "weak",
            "owner_name": "Owner",
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422


class TestAuthLogin:
    """Test login flow."""

    def test_login_success(self, client: TestClient, test_owner_user):
        """Login with correct credentials returns tokens."""
        payload = {
            "email": "owner@test.com",
            "password": "Owner@123",
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_email(self, client: TestClient):
        """Login with non-existent email."""
        payload = {
            "email": "nonexistent@test.com",
            "password": "Password@123",
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

    def test_login_wrong_password(self, client: TestClient, test_owner_user):
        """Login with wrong password."""
        payload = {
            "email": "owner@test.com",
            "password": "WrongPassword@123",
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

    def test_login_missing_field(self, client: TestClient):
        """Login with missing required field."""
        payload = {"email": "owner@test.com"}
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 422


class TestAuthRefresh:
    """Test token refresh."""

    def test_refresh_token_success(self, client: TestClient, test_owner_user):
        """Refresh access token using refresh_token body."""
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "owner@test.com", "password": "Owner@123"},
        )
        assert login.status_code == 200
        refresh_token = login.json()["refresh_token"]
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_without_token(self, client: TestClient):
        """Refresh without body returns 422."""
        response = client.post("/api/v1/auth/refresh", json={})
        assert response.status_code == 422

    def test_refresh_invalid_token(self, client: TestClient):
        """Refresh with invalid token returns 401."""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401


class TestAuthLogout:
    """Test logout flow."""

    def test_logout_success(self, client: TestClient, test_owner_user):
        """Logout successfully."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "owner@test.com", "password": "Owner@123"},
        )
        data = response.json()
        refresh_token = data["refresh_token"]

        logout_response = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert logout_response.status_code == 200

    def test_logout_invalid_token(self, client: TestClient):
        """Logout with invalid token still returns 200 (best-effort revoke)."""
        response = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": "invalid.token"},
        )
        assert response.status_code == 200


class TestChangePassword:
    """Test password change."""

    def test_change_password_success(self, client: TestClient, owner_token: str):
        """Change password successfully."""
        response = client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": "Owner@123",
                "new_password": "NewPass@456",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200

    def test_change_password_wrong_current(self, client: TestClient, owner_token: str):
        """Change password with wrong current password."""
        response = client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": "WrongPass@123",
                "new_password": "NewPass@456",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 400

    def test_change_password_weak_new(self, client: TestClient, owner_token: str):
        """Reject weak new password."""
        response = client.put(
            "/api/v1/auth/me/password",
            json={
                "current_password": "Owner@123",
                "new_password": "weak",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 422


class TestDeleteMyAccount:
    """Test self-service account deletion."""

    def test_delete_my_account_success(self, client: TestClient, owner_token: str):
        response = client.request(
            "DELETE",
            "/api/v1/auth/me",
            json={"password": "Owner@123", "confirm_text": "DELETE"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Account deleted"

        # Token should now be invalid because user is inactive.
        me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {owner_token}"})
        assert me.status_code in (401, 403)

    def test_delete_my_account_wrong_password(self, client: TestClient, owner_token: str):
        response = client.request(
            "DELETE",
            "/api/v1/auth/me",
            json={"password": "WrongPass@123", "confirm_text": "DELETE"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 400

    def test_delete_my_account_requires_confirm_text(self, client: TestClient, owner_token: str):
        response = client.request(
            "DELETE",
            "/api/v1/auth/me",
            json={"password": "Owner@123", "confirm_text": "NOPE"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 422
