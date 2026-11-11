from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_unauthorized_profile():
    response = client.get("/api/v1/user/profile")
    assert response.status_code == 403 # No auth header provided
