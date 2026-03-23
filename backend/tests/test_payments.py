"""
Tests for payments endpoints and services.
"""

import pytest
from datetime import datetime


class TestPaymentCreate:
    """Test create payment endpoint."""

    def test_create_payment_success(self, client, owner_token, test_member):
        """Create payment successfully."""
        payload = {
            "member_id": str(test_member.id),
            "amount": "1000.00",
            "payment_mode": "cash",
            "notes": "Monthly payment",
        }
        response = client.post(
            "/api/v1/payments",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert float(data["amount"]) == 1000.0
        assert data["payment_mode"] == "cash"

    def test_create_payment_zero_amount(self, client, owner_token, test_member):
        """Reject zero amount."""
        payload = {
            "member_id": str(test_member.id),
            "amount": "0",
            "payment_mode": "cash",
        }
        response = client.post(
            "/api/v1/payments",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 422

    def test_create_payment_invalid_method(self, client, owner_token, test_member):
        """Invalid payment mode."""
        payload = {
            "member_id": str(test_member.id),
            "amount": "1000.00",
            "payment_mode": "invalid_method",
        }
        response = client.post(
            "/api/v1/payments",
            json=payload,
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 422


class TestPaymentList:
    """Test list payments endpoint."""

    def test_list_payments_success(self, client, owner_token):
        """List all payments."""
        response = client.get(
            "/api/v1/payments",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_list_payments_pagination(self, client, owner_token):
        """Pagination works."""
        response = client.get(
            "/api/v1/payments?page=1&page_size=10",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_list_payments_filter_by_date(self, client, owner_token):
        """Filter payments by date."""
        today = datetime.now().date().isoformat()
        response = client.get(
            f"/api/v1/payments?from_date={today}&to_date={today}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200

    def test_list_payments_filter_by_member(self, client, owner_token, test_member):
        """Filter by member."""
        response = client.get(
            f"/api/v1/payments?member_id={test_member.id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200


class TestPaymentDetail:
    """Test payment detail endpoint."""

    def test_get_payment_detail_success(self, client, owner_token, test_member):
        """Get payment detail."""
        create_response = client.post(
            "/api/v1/payments",
            json={
                "member_id": str(test_member.id),
                "amount": "1000.00",
                "payment_mode": "cash",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert create_response.status_code == 201
        payment_id = create_response.json()["id"]

        response = client.get(
            f"/api/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == payment_id


class TestDailyCollection:
    """Daily collection summary."""

    def test_daily_collection_success(self, client, owner_token):
        """Get daily collection."""
        today = datetime.now().date().isoformat()
        response = client.get(
            f"/api/v1/payments/daily?target_date={today}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_amount" in data
        assert "by_mode" in data
