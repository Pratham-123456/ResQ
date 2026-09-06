"""Spatial math and geometry helpers for disaster calculations."""

import math
from typing import List, Tuple

EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def point_in_bbox(lat: float, lon: float, bbox: List[float]) -> bool:
    """Check if point is inside bounding box [min_lon, min_lat, max_lon, max_lat]."""
    min_lon, min_lat, max_lon, max_lat = bbox
    return (min_lon <= lon <= max_lon) and (min_lat <= lat <= max_lat)

def create_hazard_circle_polygon(center_lng: float, center_lat: float, radius_km: float, num_points: int = 32) -> List[List[float]]:
    """Generate GeoJSON Polygon coordinates for a hazard circular impact zone."""
    coords = []
    # 1 deg latitude is approx 111 km
    lat_deg_per_km = 1.0 / 110.574
    # 1 deg longitude depends on latitude
    lon_deg_per_km = 1.0 / (111.320 * math.cos(math.radians(center_lat)))

    for i in range(num_points + 1):
        angle = (i / num_points) * 2.0 * math.pi
        # Introduce subtle organic contour variation
        variance = 1.0 + 0.12 * math.sin(angle * 3.0) + 0.08 * math.cos(angle * 2.0)
        r = radius_km * variance
        pt_lat = center_lat + (math.sin(angle) * r * lat_deg_per_km)
        pt_lon = center_lng + (math.cos(angle) * r * lon_deg_per_km)
        coords.append([round(pt_lon, 6), round(pt_lat, 6)])

    return coords
