"""Tsunami Disaster Simulation Model."""

import math
from typing import Dict, Any
from .base import BaseDisaster
from ..geospatial.spatial import haversine_distance_km

DEFAULT_TSUNAMI_PROPS = [
    {"id": "waveHeight", "name": "WAVE RUN-UP HEIGHT", "unit": "m", "min": 1.0, "max": 25.0, "step": 0.5, "defaultValue": 7.5},
    {"id": "inundationDist", "name": "INUNDATION DISTANCE", "unit": "km", "min": 0.2, "max": 8.0, "step": 0.1, "defaultValue": 2.8},
    {"id": "waveVelocity", "name": "WAVE VELOCITY", "unit": "km/h", "min": 20, "max": 120, "step": 2, "defaultValue": 55}
]

class TsunamiDisaster(BaseDisaster):
    def __init__(self, properties: Dict[str, float]):
        super().__init__("tsunami", properties, DEFAULT_TSUNAMI_PROPS)

    def calculate_severity(self) -> float:
        height = self.properties.get("waveHeight", 7.5)
        dist = self.properties.get("inundationDist", 2.8)
        vel = self.properties.get("waveVelocity", 55.0)

        norm_h = (height - 1.0) / (25.0 - 1.0)
        norm_d = (dist - 0.2) / (8.0 - 0.2)
        norm_v = (vel - 20.0) / (120.0 - 20.0)

        avg_norm = (norm_h * 0.45 + norm_d * 0.35 + norm_v * 0.20)
        sev = 1.0 + avg_norm * 4.0
        return round(min(5.0, max(1.0, sev)), 2)

    def calculate_hazard_radius_km(self, elapsed_seconds: int) -> float:
        inundation = self.properties.get("inundationDist", 2.8)
        # Propagation from ocean origin inland
        if elapsed_seconds < 30:
            return 0.5
        elif elapsed_seconds < 180:
            growth = (elapsed_seconds - 30) / 150.0
            return round(0.5 + (inundation * growth), 2)
        else:
            # Water remains saturated with slow drainage
            return round(inundation + 0.5, 2)

    def evaluate_point_impact(
        self,
        lat: float,
        lng: float,
        origin_lat: float,
        origin_lng: float,
        elapsed_seconds: int
    ) -> Dict[str, Any]:
        dist_km = haversine_distance_km(lat, lng, origin_lat, origin_lng)
        current_reach = self.calculate_hazard_radius_km(elapsed_seconds)

        if dist_km > current_reach or elapsed_seconds < 30:
            return {
                "in_hazard_zone": False,
                "intensity": 0.0,
                "surge_height": 0.0,
                "blocked": False,
                "damage_state": "NONE"
            }

        wave_height = self.properties.get("waveHeight", 7.5)
        # Scouring energy is highest at the immediate coast line
        coastal_decay = max(0.0, 1.0 - (dist_km / max(0.2, current_reach)))
        local_height = wave_height * coastal_decay

        is_blocked = local_height > 0.8
        damage_state = "NONE"
        if local_height > 5.0:
            damage_state = "DESTROYED"
        elif local_height > 2.5:
            damage_state = "SEVERE"
        elif local_height > 1.0:
            damage_state = "MODERATE"
        elif local_height > 0.4:
            damage_state = "MINOR"

        return {
            "in_hazard_zone": True,
            "intensity": round(coastal_decay, 3),
            "surge_height": round(local_height, 2),
            "blocked": is_blocked,
            "damage_state": damage_state
        }
