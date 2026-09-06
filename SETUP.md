# RESQ — Setup & Execution Guide

## 1. Prerequisites
- Python 3.10+ (Python 3.14 tested)
- Modern web browser (Chrome, Edge, Firefox, or Safari) with WebGL support
- Optional: Docker and Docker Compose (for PostgreSQL/PostGIS & Redis)

---

## 2. Fast Local Setup (Quick Start)

### Step 1: Install Backend Dependencies
```bash
python -m pip install -r backend/requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to supply your **Mapbox Access Token** (obtainable free at [account.mapbox.com](https://account.mapbox.com)):
```env
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InlvdXJ0b2tlbiJ9...
```
*(Optional: add `GEMINI_API_KEY` for live generative situation briefings).*

### Step 3: Run the Backend Service
From the project root directory:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will start and log:
```
[RESQ.resq]: Loaded OSM infrastructure for Chennai
Uvicorn running on http://0.0.0.0:8000
```
Interactive OpenAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Step 4: Open the Frontend
Open `index.html` in your browser (or use Python's built-in HTTP server):
```bash
python -m http.server 3000
```
Navigate to:
```
http://localhost:3000/index.html
```

---

## 3. Docker Compose Setup (Optional)
To run the full stack with PostgreSQL/PostGIS, Redis, and Backend in Docker:
```bash
docker-compose up --build
```

---

## 4. Running Automated Tests
Run the automated test suite with pytest:
```bash
python -m pytest backend/tests -v
```
Expected output:
```
backend/tests/test_api.py::test_health_check PASSED
backend/tests/test_api.py::test_get_cities PASSED
backend/tests/test_api.py::test_city_compatibility_rejection PASSED
backend/tests/test_api.py::test_create_scenario_and_simulation_lifecycle PASSED
backend/tests/test_api.py::test_map_data_endpoints PASSED
backend/tests/test_cascading.py::test_flood_power_to_hospital_cascade PASSED
backend/tests/test_disasters.py::test_city_compatibility PASSED
backend/tests/test_disasters.py::test_flood_simulation_model PASSED
backend/tests/test_disasters.py::test_earthquake_simulation_model PASSED
backend/tests/test_disasters.py::test_cyclone_simulation_model PASSED
backend/tests/test_disasters.py::test_tsunami_simulation_model PASSED
backend/tests/test_routing.py::test_road_network_routing PASSED
backend/tests/test_routing.py::test_road_blockage_prevents_traversal PASSED
backend/tests/test_routing.py::test_alternate_route_recalculation PASSED
======================= 14 passed in 1.21s =======================
```

---

## 5. Acceptance Test Verification Workflows

### Scenario 1: Chennai Cyclone
1. Open `index.html`, select **Chennai** and **Cyclone**. Click **INITIALIZE SIMULATION**.
2. On the dashboard, verify the 3D Mapbox perspective view loaded at ~45° pitch.
3. In the bottom Disaster Properties panel, click **SET ORIGIN ON MAP**.
4. Click a location off the Chennai coastline or near Marina Beach. Verify the origin target marker appears.
5. Click **START SIMULATION**.
6. Observe:
   - Wind speed and storm surge expand the hazard zone (yellow polygon).
   - Coastal and arterial roads turn red (blocked).
   - Electrical substations trip offline.
   - Hospital ICU beds saturate; full hospitals change to crossed-out icons (`✖`).
   - Evacuation routes (green lines) adapt dynamically away from blocked roads.
   - Real-time AI Situational Synthesis and Evacuation Guidance update.
7. Test **PAUSE**, **RESUME**, **2x / 5x**, and **RESET**.

### Scenario 2: Delhi Earthquake
1. Open `index.html`, select **Delhi** and **Earthquake**.
2. Click **SET ORIGIN ON MAP** and place the epicenter in Central Delhi.
3. Click **START SIMULATION**.
4. Observe seismic attenuation, bridge structural damage, road obstructions, trauma surge at AIIMS/Safdarjung, and rerouted evacuation corridors.
