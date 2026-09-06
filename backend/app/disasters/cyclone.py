"""Cyclone Disaster Simulation Model."""

import math
from typing import Dict, Any
from .base import BaseDisaster
from ..geospatial.spatial import haversine_distance_km

DEFAULT_CYCLONE_PROPS = [
    {"id": "windSpeed", "name": "MAX SUSTAINED WINDS", "unit": "km/h", "min": 70, "max": 280, "step": 5, "defaultValue": 175},
    {"id": "stormSurge", "name": "STORM SURGE HEIGHT", "unit": "m", "min": 0.5, "max": 8.0, "step": 0.2, "defaultValue": 3.2},
    {"id": "rainfall", "name": "RAINFALL INTENSITY", "unit": "mm/h", "min": 15, "max": 140, "step": 5, "defaultValue": 65}
]

class CycloneDisaster(BaseDisaster):
    def __init__(self, properties: Dict[str, float]):
        super().__init__("cyclone", properties, DEFAULT_CYCLONE_PROPS)

    def calculate_severity(self) -> float:
        wind = self.properties.get("windSpeed", 175.0)
        surge = self.properties.get("stormSurge", 3.2)
        rain = self.properties.get("rainfall", 65.0)

        norm_wind = (wind - 70.0) / (280.0 - 70.0)
        norm_surge = (surge - 0.5) / (8.0 - 0.5)
        norm_rain = (rain - 15.0) / (140.0 - 15.0)

        avg_norm = (norm_wind * 0.45 + norm_surge * 0.35 + norm_rain * 0.20)
        sev = 1.0 + avg_norm * 4.0
        return round(min(5.0, max(1.0, sev)), 2)

    def calculate_hazard_radius_km(self, elapsed_seconds: int) -> float:
        wind = self.properties.get("windSpeed", 175.0)
        surge = self.properties.get("stormSurge", 3.2)

        # Tropical cyclone envelope is large (6 to 16 km)
        max_radius = 5.0 + (wind / 30.0) + (surge * 0.5)
        
        # Lifecycle progression: approach -> landfall at t=90s -> peak at t=240s -> weakening
        if elapsed_seconds < 90:
            factor = 0.3 + (elapsed_seconds / 90.0) * 0.5
        elif elapsed_seconds < 240:
            factor = 0.8 + ((elapsed_seconds - 90) / 150.0) * 0.2
        else:
            factor = max(0.45, 1.0 - ((elapsed_seconds - 240) * 0.0008))

        return round(max_radius * factor, 2)

    def evaluate_point_impact(
        self,
        lat: float,
        lng: float,
        origin_lat: float,
        origin_lng: float,
        elapsed_seconds: int
    ) -> Dict[str, Any]:
        dist_km = haversine_distance_km(lat, lng, origin_lat, origin_lng)
        current_radius = self.calculate_hazard_radius_km(elapsed_seconds)

        if dist_km > current_radius:
            return {
                "in_hazard_zone": False,
                "intensity": 0.0,
                "wind_speed": 0.0,
                "storm_surge": 0.0,
                "blocked": False,
                "damage_state": "NONE"
            }

        rel_dist = dist_km / max(0.1, current_radius)
        # Cyclone wind profile peaks near eyewall
        eyewall_dist = 0.2
        if rel_dist < eyewall_dist:
            intensity = 0.7 + (rel_dist / eyewall_dist) * 0.3
        else:
            intensity = max(0.1, 1.0 - (rel_dist - eyewall_dist) / (1.0 - eyewall_dist))

        local_wind = self.properties.get("windSpeed", 175.0) * intensity
        local_surge = self.properties.get("stormSurge", 3.2) * (1.0 - rel_dist)

        # High winds (> 130 km/h) uproot trees and bring down overhead powerlines
        is_blocked = (local_wind > 130.0) or (local_surge > 1.2)
        
        damage_state = "NONE"
        if local_wind > 190.0:
            damage_state = "SEVERE"
        elif local_wind > 140.0:
            damage_state = "MODERATE"
        elif local_wind > 90.0:
            damage_state = "MINOR"

        return {
            "in_hazard_zone": True,
            "intensity": round(intensity, 3),
            "wind_speed": round(local_wind, 1),
            "storm_surge": round(local_surge, 2),
            "blocked": is_blocked,
            "damage_state": damage_state
        }
