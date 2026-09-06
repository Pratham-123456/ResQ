# RESQ — Backend Architecture & Engine Documentation

## 1. Overview
The RESQ backend is a Python FastAPI service designed to drive natural disaster simulations, multi-hazard cascades, and real-time evacuation logistics for municipal emergency operations. It serves as the single source of authoritative simulation state for the RESQ command center.

---

## 2. Directory Structure
```
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint & middleware
│   ├── api/
│   │   ├── routes/
│   │   │   ├── cities.py           # City metadata & OSM static infrastructure
│   │   │   ├── scenarios.py        # Scenario creation & origin updates
│   │   │   ├── simulations.py      # Simulation lifecycle control (start/pause/speed/etc.)
│   │   │   └── map.py              # GeoJSON endpoints for Mapbox layers
│   │   └── websocket.py            # Real-time WebSocket streaming (/ws/simulations/{id})
│   ├── core/
│   │   ├── config.py               # Environment configuration settings
│   │   └── logging.py              # Structured logging
│   ├── geospatial/
│   │   ├── osm.py                  # OpenStreetMap loader and cache
│   │   ├── spatial.py              # Haversine distance, polygon contours & bbox
│   │   └── routing.py              # NetworkX road graph with dynamic edge weights
│   ├── disasters/
│   │   ├── base.py                 # Abstract base disaster class
│   │   ├── flood.py                # Hydraulic simulation & road submergence
│   │   ├── earthquake.py           # Joyner-Boore seismic attenuation & damage states
│   │   ├── cyclone.py              # Aerodynamic wind & storm surge inland penetration
│   │   └── tsunami.py              # Hydrodynamic wave run-up & coastal scouring
│   ├── cascading/
│   │   └── failure_engine.py       # Generic dependency & cascading failure engine
│   ├── evacuation/
│   │   └── engine.py               # Dynamic evacuation routing to available shelters
│   ├── ai/
│   │   └── service.py              # AI situational briefing (Gemini / rule synthesis)
│   └── schemas/
│       └── schemas.py              # Pydantic schemas
├── data/
│   └── osm/
│       ├── delhi_infrastructure.json     # Real OSM infrastructure dataset for Delhi
│       └── chennai_infrastructure.json   # Real OSM infrastructure dataset for Chennai
├── tests/
│   ├── test_disasters.py           # Disaster models & compatibility tests
│   ├── test_routing.py             # NetworkX road graph & blockage avoidance tests
│   ├── test_cascading.py           # Cascading failure dependency tests
│   └── test_api.py                 # REST endpoint integration tests
├── Dockerfile                      # Container build definition
├── docker-compose.yml              # Multi-container stack (PostGIS + Redis + Backend)
├── requirements.txt                # Python dependencies
└── .env.example                    # Environment variable template
```

---

## 3. Disaster Simulation Physics
All disaster models derive from `BaseDisaster` and implement:
- `calculate_severity()`: Normalized scale from 1.0 to 5.0.
- `calculate_hazard_radius_km(elapsed_seconds)`: Time-varying growth and recovery curves.
- `evaluate_point_impact(lat, lng, origin_lat, origin_lng, elapsed_seconds)`: Coordinate-level impact intensity, local hazard value, damage state, and road blockage.

### Supported Hazards:
1. **Flood**:
   - Parameters: Water Depth (m), Flow Velocity (m/s), Inundation Duration (hrs).
   - Roads submerge when local water depth $> 0.45\text{ m}$. Low-lying transformers and substations flood.
2. **Earthquake**:
   - Parameters: Peak Ground Acceleration (PGA in g), Duration (s), Epicenter Depth (km).
   - Attenuates with hypocentral distance $R = \sqrt{D^2 + d^2}$. Damage states: NONE, MINOR, MODERATE, SEVERE, DESTROYED.
3. **Cyclone**:
   - Parameters: Max Sustained Winds (km/h), Storm Surge (m), Rainfall (mm/h).
   - Eyewall wind field modeling, storm surge coastal flooding, uprooted trees, and power line fractures.
4. **Tsunami**:
   - Parameters: Wave Run-Up Height (m), Inundation Distance (km), Wave Velocity (km/h).
   - Coastal wave propagation and shoreline scouring of expressways, harbors, and low-lying transit corridors.

---

## 4. Cascading Failure Engine
Dependencies are evaluated every simulated tick:
- **Power Substation Outage**: Triggered by flood water submergence, severe seismic shock, or cyclone wind forces.
- **Hospital Trauma Surge & Power Cascade**: Power failure switches trauma facilities to emergency backup generators. After battery depletion, ICU and available triage bed capacities drop by 50%, shifting facilities to `STRESSED`, `NEAR_CAPACITY`, or `FULL`, diverting ambulances to secondary hospitals.
- **Bridge Failure**: Closes connected arterial corridors and severs transit across river basins.
- **Shelter Saturation**: Civilians evacuate into designated shelters, filling them progressively; inaccessible or full shelters redirect evacuees.

---

## 5. Road Network & Evacuation Engine
- Converts OSM road coordinates into an undirected `networkx.Graph`.
- Edge weights represent travel distance in meters.
- When a road segment is blocked by flood waters, seismic debris, or downed lines, the edge weight is set to $10^9$.
- Dijkstra shortest-path algorithms route civilian populations from affected zones to open shelters, dynamically calculating detours around blocked road corridors.

---

## 6. AI Decision Support
- Constructs grounded situational briefings and operational directives directly from active simulation telemetry.
- Integrates with Google Gemini API when `GEMINI_API_KEY` is provided.
- Employs a deterministic, rule-based crisis synthesis fallback when external AI services are offline.
