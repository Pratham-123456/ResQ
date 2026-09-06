"""Integration tests for REST API endpoints and simulation clock controls."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_cities():
    response = client.get("/api/v1/cities")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) >= 2
    city_names = [c["name"].lower() for c in cities]
    assert "delhi" in city_names
    assert "chennai" in city_names

def test_city_compatibility_rejection():
    # Delhi is landlocked, should reject cyclone
    payload = {
        "city": "Delhi",
        "disaster": "cyclone"
    }
    response = client.post("/api/v1/scenarios", json=payload)
    assert response.status_code == 400

def test_create_scenario_and_simulation_lifecycle():
    # Create valid Chennai Cyclone scenario
    scenario_payload = {
        "city": "Chennai",
        "disaster": "cyclone",
        "origin": {"latitude": 13.0827, "longitude": 80.2707},
        "properties": {"windSpeed": 180, "stormSurge": 3.5, "rainfall": 70},
        "seed": 42
    }
    sc_resp = client.post("/api/v1/scenarios", json=scenario_payload)
    assert sc_resp.status_code == 200
    scenario = sc_resp.json()
    scenario_id = scenario["id"]
    assert scenario["city"] == "Chennai"
    assert scenario["disaster"] == "cyclone"

    # Instantiate simulation
    sim_resp = client.post("/api/v1/simulations", json={"scenarioId": scenario_id})
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    sim_id = sim_data["simulationId"]
    assert sim_data["status"] == "INITIALIZED"

    # Start simulation
    start_resp = client.post(f"/api/v1/simulations/{sim_id}/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "RUNNING"

    # Pause simulation
    pause_resp = client.post(f"/api/v1/simulations/{sim_id}/pause")
    assert pause_resp.status_code == 200
    assert pause_resp.json()["status"] == "PAUSED"

    # Resume simulation
    resume_resp = client.post(f"/api/v1/simulations/{sim_id}/resume")
    assert resume_resp.status_code == 200
    assert resume_resp.json()["status"] == "RUNNING"

    # Reset simulation
    reset_resp = client.post(f"/api/v1/simulations/{sim_id}/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["elapsedSeconds"] == 0

def test_map_data_endpoints():
    response = client.get("/api/v1/cities/chennai/map")
    assert response.status_code == 200
    data = response.json()
    assert "buildings" in data
    assert "roads" in data
    assert "pois" in data
    assert data["buildings"]["type"] == "FeatureCollection"
