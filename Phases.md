# RESQ — Implementation Phases & Roadmap

## Phase 1: Landing Page (Completed & Locked Reference)
- [x] High-contrast satellite background with dim overlay, subtle 70px grid, and radar sweep.
- [x] Hero headline: "SEE. SIMULATE. RESPOND." with outlined middle word.
- [x] Location autocomplete via `countries.dev` API with country & city search.
- [x] Live interactive canvas disaster effects (Tsunami, Cyclone, Earthquake, Flood).
- [x] Glass control panel with corner brackets, mono labels, and simulation launcher.
- [x] Persistent Dark/Light theme toggle with light-mode dark-green ready accent (`#1f6b3a`).
- [x] Simulation payload serialization to `localStorage.setItem("resqSimulation", ...)`.

---

## Phase 2: Command Dashboard (Current Focus)
- [x] Documentation Suite (`memory.md`, `Project_Requirements.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`).
- [ ] Disaster data rules engine (`/data/disaster-rules.js`) with city classification, parameters, and damage vocabulary.
- [ ] Landlocked-vs-coastal constraint check integrated into `script.js`.
- [ ] Command dashboard layout (`dashboard.html`, `dashboard.css`, `dashboard.js`):
  - [ ] Zero-scroll 100vh 3-panel resizable layout (Map left, Overview right, Properties bottom).
  - [ ] MapLibre GL 3D integration at 45° pitch with 3D buildings, blocked roads, safe routes, hazard zones, and POIs.
  - [ ] Overview panel with real-time animated counters and dynamic AI situation + evacuation briefing.
  - [ ] Disaster properties panel with interactive sliders and telemetry meters.
  - [ ] Mobile responsive layout with tabbed Map/Properties switcher above Overview.
  - [ ] Simulation engine (`simulation-engine.js`) with timeline loop and play/pause/speed controls.
  - [ ] Theme synchronization between landing and dashboard without flash.

---

## Phase 3: Live Backend & AI Integration (Future Roadmap)
- [ ] Live geospatial routing service replacing mock GeoJSON corridors.
- [ ] Real-time LLM streaming API integration for situation analysis.
- [ ] Multi-agency coordination and collaborative incident logging.
