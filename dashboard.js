/* ============================================================
   RESQ — COMMAND DASHBOARD ORCHESTRATION & MAP ENGINE
   Phase 2: MapLibre GL 3D (45° Pitch), Resizers, and Live Telemetry
============================================================ */

(function () {
    "use strict";

    /* ============================================================
       1. BOOTSTRAP & STATE VALIDATION
    ============================================================ */

    const rawSimulation = localStorage.getItem("resqSimulation");
    if (!rawSimulation) {
        window.location.href = "index.html";
        return;
    }

    let simulationConfig;
    try {
        simulationConfig = JSON.parse(rawSimulation);
    } catch (e) {
        console.error("Malformed simulation configuration in localStorage", e);
        window.location.href = "index.html";
        return;
    }

    const rules = window.DISASTER_RULES || {
        properties: {},
        impactModels: {},
        palettes: {},
        getCityType: () => "coastal",
    };

    // Initialize Simulation Engine
    const engine = new window.SimulationEngine(simulationConfig);

    /* ============================================================
       2. DOM REFERENCES
    ============================================================ */

    // Navbar
    const scenarioLocation = document.getElementById("scenarioLocation");
    const scenarioDisaster = document.getElementById("scenarioDisaster");
    const scenarioSeverityTag = document.getElementById("scenarioSeverityTag");
    const btnPlayPause = document.getElementById("btnPlayPause");
    const playPauseIcon = document.getElementById("playPauseIcon");
    const playPauseText = document.getElementById("playPauseText");
    const btnReset = document.getElementById("btnReset");
    const speedButtons = document.querySelectorAll(".speed-btn");
    const themeToggle = document.getElementById("themeToggle");

    // Overview Counters & AI
    const counterAffected = document.getElementById("counterAffected");
    const counterHospAvail = document.getElementById("counterHospAvail");
    const counterHospFull = document.getElementById("counterHospFull");
    const hospCapacityFill = document.getElementById("hospCapacityFill");
    const counterBlockedRoads = document.getElementById("counterBlockedRoads");
    const counterShelters = document.getElementById("counterShelters");
    const counterOutages = document.getElementById("counterOutages");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiGuidanceText = document.getElementById("aiGuidanceText");
    const aiTimestamp = document.getElementById("aiTimestamp");

    // Properties Panel
    const propertiesGrid = document.getElementById("propertiesGrid");
    const propsDisasterSubtitle = document.getElementById("propsDisasterSubtitle");
    const sevValueBadge = document.getElementById("sevValueBadge");
    const btnEscalate = document.getElementById("btnEscalate");
    const btnMitigate = document.getElementById("btnMitigate");

    // Map Telemetry
    const mapCoordsReadout = document.getElementById("mapCoordsReadout");
    const mapZoomReadout = document.getElementById("mapZoomReadout");
    const mapRadiusReadout = document.getElementById("mapRadiusReadout");
    const mapHudLayers = document.getElementById("mapHudLayers");

    // Splitters & Workspace
    const workspaceTop = document.getElementById("workspaceTop");
    const mapPanel = document.getElementById("mapPanel");
    const overviewPanel = document.getElementById("overviewPanel");
    const propertiesPanel = document.getElementById("propertiesPanel");
    const resizerV = document.getElementById("resizerV");
    const resizerH = document.getElementById("resizerH");

    // Mobile Tabs
    const tabMapBtn = document.getElementById("tabMapBtn");
    const tabPropsBtn = document.getElementById("tabPropsBtn");

    /* ============================================================
       3. THEME TOGGLE & SYNCHRONIZATION
    ============================================================ */

    function isLightMode() {
        return document.documentElement.classList.contains("light-mode") || document.body.classList.contains("light-mode");
    }

    function syncTheme() {
        const light = isLightMode();
        themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
        themeToggle.setAttribute("title", light ? "Switch to dark mode" : "Switch to light mode");
    }

    themeToggle?.addEventListener("click", () => {
        const willBeLight = !isLightMode();
        document.documentElement.classList.toggle("light-mode", willBeLight);
        document.body.classList.toggle("light-mode", willBeLight);
        localStorage.setItem("resq-theme", willBeLight ? "light" : "dark");
        syncTheme();
        updateMapThemeStyle();
    });

    syncTheme();

    /* ============================================================
       4. NAVBAR SCENARIO SETUP
    ============================================================ */

    scenarioLocation.textContent = `${simulationConfig.city}, ${simulationConfig.country}`;
    scenarioDisaster.textContent = simulationConfig.disaster.toUpperCase();

    const lat = simulationConfig.latitude;
    const lng = simulationConfig.longitude;
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    mapCoordsReadout.textContent = `${Math.abs(lat).toFixed(4)}° ${latDir} / ${Math.abs(lng).toFixed(4)}° ${lngDir}`;

    /* ============================================================
       5. MAPLIBRE GL JS 3D ENGINE INTEGRATION (45° PITCH)
    ============================================================ */

    let map = null;
    let mapMarkers = [];
    const layerVisibility = {
        roads: true,
        evac: true,
        hazard: true,
        hospitals: true,
        shelters: true,
        outages: true,
    };

    function getTileStyle(light) {
        // Free, zero-token OpenFreeMap vector styles with 3D buildings
        return light
            ? "https://tiles.openfreemap.org/styles/positron"
            : "https://tiles.openfreemap.org/styles/liberty";
    }

    function initMap() {
        const center = [lng, lat];

        try {
            map = new maplibregl.Map({
                container: "mapContainer",
                style: getTileStyle(isLightMode()),
                center: center,
                zoom: 14.2,
                pitch: 45, // Required 45° 3D perspective pitch
                bearing: -17.5,
                maxPitch: 70,
                antialias: true,
            });

            // Navigation Controls (Zoom/Pitch/Compass)
            map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

            map.on("load", () => {
                setup3DBuildings();
                renderMockDisasterLayers();
                spawnMapMarkers();
            });

            map.on("zoom", () => {
                if (mapZoomReadout) {
                    mapZoomReadout.textContent = map.getZoom().toFixed(2);
                }
            });

            map.on("error", (e) => {
                console.warn("MapLibre tile style warning, applying procedural resilience layer", e);
            });
        } catch (err) {
            console.error("MapLibre GL failed to initialize:", err);
            renderMapFallback(document.getElementById("mapContainer"), center);
        }
    }

    function updateMapThemeStyle() {
        if (!map) return;
        const styleUrl = getTileStyle(isLightMode());
        map.setStyle(styleUrl);
        map.once("style.load", () => {
            setup3DBuildings();
            renderMockDisasterLayers();
            spawnMapMarkers();
        });
    }

    /* ------------------------------------------------------------
       3D BUILDING EXTRUSIONS
    ------------------------------------------------------------ */
    function setup3DBuildings() {
        if (!map) return;

        // Add 3D procedural extruded buildings around the city center
        const mockBuildingFeatures = generateMock3DBuildings(lng, lat);
        
        if (map.getSource("procedural-3d-buildings")) {
            map.getSource("procedural-3d-buildings").setData(mockBuildingFeatures);
            return;
        }

        map.addSource("procedural-3d-buildings", {
            type: "geojson",
            data: mockBuildingFeatures,
        });

        map.addLayer({
            id: "3d-buildings-extrusion",
            source: "procedural-3d-buildings",
            type: "fill-extrusion",
            minzoom: 12,
            paint: {
                "fill-extrusion-color": isLightMode() ? "#b8c2c8" : "#1a2228",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.85,
            },
        });
    }

    /* ------------------------------------------------------------
       MOCK GEOJSON GENERATORS (ISOLATED FOR FUTURE BACKEND SWAP)
    ------------------------------------------------------------ */

    // MOCK DATA — replace with live backend feed
    function generateMock3DBuildings(centerLng, centerLat) {
        const features = [];
        const count = 35;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 0.003 + (i % 5) * 0.0022;
            const bLng = centerLng + Math.cos(angle) * dist * 1.3;
            const bLat = centerLat + Math.sin(angle) * dist;
            const size = 0.0006 + ((i % 3) * 0.0003);
            const height = 15 + ((i * 17) % 75);

            features.push({
                type: "Feature",
                properties: {
                    height: height,
                    min_height: 0,
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [bLng - size, bLat - size],
                        [bLng + size, bLat - size],
                        [bLng + size, bLat + size],
                        [bLng - size, bLat + size],
                        [bLng - size, bLat - size],
                    ]],
                },
            });
        }
        return { type: "FeatureCollection", features: features };
    }

    // MOCK DATA — replace with live backend feed
    function generateMockDisasterGeoJSON(centerLng, centerLat) {
        // Blocked Roads (Solid Red Line Layer)
        const blockedRoads = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { name: "Central Highway Arterial (Blocked)", status: "blocked" },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [centerLng - 0.012, centerLat + 0.008],
                            [centerLng - 0.004, centerLat + 0.003],
                            [centerLng + 0.006, centerLat - 0.002],
                            [centerLng + 0.014, centerLat - 0.006],
                        ],
                    },
                },
                {
                    type: "Feature",
                    properties: { name: "Low-lying Underpass Route 4 (Submerged)", status: "blocked" },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [centerLng - 0.006, centerLat - 0.010],
                            [centerLng - 0.002, centerLat - 0.003],
                            [centerLng + 0.002, centerLat + 0.006],
                        ],
                    },
                },
                {
                    type: "Feature",
                    properties: { name: "Bridge Overpass Debris Jam", status: "blocked" },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [centerLng + 0.005, centerLat + 0.011],
                            [centerLng + 0.009, centerLat + 0.004],
                            [centerLng + 0.016, centerLat + 0.002],
                        ],
                    },
                },
            ],
        };

        // Evacuation Routes (Solid Green Line Layer)
        const evacRoutes = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { name: "Primary North High-Ground Corridor", status: "clear" },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [centerLng - 0.015, centerLat - 0.008],
                            [centerLng - 0.012, centerLat + 0.002],
                            [centerLng - 0.008, centerLat + 0.014],
                            [centerLng - 0.002, centerLat + 0.020],
                        ],
                    },
                },
                {
                    type: "Feature",
                    properties: { name: "East Outer Ring Evacuation Highway", status: "clear" },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [centerLng + 0.002, centerLat - 0.016],
                            [centerLng + 0.012, centerLat - 0.012],
                            [centerLng + 0.018, centerLat + 0.005],
                            [centerLng + 0.022, centerLat + 0.018],
                        ],
                    },
                },
            ],
        };

        // Hazard Affected Zone (Yellow Translucent Polygon Overlay)
        const hazardRadius = 0.013;
        const hazardPoints = [];
        for (let i = 0; i <= 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const r = hazardRadius * (0.85 + Math.sin(angle * 3) * 0.15);
            hazardPoints.push([
                centerLng + Math.cos(angle) * r * 1.3,
                centerLat + Math.sin(angle) * r,
            ]);
        }
        const hazardZone = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { name: "Active Impact Hazard Zone", severity: "high" },
                    geometry: {
                        type: "Polygon",
                        coordinates: [hazardPoints],
                    },
                },
            ],
        };

        return { blockedRoads, evacRoutes, hazardZone };
    }

    /* ------------------------------------------------------------
       RENDER MAP LAYERS
    ------------------------------------------------------------ */
    function renderMockDisasterLayers() {
        if (!map) return;

        const data = generateMockDisasterGeoJSON(lng, lat);

        // 1. Hazard Zone (Translucent Yellow Polygon Overlay)
        if (!map.getSource("hazard-source")) {
            map.addSource("hazard-source", { type: "geojson", data: data.hazardZone });

            map.addLayer({
                id: "hazard-fill",
                source: "hazard-source",
                type: "fill",
                paint: {
                    "fill-color": "#f59e0b",
                    "fill-opacity": 0.22,
                },
            });

            map.addLayer({
                id: "hazard-line",
                source: "hazard-source",
                type: "line",
                paint: {
                    "line-color": "#f59e0b",
                    "line-width": 2,
                    "line-dasharray": [3, 2],
                },
            });
        }

        // 2. Blocked Roads (Solid Red Line Layer)
        if (!map.getSource("blocked-roads-source")) {
            map.addSource("blocked-roads-source", { type: "geojson", data: data.blockedRoads });

            map.addLayer({
                id: "blocked-roads-line",
                source: "blocked-roads-source",
                type: "line",
                paint: {
                    "line-color": "#ef4444",
                    "line-width": 4,
                    "line-opacity": 0.95,
                },
            });
        }

        // 3. Evacuation Routes (Solid Green Line Layer)
        if (!map.getSource("evac-routes-source")) {
            map.addSource("evac-routes-source", { type: "geojson", data: data.evacRoutes });

            map.addLayer({
                id: "evac-routes-line",
                source: "evac-routes-source",
                type: "line",
                paint: {
                    "line-color": "#10b981",
                    "line-width": 4.5,
                    "line-opacity": 0.95,
                },
            });
        }
    }

    /* ------------------------------------------------------------
       CUSTOM POI MARKERS (HOSPITALS, SHELTERS, OUTAGES)
    ------------------------------------------------------------ */
    function spawnMapMarkers() {
        // Clear existing markers
        mapMarkers.forEach(m => m.remove());
        mapMarkers = [];

        // MOCK DATA — replace with live backend feed
        const pois = [
            {
                type: "shelter",
                name: "Civic Stadium Relief Shelter",
                status: "Operational",
                capacity: "78% (1,450 / 1,800)",
                coords: [lng - 0.009, lat + 0.015],
                icon: "⌂",
                className: "marker-shelter",
            },
            {
                type: "shelter",
                name: "North Ridge High School Shelter",
                status: "Operational",
                capacity: "42% (620 / 1,500)",
                coords: [lng + 0.015, lat + 0.014],
                icon: "⌂",
                className: "marker-shelter",
            },
            {
                type: "hospital",
                name: "Apex Central Trauma Center",
                status: "Available",
                capacity: "Available (42 ICU beds free)",
                coords: [lng - 0.008, lat - 0.005],
                icon: "✚",
                className: "marker-hospital-avail",
            },
            {
                type: "hospital",
                name: "Metro District General Hospital",
                status: "Overloaded",
                capacity: "100% Full / Emergency Divert Active",
                coords: [lng + 0.006, lat - 0.004],
                icon: "✖",
                className: "marker-hospital-full",
            },
            {
                type: "outage",
                name: "East Grid Sector Sub-Station #3",
                status: "Offline",
                capacity: "Transformer Flood Submersion",
                coords: [lng + 0.004, lat + 0.008],
                icon: "⚡",
                className: "marker-outage",
            },
            {
                type: "outage",
                name: "South Rail Junction Power Relay",
                status: "Offline",
                capacity: "Feeder Line Severed",
                coords: [lng - 0.004, lat - 0.009],
                icon: "⚡",
                className: "marker-outage",
            },
        ];

        pois.forEach(poi => {
            const el = document.createElement("div");
            el.className = `map-marker ${poi.className}`;
            el.dataset.poiType = poi.type;
            el.innerHTML = `<span>${poi.icon}</span>`;
            el.title = `${poi.name} [${poi.status}]`;

            const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(`
                <div style="font-family: 'DM Mono', monospace; font-size: 10px; color: #111; padding: 4px;">
                    <strong>${poi.name}</strong><br>
                    <span style="color: #666;">Status: ${poi.status}</span><br>
                    <span style="font-size: 9px;">${poi.capacity}</span>
                </div>
            `);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat(poi.coords)
                .setPopup(popup)
                .addTo(map);

            mapMarkers.push(marker);
        });
    }

    /* ------------------------------------------------------------
       MAP LAYER TOGGLES (HUD BUTTONS)
    ------------------------------------------------------------ */
    mapHudLayers?.addEventListener("click", (e) => {
        const btn = e.target.closest(".layer-pill");
        if (!btn || !map) return;

        const layerKey = btn.dataset.layer;
        const isActive = btn.classList.toggle("active");
        layerVisibility[layerKey] = isActive;

        if (layerKey === "roads" && map.getLayer("blocked-roads-line")) {
            map.setLayoutProperty("blocked-roads-line", "visibility", isActive ? "visible" : "none");
        } else if (layerKey === "evac" && map.getLayer("evac-routes-line")) {
            map.setLayoutProperty("evac-routes-line", "visibility", isActive ? "visible" : "none");
        } else if (layerKey === "hazard") {
            if (map.getLayer("hazard-fill")) map.setLayoutProperty("hazard-fill", "visibility", isActive ? "visible" : "none");
            if (map.getLayer("hazard-line")) map.setLayoutProperty("hazard-line", "visibility", isActive ? "visible" : "none");
        } else if (layerKey === "hospitals" || layerKey === "shelters" || layerKey === "outages") {
            mapMarkers.forEach(m => {
                const el = m.getElement();
                if (el && el.dataset.poiType === (layerKey === "hospitals" ? "hospital" : layerKey === "shelters" ? "shelter" : "outage")) {
                    el.style.display = isActive ? "grid" : "none";
                }
            });
        }
    });

    /* ------------------------------------------------------------
       FALLBACK RENDERER (IF WEBGL UNAVAILABLE)
    ------------------------------------------------------------ */
    function renderMapFallback(container, center) {
        if (!container) return;
        container.innerHTML = `
            <div style="width:100%; height:100%; display:grid; place-items:center; background:#0d1115; color:#f4f5f6; font-family:'DM Mono', monospace; font-size:12px; text-align:center; padding:20px;">
                <div>
                    <div style="font-size:24px; margin-bottom:8px;">🗺️</div>
                    <div style="letter-spacing:0.16em; font-weight:700;">TACTICAL GEO-GRID ACTIVE</div>
                    <div style="color:rgba(255,255,255,0.4); margin-top:4px;">${simulationConfig.city}, ${simulationConfig.country} · ${center[1]}° N, ${center[0]}° E</div>
                    <div style="margin-top:12px; font-size:10px; color:#10b981;">3D Vector Layer Extrusion Emulation Initialized</div>
                </div>
            </div>
        `;
    }

    /* ============================================================
       6. DYNAMIC DISASTER PROPERTIES PANEL SLIDERS
    ============================================================ */

    function setupPropertiesPanel() {
        const disaster = simulationConfig.disaster.toLowerCase();
        const schema = rules.properties[disaster] || [];
        
        propsDisasterSubtitle.textContent = `${disaster.toUpperCase()} SIMULATION PARAMETERS · ADJUST LIVE DYNAMICS`;
        propertiesGrid.innerHTML = "";

        schema.forEach(prop => {
            const currentVal = engine.state.properties[prop.id] !== undefined
                ? engine.state.properties[prop.id]
                : prop.defaultValue;

            const field = document.createElement("div");
            field.className = "property-field";
            field.innerHTML = `
                <div class="prop-field-header">
                    <span class="prop-field-label">${prop.name}</span>
                    <span class="prop-field-val" id="val_${prop.id}">${currentVal} ${prop.unit}</span>
                </div>
                <div class="prop-slider-wrapper">
                    <input type="range" 
                        class="prop-slider" 
                        id="slider_${prop.id}" 
                        min="${prop.min}" 
                        max="${prop.max}" 
                        step="${prop.step}" 
                        value="${currentVal}" 
                        title="${prop.description}">
                </div>
            `;

            const slider = field.querySelector(`#slider_${prop.id}`);
            const valDisplay = field.querySelector(`#val_${prop.id}`);

            slider.addEventListener("input", (e) => {
                const val = parseFloat(e.target.value);
                valDisplay.textContent = `${val} ${prop.unit}`;
                engine.setProperty(prop.id, val);
            });

            propertiesGrid.appendChild(field);
        });
    }

    // Escalate & Mitigate Action Buttons
    btnEscalate?.addEventListener("click", () => {
        const disaster = simulationConfig.disaster.toLowerCase();
        const schema = rules.properties[disaster] || [];
        schema.forEach(p => {
            const current = engine.state.properties[p.id] || p.defaultValue;
            const next = Math.min(p.max, current + (p.max - p.min) * 0.15);
            engine.setProperty(p.id, parseFloat(next.toFixed(1)));
        });
        updatePropertySliderInputs();
    });

    btnMitigate?.addEventListener("click", () => {
        const disaster = simulationConfig.disaster.toLowerCase();
        const schema = rules.properties[disaster] || [];
        schema.forEach(p => {
            const current = engine.state.properties[p.id] || p.defaultValue;
            const next = Math.max(p.min, current - (p.max - p.min) * 0.15);
            engine.setProperty(p.id, parseFloat(next.toFixed(1)));
        });
        updatePropertySliderInputs();
    });

    function updatePropertySliderInputs() {
        const disaster = simulationConfig.disaster.toLowerCase();
        const schema = rules.properties[disaster] || [];
        schema.forEach(p => {
            const val = engine.state.properties[p.id];
            const slider = document.getElementById(`slider_${p.id}`);
            const display = document.getElementById(`val_${p.id}`);
            if (slider && val !== undefined) slider.value = val;
            if (display && val !== undefined) display.textContent = `${val} ${p.unit}`;
        });
    }

    /* ============================================================
       7. REACTIVE ENGINE SUBSCRIPTION (UI RE-RENDER)
    ============================================================ */

    engine.subscribe((state) => {
        // Update Overview Counters (Smooth animated ticks)
        animateValue(counterAffected, state.metrics.affectedPeople);
        animateValue(counterBlockedRoads, state.metrics.blockedRoads);
        animateValue(counterShelters, state.metrics.activeShelters);
        animateValue(counterOutages, state.metrics.powerOutages);

        // Hospitals
        if (counterHospAvail) counterHospAvail.textContent = state.metrics.hospitalsAvailable;
        if (counterHospFull) counterHospFull.textContent = state.metrics.hospitalsFull;
        if (hospCapacityFill) {
            const pct = Math.round((state.metrics.hospitalsFull / state.metrics.hospitalsTotal) * 100);
            hospCapacityFill.style.width = `${pct}%`;
        }

        // Severity Tag & Meter
        const sevStr = `SEV ${state.severity.toFixed(1)}`;
        if (scenarioSeverityTag) scenarioSeverityTag.textContent = sevStr;
        if (sevValueBadge) sevValueBadge.textContent = `${state.severity.toFixed(1)} / 5.0`;

        // AI Response Readout
        if (aiSummaryText && state.aiResponse.summary) {
            aiSummaryText.textContent = state.aiResponse.summary;
        }
        if (aiGuidanceText && state.aiResponse.guidance) {
            aiGuidanceText.textContent = state.aiResponse.guidance;
        }
        if (aiTimestamp && state.aiResponse.timestamp) {
            aiTimestamp.textContent = state.aiResponse.timestamp;
        }

        // Map radius telemetry
        if (mapRadiusReadout) {
            const rad = (3.2 * (state.severity / 2.5)).toFixed(1);
            mapRadiusReadout.textContent = `${rad} km`;
        }
    });

    function animateValue(elem, target) {
        if (!elem) return;
        const current = parseInt(elem.textContent.replace(/,/g, ""), 10) || 0;
        if (current === target) return;

        // Smooth increment step
        const diff = target - current;
        const step = Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) / 6));
        const next = current + step;

        elem.textContent = next.toLocaleString();
        if (next !== target) {
            requestAnimationFrame(() => animateValue(elem, target));
        }
    }

    /* ============================================================
       8. SIMULATION CONTROLS (PLAY/PAUSE/SPEED/RESET)
    ============================================================ */

    btnPlayPause?.addEventListener("click", () => {
        const isPaused = engine.togglePause();
        if (playPauseIcon) playPauseIcon.textContent = isPaused ? "▶" : "⏸";
        if (playPauseText) playPauseText.textContent = isPaused ? "RESUME" : "PAUSE";
    });

    speedButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            speedButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const speed = parseInt(btn.dataset.speed, 10) || 1;
            engine.setSpeed(speed);
        });
    });

    btnReset?.addEventListener("click", () => {
        engine.reset();
        updatePropertySliderInputs();
    });

    /* ============================================================
       9. DESKTOP DRAGGABLE PANEL SPLITTERS (RESIZERS)
    ============================================================ */

    // Vertical Splitter (Map vs Overview)
    let isDraggingV = false;
    resizerV?.addEventListener("mousedown", () => {
        isDraggingV = true;
        resizerV.classList.add("dragging");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    });

    // Horizontal Splitter (Top vs Bottom Properties)
    let isDraggingH = false;
    resizerH?.addEventListener("mousedown", () => {
        isDraggingH = true;
        resizerH.classList.add("dragging");
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (isDraggingV) {
            const containerRect = workspaceTop.getBoundingClientRect();
            const offset = e.clientX - containerRect.left;
            const pct = (offset / containerRect.width) * 100;
            // Clamp between 25% and 75%
            const clampedPct = Math.max(25, Math.min(75, pct));
            mapPanel.style.flex = `0 0 ${clampedPct}%`;
            overviewPanel.style.flex = `0 0 ${100 - clampedPct}%`;
            if (map) map.resize();
        } else if (isDraggingH) {
            const totalHeight = window.innerHeight - 54; // Navbar offset
            const propsHeight = totalHeight - e.clientY;
            // Clamp bottom panel height between 120px and 340px
            const clampedHeight = Math.max(120, Math.min(340, propsHeight));
            propertiesPanel.style.height = `${clampedHeight}px`;
            if (map) map.resize();
        }
    });

    document.addEventListener("mouseup", () => {
        if (isDraggingV) {
            isDraggingV = false;
            resizerV.classList.remove("dragging");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            if (map) map.resize();
        }
        if (isDraggingH) {
            isDraggingH = false;
            resizerH.classList.remove("dragging");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            if (map) map.resize();
        }
    });

    /* ============================================================
       10. MOBILE TAB SWITCHER (< 900px)
    ============================================================ */

    tabMapBtn?.addEventListener("click", () => {
        tabMapBtn.classList.add("active");
        tabPropsBtn.classList.remove("active");
        document.body.classList.remove("mobile-tab-props");
        if (map) setTimeout(() => map.resize(), 100);
    });

    tabPropsBtn?.addEventListener("click", () => {
        tabPropsBtn.classList.add("active");
        tabMapBtn.classList.remove("active");
        document.body.classList.add("mobile-tab-props");
    });

    /* ============================================================
       11. INITIALIZATION EXECUTION
    ============================================================ */

    setupPropertiesPanel();
    initMap();
    engine.start();

})();
