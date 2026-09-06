"""Road Network Graph and Routing Engine using NetworkX."""

import networkx as nx
from typing import List, Dict, Any, Tuple, Optional
from .spatial import haversine_distance_km
from ..core.logging import logger

class RoadNetwork:
    def __init__(self, roads_data: List[Dict[str, Any]]):
        self.roads_data = roads_data
        self.graph = nx.Graph()
        self.node_coords: Dict[str, Tuple[float, float]] = {}  # node_id -> (lng, lat)
        self.edge_roads: Dict[Tuple[str, str], str] = {}  # (u, v) -> road_id
        self._build_graph()

    def _build_graph(self):
        """Construct the NetworkX graph from OSM road line segments."""
        for road in self.roads_data:
            road_id = road["id"]
            coords = road["coordinates"]
            speed = road.get("speedKmh", 50)
            is_blocked = road.get("blocked", False)

            for i in range(len(coords) - 1):
                pt1 = coords[i]
                pt2 = coords[i + 1]

                node1 = f"{round(pt1[0], 5)}_{round(pt1[1], 5)}"
                node2 = f"{round(pt2[0], 5)}_{round(pt2[1], 5)}"

                self.node_coords[node1] = (pt1[0], pt1[1])
                self.node_coords[node2] = (pt2[0], pt2[1])

                dist_km = haversine_distance_km(pt1[1], pt1[0], pt2[1], pt2[0])
                base_time_hours = dist_km / max(10, speed)
                base_weight = dist_km * 1000.0  # meters

                # If blocked, assign an effectively infinite weight so Dijkstra won't traverse it
                weight = 1e9 if is_blocked else base_weight

                self.graph.add_edge(
                    node1,
                    node2,
                    road_id=road_id,
                    length_km=dist_km,
                    weight=weight,
                    blocked=is_blocked
                )
                self.edge_roads[(node1, node2)] = road_id
                self.edge_roads[(node2, node1)] = road_id

    def update_road_blockage(self, road_id: str, blocked: bool):
        """Update blocked status of edges associated with road_id."""
        for u, v, data in self.graph.edges(data=True):
            if data.get("road_id") == road_id:
                data["blocked"] = blocked
                data["weight"] = 1e9 if blocked else (data["length_km"] * 1000.0)

    def find_nearest_node(self, lng: float, lat: float) -> Optional[str]:
        """Find the nearest graph node to given coordinates."""
        if not self.node_coords:
            return None
        min_dist = float("inf")
        nearest = None
        for node, (n_lng, n_lat) in self.node_coords.items():
            d = haversine_distance_km(lat, lng, n_lat, n_lng)
            if d < min_dist:
                min_dist = d
                nearest = node
        return nearest

    def get_evacuation_route(self, start_lng: float, start_lat: float, end_lng: float, end_lat: float) -> Optional[List[List[float]]]:
        """Find shortest unblocked path between start and end coordinates."""
        start_node = self.find_nearest_node(start_lng, start_lat)
        end_node = self.find_nearest_node(end_lng, end_lat)

        if not start_node or not end_node or start_node == end_node:
            return None

        try:
            path = nx.shortest_path(self.graph, source=start_node, target=end_node, weight="weight")
            # Verify path does not contain blocked edges
            for i in range(len(path) - 1):
                edge_data = self.graph.get_edge_data(path[i], path[i + 1])
                if edge_data and edge_data.get("blocked", False):
                    return None  # Route traversed blocked segment

            coords = [list(self.node_coords[node]) for node in path]
            return coords
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None
