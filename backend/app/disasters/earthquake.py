"""Earthquake Disaster Simulation Model."""

import math
from typing import Dict, Any
from .base import BaseDisaster
from ..geospatial.spatial import haversine_distance_km

DEFAULT_QUAKE_PROPS = [
    {"id": "pga", "name": "PEAK GROUND ACCEL (PGA)", "unit": "g", "min": 0.05, "max": 1.25, "step": 0.02, "defaultValue": 0.42},
    {"id": "duration", "name": "SHAKING DURATION", "unit": "s", "min": 5, "max": 120, "step": 1, "defaultValue": 38},
    {"id": "depth", "name": "EPICENTER DEPTH", "unit": "km", "min": 5, "max": 70, "step": 1, "defaultValue": 12}
]

class EarthquakeDisaster(BaseDisaster):
    def __init__(self, properties: Dict[str, float]):
        super().__init__("earthquake", properties, DEFAULT_QUAKE_PROPS)

    def calculate_severity(self) -> float:
        pga = self.properties.get("pga", 0.42)
        dur = self.properties.get("duration", 38.0)
        depth = self.properties.get("depth", 12.0)

        norm_pga = (pga - 0.05) / (1.25 - 0.05)
        norm_dur = (dur - 5.0) / (120.0 - 5.0)
        norm_depth = 1.0 - ((depth - 5.0) / (70.0 - 5.0))  # shallower is more severe

        avg_norm = (norm_pga * 0.55 + norm_dur * 0.25 + norm_depth * 0.20)
        sev = 1.0 + avg_norm * 4.0
        return round(min(5.0, max(1.0, sev)), 2)

    def calculate_hazard_radius_km(self, elapsed_seconds: int) -> float:
        pga = self.properties.get("pga", 0.42)
        depth = self.properties.get("depth", 12.0)

        # Ground shaking envelope expands rapidly in first 30 seconds
        max_radius = 4.0 + (pga * 6.5) + (30.0 / depth)
        propagation_time = min(1.0, elapsed_seconds / 25.0)
        return round(max_radius * propagation_time, 2)

    def evaluate_point_impact(
        self,
        lat: float,
        lng: float,
        origin_lat: float,
        origin_lng: float,
        elapsed_seconds: int
    ) -> Dict[str, Any]:
        epicentral_dist = haversine_distance_km(lat, lng, origin_lat, origin_lng)
        focal_depth = self.properties.get("depth", 12.0)
        hypo_dist = math.sqrt(epicentral_dist ** 2 + focal_depth ** 2)

        peak_pga = self.properties.get("pga", 0.42)
        # Standard seismic attenuation: PGA decays with hypocentral distance
        attenuation = focal_depth / hypo_dist
        local_pga = peak_pga * (attenuation ** 1.3)

        current_radius = self.calculate_hazard_radius_km(elapsed_seconds)
        in_zone = epicentral_dist <= current_radius and local_pga >= 0.08

        # Building and road damage states
        damage_state = "NONE"
        is_blocked = False

        if in_zone:
            if local_pga > 0.60:
                damage_state = "DESTROYED"
                is_blocked = True
            elif local_pga > 0.40:
                damage_state = "SEVERE"
                is_blocked = True
            elif local_pga > 0.22:
                damage_state = "MODERATE"
                is_blocked = (elapsed_seconds > 45) # Aftershocks block roads
            elif local_pga > 0.10:
                damage_state = "MINOR"

        return {
            "in_hazard_zone": in_zone,
            "intensity": round(min(1.0, local_pga / 1.0), 3),
            "local_pga": round(local_pga, 3),
            "blocked": is_blocked,
            "damage_state": damage_state
        }
