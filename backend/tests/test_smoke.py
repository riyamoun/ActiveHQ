from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "running"
    assert payload["name"] == "ActiveHQ"


def test_health_endpoints():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

    detailed = client.get("/health/detailed")
    assert detailed.status_code == 200
    assert detailed.json()["services"]["api"] == "healthy"


def test_setup_database_requires_key():
    response = client.get("/setup-database")
    assert response.status_code == 403


def test_auth_login_contract_validation():
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


def test_protected_biometric_route_requires_auth():
    response = client.get("/api/v1/biometric/devices")
    assert response.status_code in (401, 403)
