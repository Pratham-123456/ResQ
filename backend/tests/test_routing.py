"""Unit tests for NetworkX road graph and dynamic evacuation routing."""

import pytest
from backend.app.geospatial.routing import RoadNetwork
from backend.app.evacuation.engine import EvacuationEngine

def test_road_network_routing():
    """Verify route finding across unblocked roads."""
    sample_roads = [
        {
            "id": "rd-1",
            "name": "Arterial A",
            "speedKmh": 60,
            "blocked": False,
            "coordinates": [[80.20, 13.00], [80.22, 13.02], [80.24, 13.04]]
        },
        {
            "id": "rd-2",
            "name": "Arterial B",
            "speedKmh": 50,
            "blocked": False,
            "coordinates": [[80.24, 13.04], [80.26, 13.06], [80.28, 13.08]]
        }
    ]

    net = RoadNetwork(sample_roads)
    route = net.get_evacuation_route(80.20, 13.00, 80.28, 13.08)
    assert route is not None
    assert len(route) >= 3

def test_road_blockage_prevents_traversal():
    """Verify that blocked roads are not traversed by routing."""
    sample_roads = [
        {
            "id": "rd-direct",
            "name": "Direct Road (Blocked)",
            "speedKmh": 60,
            "blocked": True,
            "coordinates": [[80.20, 13.00], [80.28, 13.08]]
        }
    ]

    net = RoadNetwork(sample_roads)
    route = net.get_evacuation_route(80.20, 13.00, 80.28, 13.08)
    # Cannot traverse single blocked road
    assert route is None

def test_alternate_route_recalculation():
    """Verify routing selects clear alternate path when primary is blocked."""
    sample_roads = [
        {
            "id": "rd-primary",
            "name": "Primary (Blocked)",
            "speedKmh": 60,
            "blocked": True,
            "coordinates": [[80.20, 13.00], [80.24, 13.04], [80.28, 13.08]]
        },
        {
            "id": "rd-bypass-1",
            "name": "Bypass Leg 1",
            "speedKmh": 50,
            "blocked": False,
            "coordinates": [[80.20, 13.00], [80.22, 13.08]]
        },
        {
            "id": "rd-bypass-2",
            "name": "Bypass Leg 2",
            "speedKmh": 50,
            "blocked": False,
            "coordinates": [[80.22, 13.08], [80.28, 13.08]]
        }
    ]

    net = RoadNetwork(sample_roads)
    route = net.get_evacuation_route(80.20, 13.00, 80.28, 13.08)
    assert route is not None
    # Verify the route used the bypass coordinates
    has_bypass_midpoint = any(abs(pt[0] - 80.22) < 0.001 and abs(pt[1] - 13.08) < 0.001 for pt in route)
    assert has_bypass_midpoint is True
