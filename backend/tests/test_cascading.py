"""Unit tests for cascading failure propagation."""

import pytest
from backend.app.disasters.flood import FloodDisaster
from backend.app.cascading.failure_engine import CascadingFailureEngine

def test_flood_power_to_hospital_cascade():
    """Verify that substation flood damage impacts hospital capacity."""
    mock_infrastructure = {
        "powerStations": [
            {
                "id": "pwr-1",
                "name": "Riverfront Substation",
                "latitude": 13.08,
                "longitude": 80.27,
                "floodProne": True,
                "supplies": ["hosp-1"],
                "capacityMW": 150
            }
        ],
        "bridges": [],
        "roads": [],
        "hospitals": [
            {
                "id": "hosp-1",
                "name": "General Hospital",
                "latitude": 13.09,
                "longitude": 80.28,
                "beds": 500,
                "availableBeds": 150,
                "icuBeds": 50,
                "availableIcu": 20,
                "powerStatus": "GRID",
                "operationalStatus": "OPERATIONAL"
            }
        ],
        "shelters": []
    }

    engine = CascadingFailureEngine(mock_infrastructure)
    hazard = FloodDisaster({"waterDepth": 3.5, "velocity": 2.2, "duration": 24})

    # At t=90s, power substation is flooded and hospital battery depletes
    results = engine.evaluate_cascading_effects(
        elapsed_seconds=90,
        hazard_model=hazard,
        origin_lat=13.08,
        origin_lng=80.27
    )

    power = results["power"][0]
    hospital = results["hospitals"][0]

    assert power["status"] == "OFFLINE"
    assert hospital["powerStatus"] == "BACKUP_GENERATOR"
    # Available beds and ICU drop due to power depletion
    assert hospital["availableBeds"] < 150
