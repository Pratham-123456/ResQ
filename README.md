# RESQ — AI-Powered Disaster Simulation & Evacuation Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-v4.7.1-3969EC.svg?logo=maplibre&logoColor=white)](https://maplibre.org)
[![OpenFreeMap](https://img.shields.io/badge/Tiles-OpenFreeMap-brightgreen)](https://openfreemap.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**RESQ** is a full-stack disaster management and evacuation simulation platform. It models real-world hazard physics, simulates multi-order cascading infrastructure failures across power grids, hospitals, and communication networks, calculates dynamic safest-path evacuation routes using network graphs, and streams real-time telemetry over WebSockets to a high-performance 3D vector map powered by **OpenFreeMap** and **MapLibre GL JS** — completely free and keyless.

---

## 🌟 Key Capabilities

- **Physics-Informed Disaster Engines**:
  - **Floods**: Terrain elevation diffusion, runoff rates, rainfall-driven water volume propagation.
  - **Earthquakes**: Gutenberg-Richter magnitude, attenuation curves, Mercalli intensity, and soil liquefaction.
  - **Cyclones**: Eye-wall pressure drop, Holland parametric wind-field equations, storm surge calculations.
  - **Tsunamis**: Shallow-water wave shoaling, coastal run-up heights, inundation distance contours.
- **Cascading Infrastructure Failure Engine**:
  - Multi-order dependency analysis: Power Grid failure -> Telecom Tower blackout -> Hospital backup reliance -> Road capacity drop.
  - Dynamic survival probability scoring and health/status degradation.
- **Dynamic Graph Evacuation Routing**:
  - OpenStreetMap-derived road networks weighted by distance, hazard exposure, and capacity.
  - Real-time road blockage avoidance (roads within flood/hazard polygons or rubble zones are dynamically removed or heavily penalized).
  - Multi-destination safest-path evacuation to designated emergency shelters and relief camps using NetworkX.
- **Interactive 3D Map (Zero API Keys Needed)**:
  - Powered by **OpenFreeMap** (\liberty\ and \positron\ vector styles) and **MapLibre GL JS**.
  - 3D building extrusions with dynamic 45° pitch and lighting.
  - Real-time animated hazard boundary buffers, active evacuation corridors, blocked road segments, and emergency POI markers.
  - Interactive origin pin-drop mode: click anywhere on the map to calculate customized evacuation routes.
- **Live WebSocket Telemetry**:
  - Real-time broadcast of simulation steps, casualty estimates, shelter capacity stats, and cascading failure events.
- **AI Briefings & Tactical Recommendations**:
  - Structured situation reports, evacuation status updates, and priority resource allocation advice.

---

## 🏗️ Architecture Overview

\                        ┌──────────────────────────────────────────────┐
                        │               Browser Client                 │
                        │  (MapLibre GL 3D, OpenFreeMap, Vanilla JS)   │
                        └──────────────┬───────────────────────────────┘
                                       │
                      REST Requests    │    WebSocket Stream
                      (HTTP /api/...)  │    (/ws/simulations/{id})
                                       ▼
                        ┌──────────────────────────────────────────────┐
                        │             FastAPI Backend                  │
                        ├──────────────────────────────────────────────┤
                        │  • Simulation Engine (Tick loop & state)    │
                        │  • Disaster Physics (Flood, Quake, etc.)     │
                        │  • Cascading Failure Engine (Dependencies)  │
                        │  • Graph Routing Engine (NetworkX)           │
                        │  • Geospatial Utilities & OSM Parser         │
                        │  • AI Briefing Service                       │
                        └──────────────────────────────────────────────┘
\
---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Modern Web Browser (Chrome, Edge, Firefox, Safari)

### 2. Backend Setup

\\ash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
\The backend API is now live at \http://localhost:8000\.  
Swagger interactive documentation is available at \http://localhost:8000/docs\.

### 3. Frontend Setup

In another terminal:
\\ash
# From the project root
python -m http.server 3000
\Open your browser and navigate to:
**\http://localhost:3000\** (or \http://localhost:3000/dashboard.html\)

---

## 🐳 Docker Deployment

Run the entire platform using Docker Compose:

\\ash
docker-compose up --build
\- Frontend: \http://localhost:3000- Backend API: \http://localhost:8000- Interactive API Docs: \http://localhost:8000/docs
---

## 🧪 Automated Testing

Execute the backend test suite:

\\ash
pytest backend/tests -v
\
Test coverage includes:
- Disaster physics propagation & geometry generation
- Cascading failure multi-order dependency chains
- NetworkX evacuation routing & obstacle avoidance
- REST endpoints and WebSocket simulation lifecycle

---

## 🗺️ Supported Geospatial Regions

1. **Delhi NCR, India**:
   - Focus: Inland riverine flooding (Yamuna basin), earthquake fault seismic zones.
   - Pre-indexed OSM roads, relief camps, power stations, and medical centers.
2. **Chennai, India**:
   - Focus: Coastal cyclone storm surge, tsunami inundation, urban flash floods.
   - Pre-indexed coastal barriers, tsunami shelters, and arterial road networks.

---

## 📄 License

This project is licensed under the MIT License.
