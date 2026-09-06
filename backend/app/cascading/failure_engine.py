"""Generic Cascading Failure and Infrastructure Dependency Engine."""

from typing import Dict, List, Any, Tuple
from ..core.logging import logger

class CascadingFailureEngine:
    def __init__(self, infrastructure: Dict[str, Any]):
        self.infrastructure = infrastructure
        self.events: List[Dict[str, Any]] = []

    def evaluate_cascading_effects(
        self,
        elapsed_seconds: int,
        hazard_model,
        origin_lat: float,
        origin_lng: float
    ) -> Dict[str, Any]:
        """
        Evaluate full cascade chain across power, hospitals, roads, bridges, and shelters.
        """
        self.events = []
        
        # 1. Evaluate Power Stations
        power_statuses = self._evaluate_power_grid(hazard_model, origin_lat, origin_lng, elapsed_seconds)
        
        # 2. Evaluate Bridges & Road Intersections
        bridge_statuses = self._evaluate_bridges(hazard_model, origin_lat, origin_lng, elapsed_seconds)
        road_statuses = self._evaluate_roads(hazard_model, origin_lat, origin_lng, elapsed_seconds, bridge_statuses)
        
        # 3. Evaluate Hospitals with Power Dependency & Casualties Influx
        hospital_statuses = self._evaluate_hospitals(hazard_model, origin_lat, origin_lng, elapsed_seconds, power_statuses)
        
        # 4. Evaluate Shelters & Evacuee Demand
        shelter_statuses = self._evaluate_shelters(hazard_model, origin_lat, origin_lng, elapsed_seconds)
        
        return {
            "power": power_statuses,
            "bridges": bridge_statuses,
            "roads": road_statuses,
            "hospitals": hospital_statuses,
            "shelters": shelter_statuses,
            "events": self.events
        }

    def _evaluate_power_grid(self, hazard, origin_lat, origin_lng, elapsed):
        results = []
        for station in self.infrastructure.get("powerStations", []):
            impact = hazard.evaluate_point_impact(
                station["latitude"],
                station["longitude"],
                origin_lat,
                origin_lng,
                elapsed
            )
            
            is_offline = False
            status = "OPERATIONAL"
            
            if impact["in_hazard_zone"]:
                if station.get("floodProne", False) and hazard.name in ("flood", "tsunami", "cyclone"):
                    status = "FLOODED_OUTAGE"
                    is_offline = True
                elif hazard.name == "earthquake" and impact.get("local_pga", 0) > 0.25:
                    status = "SEISMIC_TRIP"
                    is_offline = True
                elif hazard.name == "cyclone" and impact.get("wind_speed", 0) > 135:
                    status = "GRID_COLLAPSE"
                    is_offline = True
            
            if is_offline and elapsed > 30:
                self.events.append({
                    "type": "POWER_OUTAGE",
                    "assetId": station["id"],
                    "name": station["name"],
                    "message": f"Power substation {station['name']} tripped offline due to {status.lower()}."
                })
            
            results.append({
                "id": station["id"],
                "name": station["name"],
                "latitude": station["latitude"],
                "longitude": station["longitude"],
                "status": "OFFLINE" if is_offline else "OPERATIONAL",
                "failureMode": status,
                "supplies": station.get("supplies", []),
                "capacityMW": station.get("capacityMW", 100)
            })
        return results

    def _evaluate_bridges(self, hazard, origin_lat, origin_lng, elapsed):
        results = []
        for bridge in self.infrastructure.get("bridges", []):
            impact = hazard.evaluate_point_impact(
                bridge["latitude"],
                bridge["longitude"],
                origin_lat,
                origin_lng,
                elapsed
            )
            is_damaged = False
            status = "OPEN"
            
            if impact["in_hazard_zone"]:
                if hazard.name == "earthquake" and impact.get("local_pga", 0) > 0.35:
                    status = "COLLAPSED"
                    is_damaged = True
                elif hazard.name in ("flood", "tsunami") and impact["intensity"] > 0.6:
                    status = "SUBMERGED_CLOSED"
                    is_damaged = True
                elif hazard.name == "cyclone" and impact["intensity"] > 0.8:
                    status = "STRUCTURAL_RISK"
                    is_damaged = True

            if is_damaged:
                self.events.append({
                    "type": "BRIDGE_DAMAGED",
                    "bridgeId": bridge["id"],
                    "name": bridge["name"],
                    "status": status,
                    "message": f"Bridge {bridge['name']} closed: {status}."
                })
            
            results.append({
                "id": bridge["id"],
                "name": bridge["name"],
                "status": status,
                "is_closed": is_damaged
            })
        return results

    def _evaluate_roads(self, hazard, origin_lat, origin_lng, elapsed, bridge_statuses):
        results = []
        damaged_bridge_names = {b["name"].lower() for b in bridge_statuses if b["is_closed"]}

        for road in self.infrastructure.get("roads", []):
            is_blocked = False
            damage_state = "NONE"
            max_intensity = 0.0

            # Check if road passes over a damaged bridge
            road_name_lower = road["name"].lower()
            if any(bn in road_name_lower for bn in damaged_bridge_names):
                is_blocked = True
                damage_state = "SEVERE"

            # Check road coordinates against hazard impact
            for pt in road["coordinates"]:
                impact = hazard.evaluate_point_impact(pt[1], pt[0], origin_lat, origin_lng, elapsed)
                if impact["in_hazard_zone"]:
                    max_intensity = max(max_intensity, impact["intensity"])
                    if impact["blocked"]:
                        is_blocked = True
                        damage_state = impact["damage_state"]

            if is_blocked and elapsed > 20:
                self.events.append({
                    "type": "ROAD_BLOCKED",
                    "roadId": road["id"],
                    "name": road["name"],
                    "damageState": damage_state,
                    "message": f"Arterial corridor {road['name']} impassable: {damage_state}."
                })

            results.append({
                "id": road["id"],
                "name": road["name"],
                "blocked": is_blocked,
                "damageState": damage_state,
                "hazardExposure": round(max_intensity, 2),
                "coordinates": road["coordinates"]
            })
        return results

    def _evaluate_hospitals(self, hazard, origin_lat, origin_lng, elapsed, power_statuses):
        results = []
        # Find which power stations are offline
        offline_station_ids = {p["id"] for p in power_statuses if p["status"] == "OFFLINE"}

        # Total patient surge grows with time and hazard severity
        severity = hazard.calculate_severity()
        time_growth = 1.0 + (elapsed / 120.0)

        for hosp in self.infrastructure.get("hospitals", []):
            impact = hazard.evaluate_point_impact(
                hosp["latitude"],
                hosp["longitude"],
                origin_lat,
                origin_lng,
                elapsed
            )

            # Check if upstream power supplier is offline
            is_power_depleted = False
            for station in self.infrastructure.get("powerStations", []):
                if station["id"] in offline_station_ids and hosp["id"] in station.get("supplies", []):
                    # Battery backup holds for 60 seconds before power failure degradation
                    if elapsed > 60:
                        is_power_depleted = True

            total_beds = hosp["beds"]
            base_avail = hosp["availableBeds"]
            total_icu = hosp["icuBeds"]
            base_icu = hosp["availableIcu"]

            # Cascade: power outage cuts functional ICU and creates trauma bottleneck
            effective_capacity_factor = 0.50 if is_power_depleted else 1.0

            # Patient influx based on proximity to disaster origin
            dist_km = ((hosp["latitude"] - origin_lat)**2 + (hosp["longitude"] - origin_lng)**2)**0.5 * 111.0
            proximity_factor = max(0.2, 1.0 - (dist_km / 12.0))
            patient_influx = int(base_avail * 0.45 * (severity / 3.0) * proximity_factor * min(3.0, time_growth))

            cur_avail_beds = max(0, int(base_avail * effective_capacity_factor) - patient_influx)
            cur_avail_icu = max(0, int(base_icu * effective_capacity_factor) - int(patient_influx * 0.3))

            occupancy_pct = min(1.0, 1.0 - (cur_avail_beds / max(1, total_beds)))

            # Determine triage status
            if cur_avail_beds == 0 or occupancy_pct >= 0.96:
                status = "FULL"
            elif is_power_depleted:
                status = "COMPROMISED"
            elif occupancy_pct > 0.82:
                status = "STRESSED"
            elif occupancy_pct > 0.65:
                status = "NEAR_CAPACITY"
            else:
                status = "OPERATIONAL"

            if status in ("FULL", "COMPROMISED") and elapsed > 45:
                self.events.append({
                    "type": "HOSPITAL_STRESSED",
                    "hospitalId": hosp["id"],
                    "name": hosp["name"],
                    "status": status,
                    "message": f"Trauma facility {hosp['name']} reached capacity [{status}] - diverting emergency admissions."
                })

            results.append({
                "id": hosp["id"],
                "name": hosp["name"],
                "latitude": hosp["latitude"],
                "longitude": hosp["longitude"],
                "beds": total_beds,
                "availableBeds": cur_avail_beds,
                "icuBeds": total_icu,
                "availableIcu": cur_avail_icu,
                "powerStatus": "BACKUP_GENERATOR" if is_power_depleted else "GRID",
                "operationalStatus": status,
                "occupancyPct": round(occupancy_pct * 100, 1),
                "address": hosp.get("address", "")
            })
        return results

    def _evaluate_shelters(self, hazard, origin_lat, origin_lng, elapsed):
        results = []
        severity = hazard.calculate_severity()
        time_growth = min(2.5, 1.0 + (elapsed / 150.0))

        for shelter in self.infrastructure.get("shelters", []):
            impact = hazard.evaluate_point_impact(
                shelter["latitude"],
                shelter["longitude"],
                origin_lat,
                origin_lng,
                elapsed
            )

            capacity = shelter["capacity"]
            base_occ = shelter["occupancy"]

            # Influx increases as civilians evacuate toward operational refuge
            influx = int(capacity * 0.15 * (severity / 2.5) * time_growth)
            current_occ = min(capacity, base_occ + influx)
            rem_cap = max(0, capacity - current_occ)
            pct = current_occ / max(1, capacity)

            status = "FULL" if rem_cap == 0 else "OPERATIONAL"
            if impact["in_hazard_zone"] and impact["blocked"]:
                status = "INACCESSIBLE"

            results.append({
                "id": shelter["id"],
                "name": shelter["name"],
                "latitude": shelter["latitude"],
                "longitude": shelter["longitude"],
                "capacity": capacity,
                "occupancy": current_occ,
                "remainingCapacity": rem_cap,
                "status": status,
                "occupancyPct": round(pct * 100, 1),
                "address": shelter.get("address", "")
            })
        return results
