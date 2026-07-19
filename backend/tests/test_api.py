from fastapi.testclient import TestClient

from backend.app import app
from backend.config import Settings, get_settings
from backend.features import DEFAULT_FACTORS


app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, data_mode="mock")
client = TestClient(app)


def test_health():
    assert client.get("/health").status_code == 200


def test_market_is_explicitly_mock():
    response = client.get("/api/market")
    assert response.status_code == 200
    assert response.json()["status"]["is_mock"] is True
    assert response.json()["stocks"]


def test_prediction_contract():
    response = client.post("/api/model/train-and-predict", json={"model": "random_forest", "factors": DEFAULT_FACTORS, "top_n": 5})
    assert response.status_code == 200
    assert len(response.json()["items"]) == 5


def test_factor_count_validation():
    response = client.post("/api/model/train-and-predict", json={"factors": ["pe_ttm"]})
    assert response.status_code == 422

