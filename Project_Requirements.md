# RESQ — Project Requirements Document

## 1. Overview & Problem Statement
RESQ is an AI-powered disaster intelligence and emergency simulation platform. It enables incident response teams, municipal coordinators, and emergency management planners to simulate cascading urban impacts of extreme natural disasters in real-time. By projecting critical asset failures (hospital capacity exhaustion, road gridlock, power grid outages, and shelter influx), RESQ assists commanders in deploying life-saving evacuation strategies before crises peak.

---

## 2. Target Users & Scenarios
- **Emergency Management Commanders**: Need bird's-eye situational awareness, real-time asset casualty/overload status, and immediate evacuation corridor prioritization.
- **Municipal Planners & Responders**: Require fine-grained control over disaster variables (e.g. wave height, seismic acceleration, storm surge) to model hazard frontiers.
- **Public Safety Analysts**: Rely on synthesized AI-driven plain-language intelligence briefings and automated operational guidance.

---

## 3. Core Functional Requirements

### 3.1 Landing Page (Phase 1 — Locked Reference)
- Global geocoding and country/city autocomplete search.
- Interactive live canvas animations visualizing tsunami waves, cyclone winds, earthquake fault cracks, and flood levels.
- Landlocked vs. coastal geographic compatibility validation.
- Simulation initialization with local persistence (`resqSimulation`).

### 3.2 Command Dashboard (Phase 2 — Current Focus)
- **Zero-Scroll Single Screen Execution**: Complete operational cockpit rendered in 100vh viewport with no page scroll.
- **Desktop 3-Panel Draggable Architecture**:
  1. **Map Panel (Left)**: MapLibre GL JS 3D perspective at 45° pitch with 3D buildings, blocked road network, evacuation corridors, hazard contour zones, and status-tagged POIs (hospitals, shelters, power outages).
  2. **Overview Panel (Right)**: Animated live-ticking telemetry counters and dual-part dynamic AI situational summary + actionable evacuation instructions.
  3. **Disaster Properties Panel (Bottom)**: Live property sliders and telemetry monitors tailored to the active disaster.
  4. **Resizable Splitters**: Draggable vertical and horizontal borders allowing fluid panel dimension adjustments.
- **Mobile Adaptive View**:
  - Vertical responsive stack (< 900px).
  - Tabbed top section switching between Map and Disaster Properties.
  - Overview panel anchored underneath.
- **Disaster Cascading Simulation Engine**:
  - Time-advancing simulation loop (tick-based).
  - Progressive escalation of affected populations, infrastructure outages, and route obstructions.
  - Interactive play/pause, speed acceleration (1x, 2x, 5x), and scenario reset controls.
- **Universal Visual Continuity**:
  - Exact preservation of Phase 1 styling: glassmorphic panels, corner brackets (`.corner.tl/.tr/.bl/.br`), uppercase letter-spaced micro-labels, and dual dark/light theme with light-mode dark-green ready accent (`#1f6b3a`).

---

## 4. Disaster Taxonomy & Rules

| Disaster | Landlocked | Coastal | Core Parameters |
|---|---|---|---|
| **Flood** | ✅ | ✅ | Water Depth (m), Velocity (m/s), Duration (hrs) |
| **Earthquake** | ✅ | ✅ | Peak Ground Acceleration (PGA in g), Duration (s), Epicenter Depth (km) |
| **Cyclone** | ❌ | ✅ | Max Sustained Winds (km/h), Storm Surge (m), Rainfall Rate (mm/h) |
| **Tsunami** | ❌ | ✅ | Wave Height (m), Inundation Distance (km), Wave Velocity (km/h) |
