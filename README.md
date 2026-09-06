# RESQ — AI-Powered Disaster Simulation & Evacuation Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-v4.7.1-3969EC.svg?logo=maplibre&logoColor=white)](https://maplibre.org)
[![OpenFreeMap](https://img.shields.io/badge/Tiles-OpenFreeMap-brightgreen)](https://openfreemap.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**RESQ** is a full-stack disaster management and evacuation simulation platform. It models real-world hazard physics, simulates multi-order cascading infrastructure failures across power grids, hospitals, and communication networks, calculates dynamic safest-path evacuation routes using network graphs, and streams real-time telemetry over WebSockets to a high-performance 3D vector map powered by **OpenFreeMap** and **MapLibre GL JS** — completely free and keyless.

---

## Key Features

- **Disaster Simulation**
  - Floods
  - Earthquakes
  - Cyclones
  - Tsunamis
  - Disaster-specific physical parameters and progression models

- **Cascading Infrastructure Failures**
  - Models dependencies between power, communications, hospitals, and transportation.
  - Simulates multi-stage infrastructure degradation during disasters.

- **Dynamic Evacuation Routing**
  - Uses OpenStreetMap-derived road networks and NetworkX.
  - Calculates safer evacuation routes based on distance, hazard exposure, road capacity, and blockages.
  - Dynamically adapts routes as disaster conditions change.

- **Interactive 3D Map**
  - MapLibre GL JS with OpenFreeMap.
  - No Mapbox API key required.
  - 3D building visualization and 45° map perspective.
  - Live visualization of:
    - Hazard zones
    - Blocked roads
    - Evacuation routes
    - Hospitals
    - Shelters
    - Power outages
  - Interactive disaster-origin and earthquake-epicenter selection.

- **Real-Time Simulation**
  - FastAPI backend with WebSocket telemetry.
  - Live updates for affected population, infrastructure status, shelter capacity, casualties, and disaster progression.

- **AI Situation Intelligence**
  - Generates structured situation briefings.
  - Provides evacuation recommendations and tactical resource-allocation guidance based on the current simulation state.

## System Flow

```text
User
  ↓
RESQ Web Interface
  ↓
City + Disaster Selection
  ↓
Simulation Configuration
  ↓
FastAPI Backend
  ↓
Disaster Simulation Engine
  ↓
Hazard Propagation
  ↓
Infrastructure Impact & Cascading Failures
  ↓
Evacuation Route Calculation
  ↓
AI Situation Analysis
  ↓
Real-Time WebSocket Updates
  ↓
RESQ Dashboard
  ↓
MapLibre GL JS + OpenFreeMap
  ↓
Live Disaster Map & Evacuation Guidance
