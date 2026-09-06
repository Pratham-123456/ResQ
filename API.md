# RESQ — REST & WebSocket API Specification

## Base URL
- Local: `http://localhost:8000/api/v1`
- WebSocket: `ws://localhost:8000/ws/simulations/{simulationId}`

---

## 1. System & Configuration

### `GET /`
Service heartbeat.
```json
{
  "status": "online",
  "service": "RESQ Disaster Intelligence Platform",
  "version": "2.0.0"
}
```

### `GET /healthz`
Kubernetes/container liveness probe (`200 OK`).

### `GET /api/v1/config`
Retrieves client configuration including Mapbox token.
```json
{
  "mapboxAccessToken": "pk.xxx",
  "version": "2.0.0",
  "supportedCities": ["Delhi", "Chennai"]
}
```

---

## 2. Cities & Infrastructure

### `GET /api/v1/cities`
List all supported cities with boundaries and disaster capabilities.

### `GET /api/v1/cities/{cityId}`
Retrieve complete static OSM infrastructure for a city (hospitals, shelters, roads, bridges, power stations).

### `GET /api/v1/cities/{cityId}/map`
Returns GeoJSON FeatureCollections for buildings, roads, and POIs for initial map rendering.

---

## 3. Scenarios & Origin

### `POST /api/v1/scenarios`
Create a validated scenario.
```json
{
  "city": "Chennai",
  "disaster": "cyclone",
  "origin": {
    "latitude": 13.0827,
    "longitude": 80.2707
  },
  "properties": {
    "windSpeed": 180,
    "stormSurge": 3.5,
    "rainfall": 70
  },
  "seed": 42
}
```

### `GET /api/v1/scenarios/{scenarioId}`
Retrieve scenario configuration.

### `PATCH /api/v1/scenarios/{scenarioId}/origin`
Update epicenter or hazard source coordinates.
```json
{
  "latitude": 13.0500,
  "longitude": 80.2800
}
```

---

## 4. Simulations

### `POST /api/v1/simulations`
Instantiate a simulation from a scenario.
```json
{
  "scenarioId": "uuid-string"
}
```

### `GET /api/v1/simulations/{id}/state`
Retrieve comprehensive simulation state snapshot.

### Control Endpoints:
- `POST /api/v1/simulations/{id}/start` — Start clock.
- `POST /api/v1/simulations/{id}/pause` — Pause clock.
- `POST /api/v1/simulations/{id}/resume` — Resume clock.
- `POST /api/v1/simulations/{id}/reset` — Reset timeline to $t=0$.
- `POST /api/v1/simulations/{id}/stop` — Stop simulation.
- `PATCH /api/v1/simulations/{id}/speed` — Update speed: `{"speed": 2}` (1, 2, or 5).
- `PATCH /api/v1/simulations/{id}/properties` — Update dynamic disaster parameters: `{"properties": {"waterDepth": 2.8}}`.
- `PATCH /api/v1/simulations/{id}/origin` — Update epicenter coordinates: `{"latitude": 13.08, "longitude": 80.27}`.

---

## 5. Map GeoJSON Layers

- `GET /api/v1/simulations/{id}/roads` — GeoJSON LineString collection with `blocked` status.
- `GET /api/v1/simulations/{id}/hazards` — GeoJSON Polygon of current hazard envelope.
- `GET /api/v1/simulations/{id}/evacuation-routes` — GeoJSON LineString collection of clear evacuation routes.

---

## 6. WebSocket Protocol (`/ws/simulations/{simulationId}`)

### Server -> Client Messages:

#### Initial State (`simulation.init`):
```json
{
  "event": "simulation.init",
  "simulationId": "uuid-string",
  "state": { ... }
}
```

#### Real-Time Tick Delta (`simulation.tick`):
Sent once per second during active simulation:
```json
{
  "event": "simulation.tick",
  "simulationId": "uuid-string",
  "simulationTime": 120,
  "status": "RUNNING",
  "severity": 3.4,
  "hazardRadiusKm": 4.2,
  "metrics": {
    "affectedPopulation": 14200,
    "availableHospitals": 4,
    "fullHospitals": 2,
    "totalHospitals": 6,
    "blockedRoads": 5,
    "activeShelters": 4,
    "totalShelters": 5,
    "powerOutages": 2
  },
  "hazardPolygon": [ [80.27, 13.08], ... ],
  "roads": [ { "id": "chn-rd-1", "blocked": true, ... } ],
  "hospitals": [ ... ],
  "shelters": [ ... ],
  "power": [ ... ],
  "evacuationRoutes": [ ... ],
  "aiResponse": {
    "summary": "...",
    "guidance": "...",
    "threats": [ ... ],
    "priorities": [ ... ],
    "timestamp": "14:22:10"
  },
  "events": [ ... ]
}
```

### Client -> Server Action Commands:
- `{"action": "start"}`
- `{"action": "pause"}`
- `{"action": "resume"}`
- `{"action": "reset"}`
- `{"action": "speed", "value": 2}`
- `{"action": "properties", "value": {"windSpeed": 200}}`
- `{"action": "origin", "latitude": 13.05, "longitude": 80.28}`
