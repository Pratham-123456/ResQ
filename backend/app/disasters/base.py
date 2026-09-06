"""Base Disaster Class for all natural hazard models."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple
from ..geospatial.spatial import haversine_distance_km

class BaseDisaster(ABC):
    def __init__(self, name: str, properties: Dict[str, float], default_properties: Dict[str, Any]):
        self.name = name.lower()
        self.default_properties = default_properties
        self.properties = {}
        for prop in default_properties:
            pid = prop["id"]
            self.properties[pid] = properties.get(pid, prop["defaultValue"])

    @abstractmethod
    def calculate_severity(self) -> float:
        """Calculate overall severity index from 1.0 to 5.0 based on parameter values."""
        pass

    @abstractmethod
    def calculate_hazard_radius_km(self, elapsed_seconds: int) -> float:
        """Calculate current hazard envelope radius in kilometers."""
        pass

    @abstractmethod
    def evaluate_point_impact(
        self,
        lat: float,
        lng: float,
        origin_lat: float,
        origin_lng: float,
        elapsed_seconds: int
    ) -> Dict[str, Any]:
        """Evaluate hazard intensity, exposure, and damage probability at a specific coordinate."""
        pass

    def get_progress_phase(self, elapsed_seconds: int) -> str:
        """Return qualitative lifecycle phase."""
        if elapsed_seconds < 60:
            return "ONSET"
        elif elapsed_seconds < 300:
            return "PEAK_INTENSIFICATION"
        elif elapsed_seconds < 600:
            return "STABILIZATION"
        else:
            return "RECOVERY"
