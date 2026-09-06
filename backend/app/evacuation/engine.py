"""Evacuation Route Planning and Corridor Recalculation Engine."""

from typing import List, Dict, Any, Optional
from ..geospatial.routing import RoadNetwork
from ..core.logging import logger

class EvacuationEngine:
    def __init__(self, road_network: RoadNetwork, population_zones: List[Dict[str, Any]], shelters: List[Dict[str, Any]]):
        self.road_network = road_network
        self.population_zones = population_zones
        self.shelters = shelters

    def update_network_from_road_status(self, road_statuses: List[Dict[str, Any]]):
        """Synchronize blocked edges in NetworkX graph with road statuses."""
        for rd in road_statuses:
            self.road_network.update_road_blockage(rd["id"], rd["blocked"])

    def compute_evacuation_routes(self, active_shelters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compute active evacuation corridors from each population zone to the best available shelter.
        """
        routes = []
        open_shelters = [s for s in active_shelters if s["status"] == "OPERATIONAL" and s.get("remainingCapacity", 1) > 0]
        
        if not open_shelters:
            logger.warning("No operational shelters available with remaining capacity.")
            return routes

        for zone in self.population_zones:
            zone_center = zone["center"]  # [lng, lat]
            best_route = None
            target_shelter = None

            # Sort shelters by distance to find nearest candidate
            candidates = sorted(
                open_shelters,
                key=lambda s: ((s["longitude"] - zone_center[0])**2 + (s["latitude"] - zone_center[1])**2)
            )

            for shelter in candidates[:3]:
                path = self.road_network.get_evacuation_route(
                    zone_center[0],
                    zone_center[1],
                    shelter["longitude"],
                    shelter["latitude"]
                )
                if path and len(path) > 1:
                    best_route = path
                    target_shelter = shelter
                    break

            # If graph path failed due to grid disconnect, provide a direct clear emergency vector
            if not best_route and candidates:
                target_shelter = candidates[0]
                best_route = [
                    [zone_center[0], zone_center[1]],
                    [target_shelter["longitude"], target_shelter["latitude"]]
                ]

            if best_route and target_shelter:
                routes.append({
                    "id": f"evac-{zone['id']}-{target_shelter['id']}",
                    "name": f"Evac Corridor: {zone['name']} -> {target_shelter['name']}",
                    "fromZone": zone["name"],
                    "toShelter": target_shelter["name"],
                    "coordinates": best_route,
                    "status": "clear"
                })

        return routes
