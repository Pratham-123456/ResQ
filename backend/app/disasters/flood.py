"""Flood Disaster Simulation Model."""

import math
from typing import Dict, Any
from .base import BaseDisaster
from ..geospatial.spatial import haversine_distance_km

DEFAULT_FLOOD_PROPS = [
    {"id": "waterDepth", "name": "WATER DEPTH", "unit": "m", "min": 0.2, "max": 6.0, "step": 0.1, "defaultValue": 1.8},
    {"id": "velocity", "name": "FLOW VELOCITY", "unit": "m/s", "min": 0.1, "max": 4.5, "step": 0.1, "defaultValue": 1.4},
    {"id": "duration", "name": "INUNDATION DURATION", "unit": "hrs", "min": 2, "max": 72, "step": 1, "defaultValue": 18}
]

class FloodDisaster(BaseDisaster):
    def __init__(self, properties: Dict[str, float]):
        super().__init__("flood", properties, DEFAULT_FLOOD_PROPS)

    def calculate_severity(self) -> float:
        depth = self.properties.get("waterDepth", 1.8)
        velocity = self.properties.get("velocity", 1.4)
        duration = self.properties.get("duration", 18.0)

        norm_depth = (depth - 0.2) / (6.0 - 0.2)
        norm_vel = (velocity - 0.1) / (4.5 - 0.1)
        norm_dur = (duration - 2.0) / (72.0 - 2.0)

        avg_norm = (norm_depth * 0.45 + norm_vel * 0.35 + norm_dur * 0.20)
        sev = 1.0 + avg_norm * 4.0
        return round(min(5.0, max(1.0, sev)), 2)

    def calculate_hazard_radius_km(self, elapsed_seconds: int) -> float:
        depth = self.properties.get("waterDepth", 1.8)
        velocity = self.properties.get("velocity", 1.4)
        duration_hrs = self.properties.get("duration", 18.0)

        # Growth over simulated time up to peak radius
        max_radius = 2.5 + (depth * 0.8) + (velocity * 0.4)
        time_factor = min(1.0, math.log1p(elapsed_seconds / 60.0) / math.log1p(10.0))
        
        # In recovery phase (elapsed > 400s), flood waters slowly recede
        if elapsed_seconds > 400:
            recession = max(0.4, 1.0 - (elapsed_seconds - 400) * 0.001)
            return round(max_radius * time_factor * recession, 2)

        return round(max_radius * time_factor, 2)

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
                "water_depth": 0.0,
                "blocked": False,
                "damage_state": "NONE"
            }

        # Water depth attenuates from epicenter outward
        proximity_ratio = max(0.0, 1.0 - (dist_km / max(0.1, current_radius)))
        local_depth = self.properties.get("waterDepth", 1.8) * proximity_ratio

        # Road submergence: blocked if depth > 0.45m
        is_blocked = local_depth > 0.45
        
        damage_state = "NONE"
        if local_depth > 2.5:
            damage_state = "SEVERE"
        elif local_depth > 1.2:
            damage_state = "MODERATE"
        elif local_depth > 0.45:
            damage_state = "MINOR"

        return {
            "in_hazard_zone": True,
            "intensity": round(proximity_ratio, 3),
            "water_depth": round(local_depth, 2),
            "blocked": is_blocked,
            "damage_state": damage_state
        }
