# RESQ — Master Build Prompt (Dashboard Phase)

> Paste this whole document as the system/task prompt for whichever AI coding agent (Claude Code, Cursor, Gemini, etc.) builds the next phase of RESQ. It is self-contained: stack, existing assets, data rules, UI spec, and file-by-file deliverables.

---

## 0. Project in one line

RESQ is an AI-powered disaster simulation and command-center web app. A user picks a country/city and a disaster type on a landing page, hits **Initialize Simulation**, and is dropped into a single-screen, no-scroll **command dashboard** that visualizes a cascading disaster (roads blocking, hospitals overloading, power failing, shelters filling) with an AI-generated situation summary and evacuation guidance.

This prompt covers **Phase 2: the Dashboard** — the landing page (Phase 1) already exists and must not be redesigned, only extended.

---

## 0.5 AI SESSION MEMORY PROTOCOL — READ THIS FIRST

**`/memory.md` is the first file every AI coding agent must read before starting any task.**

The purpose of `memory.md` is to prevent Antigravity, Codex, Claude Code, Cursor, Gemini, or another coding agent from repeatedly scanning the entire project. It is the project's operational resume point.

### Mandatory workflow for every task

1. **Read `/memory.md` FIRST.**
2. Check:
   - Current project status
   - What has already been completed
   - Current file(s) being worked on
   - Next task
   - Bugs/blockers
   - Open decisions
   - Recent session updates
3. Read only the specific source/code files required for the requested task.
4. Do **NOT** re-read the entire codebase or entire documentation set unless the task genuinely requires it.
5. Follow the constraints in `Rules.md`, structure in `Architecture.md`, visual system in `Design.md`, requirements in `Project_Requirements.md`, and sequence in `Phases.md`.
6. Implement the requested task.
7. **Update `/memory.md` immediately after the task** with the new completed work, modified files, current file, next task, blockers, and decisions.
8. The next AI session must be able to continue from `memory.md` without starting the analysis from zero.

### Memory is mandatory, not optional

Do not allow `memory.md` to become stale. If a file is created, modified, completed, renamed, or abandoned, update the file status in `memory.md`. If an architectural or design decision changes, record it there.

### Documentation set

The project uses these focused documents:
- `Project_Requirements.md` — what to build, users, features, scenario requirements.
- `Architecture.md` — application flow, architecture layers, data flow, folder/file structure, tech stack.
- `Rules.md` — technologies to use/avoid, error handling, API/backend boundaries, state/code rules.
- `Phases.md` — implementation phases and sequencing.
- `Design.md` — colors, theme, fonts, typography, panel/map visual language.
- `memory.md` — current operational state and resume point.

**Do not duplicate the entire master prompt into `memory.md`.** Keep memory focused on current state and decisions.

## 1. Non-negotiable stack rule

**Vanilla only. No frameworks.**

- Plain `HTML5` + `CSS3` + vanilla `JavaScript` (ES modules allowed, no bundler required).
- Do **NOT** use React, TypeScript, Tailwind, Vite, Zustand, or any npm build step. Ignore any earlier scaffold (`package.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`) that references that stack — it is stale/superseded and should not be resurrected for this phase.
- Mapping library: **MapLibre GL JS** (loaded via `<script>` CDN tag or local vendor file), NOT Mapbox GL JS — Mapbox requires a paid token; MapLibre is the open-source fork and is already the intended dependency. Use a free/no-key raster or vector tile source (e.g. OpenFreeMap, MapTiler free-tier key placeholder, or CARTO/OSM raster tiles) so the app runs without paid credentials.
- File layout mirrors the existing landing page project exactly:
  ```
  /index.html          ← existing landing page (DO NOT rewrite the design)
  /style.css           ← existing landing page styles (extend, don't replace)
  /script.js           ← existing landing page logic (leave as-is)
  /dashboard.html       ← NEW
  /dashboard.css        ← NEW
  /dashboard.js         ← NEW (can be split into modules: map.js, overview.js, properties.js, simulation-engine.js)
  /data/disaster-rules.js  ← NEW (the data model from Section 3, as a plain JS object/module)
  /memory.md            ← running build log (see Section 7)
  ```

---

## 2. What already exists — treat as locked reference (Phase 1: Landing Page)

The uploaded `RESQ_india_theme_final.zip` **is the finished, approved, final landing page** (a light polish pass over the earlier `lightfixed` build — background-image centering fixed, light-mode contrast/opacity tuned, and a dark-green "LOCATION READY" accent added for light mode). Do not restyle it. Its conventions define the visual language the dashboard must continue.

> **Hard requirement for this phase:** the dashboard is not just "in the same spirit" — it must **reuse the landing page's actual UI components and styling verbatim**: the same glass panel chrome with corner brackets, the same uppercase letter-spaced mono/sans labels, the same `search-wrapper`/`field`/`select-wrapper` input styling, the same button treatment as `.launch-button`, the same footer strip convention, the same light/dark theme system (including the light-mode dark-green "ready" accent color), and the same background texture elements (grid, noise, subtle radar motif) at a toned-down intensity so they don't compete with map/data density. Nothing on the dashboard should look like it came from a different design system than the landing page.

**Structure & effects**
- Fullscreen fixed background: grayscale/contrast/dim satellite-style `mapImage`, dark gradient overlay, faint `70px` grid, a large radar-sweep circle bottom-right, a center crosshair, and a `<canvas id="disasterCanvas">` that plays a live animated preview (tsunami waves / flood rising water / cyclone wind streaks / earthquake ground cracks) reacting to whichever disaster is selected in the dropdown.
- Top navbar: logo mark + "RESQ" wordmark, center label "DISASTER INTELLIGENCE PLATFORM", a pulsing "SYSTEM ONLINE" status dot, and a ☾/☼ light/dark theme toggle (`themeToggle`, class `light-mode` on `<body>`).
- Hero: eyebrow tag "NEXT-GENERATION EMERGENCY SIMULATION", big headline "SEE. SIMULATE. RESPOND." (middle word outlined/stroked text), one-line description, meta row "REAL-TIME SIMULATION • AI-ASSISTED RESPONSE".
- Right-side glass control panel with corner-bracket decorations (`.corner.tl/.tr/.bl/.br`), header "SIMULATION PARAMETERS / Configure your scenario / 01 / 02", then:
  - Country search field (live search against a countries API, arrow-key navigable results list).
  - City search field (disabled until a country is chosen; shows popular cities, then live search).
  - A "LOCATION READY" chip showing the resolved `City, Country`.
  - Disaster dropdown: `tsunami | cyclone | earthquake | flood` — changing it replays the matching canvas effect immediately.
  - "INITIALIZE SIMULATION →" launch button.
  - Footer strip "RESQ / CORE · v1.0.0 · READY".
- Bottom-left "LAT / LON · LIVE GEOCODING" tag, bottom-right "RESQ / COMMAND" tag, subtle noise overlay for texture.
- On launch: builds a `simulation` object —
  ```js
  {
    city, country, countryCode,
    latitude, longitude,
    population,
    disaster,           // "tsunami" | "cyclone" | "earthquake" | "flood"
    createdAt
  }
  ```
  saves it to `localStorage.setItem("resqSimulation", JSON.stringify(simulation))`, plays a full-screen "INITIALIZING RESQ / {city, country}" transition overlay, then navigates to `dashboard.html`.

**Typography / palette to reuse verbatim on the dashboard**
- Fonts: `Inter` (UI text, 300–800) + `DM Mono` (labels, coordinates, mono readouts) — already linked via Google Fonts in `index.html`; re-link the same `<link>` tags in `dashboard.html`.
- Base surface `#080a0c`, primary text `#f4f5f6`, dark theme is default with a `light-mode` class alternate — the dashboard must support the same toggle and persist the choice (e.g. via `localStorage`) across both pages.
- Reuse the existing semantic status colors already defined for this project's Tailwind theme (`critical #ef4444`, `high #f59e0b`, `medium #eab308`, `ok #10b981`, `flood #0284c7/#38bdf8`, `route #f97316`) as plain CSS custom properties in `dashboard.css` — port the values, not the Tailwind config.
- Reuse the per-disaster color palettes already coded in `script.js`'s `disasterPalette()` (tsunami/flood = blues, cyclone = cool grays/blue, earthquake = amber/orange) for any dashboard charts, badges, or map tinting tied to the active disaster.
- Micro-label style throughout: uppercase, letter-spaced, small mono/sans labels above every field/panel (`SIMULATION PARAMETERS`, `SELECTED LOCATION`, etc.) — keep this convention for all new dashboard panel headers.
- Light mode specifics (from the `final` build): background satellite image at higher opacity/contrast for legibility on light surfaces (`contrast(1.45) brightness(.94)`, `opacity: .50` full-screen / `.44` on narrow viewports), and a distinct dark-green "ready/online" accent (`#1f6b3a` text/dot, matching soft green tint background and border) used for positive-status chips — reuse this exact green for any "OK / available / clear" status states on the dashboard (e.g. hospital available, shelter open, route clear) instead of inventing a new "success" color.

**On page load, `dashboard.html` must:**
1. Read `resqSimulation` from `localStorage`. If missing, redirect back to `index.html`.
2. Restore the saved theme (dark/light) before first paint (no flash).
3. Use `simulation.latitude/longitude` to center the map and `simulation.disaster` to select which rules/effects/metrics apply.

---

## 3. Disaster data model — treat as the fixed rules engine (from `gemini-code` reference doc)

Implement this as a plain data module (`/data/disaster-rules.js`), not hardcoded inline — the simulation engine and UI both read from it.

### Supported cities (seed set — extendable later)
| City | Type |
|---|---|
| Delhi | Landlocked |
| Chennai | Coastal |

### Supported disasters per city type
| Disaster | Landlocked | Coastal |
|---|---|---|
| Flood | ✅ | ✅ |
| Earthquake | ✅ | ✅ |
| Cyclone | ❌ | ✅ |
| Tsunami | ❌ | ✅ |

> The city/disaster picker (already partly built into the landing page as a free-text country/city search) should, for this phase, be constrained or annotated so an invalid combo (e.g. Tsunami + Delhi) is disabled or flagged — since Delhi is landlocked.

### Disaster properties (the sliders/inputs driving each simulation, and what the bottom "Disaster Properties" panel displays)
- **Flood** — Water depth · Velocity · Duration
- **Earthquake** — Peak Ground Acceleration (PGA)/shaking intensity · Duration of shaking · Depth & distance from epicenter
- **Cyclone** — Max sustained wind speed · Storm surge height · Rainfall intensity
- **Tsunami** — Wave height (run-up) · Inundation distance · Wave velocity

### Disaster impact model (drives the cascading simulation + AI summary)
| Disaster | Asset damage model | Transit & logistics impact |
|---|---|---|
| Flood | Gradual/Corrosive — waterlogging, mold, rust, electrical shorting | Submerged roads/railways, delayed ground freight, impassable terrain, temporary airport/port shutdowns |
| Earthquake | Structural/Catastrophic — cracking, foundation shear, total collapse | Collapsed bridges/overpasses, warped rail tracks, fractured runways, debris-blocked routes |
| Cyclone | Aerodynamic/Impact — roof lift-off, shattered glass, wind-pressure buckling, flying-debris damage | Aviation/maritime logistics fully halted, overturned high-profile freight vehicles, roads blocked by fallen trees/power lines |
| Tsunami | Hydrodynamic/Scouring — kinetic crushing, foundation erosion, debris-driven structural damage | Coastal ports/harbors obliterated, coastal highways washed out, long-term maritime trade disruption |

These damage/impact strings are the seed vocabulary the "AI Response" summary (Section 4.2) should draw on and expand contextually (city, severity, disaster) rather than a static template.

---

## 4. Dashboard UI/UX specification

**Overall:** single-screen, no vertical scroll, three panels, styled with the exact visual language from Section 2 (glass panels, corner brackets, uppercase mono labels, grid/noise texture, theme-aware colors).

### 4.1 Map — left panel
- Engine: MapLibre GL JS.
- Default view: 3D perspective, **45° pitch**, centered on `simulation.latitude/longitude`, zoomed to street/building level with 3D building extrusions visible.
- Fully interactive: pan, zoom, rotate/bearing.
- Live/mock backend layers to render:
  - Blocked roads → **solid red** line layer.
  - Disaster-affected zones → **yellow** translucent polygon overlay.
  - Power outages → point markers with a crossed-out power/bolt icon.
  - Shelters → point markers with a home icon.
  - Hospitals → point markers with a hospital icon; swap to a crossed-out variant when `capacity >= full`.
  - Evacuation routes → **solid green** line layer following passable roads.
- Since there's no live backend yet, stub this with a small mock GeoJSON generator seeded from `simulation` (city + disaster) so the map isn't empty — mark clearly in code comments as `// MOCK DATA — replace with live backend feed`.

### 4.2 Overview — right panel
- **Metrics tab**: real-time counters —
  - Affected people
  - Hospitals available vs. full
  - Total blocked roads
  - Active shelter locations
  - Active power outages
  (Numbers should tick/animate on update, styled with the severity colors from Section 2.)
- **AI Response readout**: a two-part block —
  1. Generated plain-language situation summary (city, disaster, current severity, what's failing) built from the impact model in Section 3.
  2. Actionable evacuation suggestions (which routes/shelters to prioritize) derived from the same mock data feeding the map.
  - Architect this as a swappable function (`generateAIResponse(simulationState)`) so a real LLM/API call can replace the placeholder generator later without touching the UI.

### 4.3 Disaster Properties — bottom panel
- Shows the live values of whichever properties apply to the active disaster (Section 3's property list), as the simulation's severity/time progresses.
- Must reuse the **exact** input styling (search-wrapper look, corner-bracket panel chrome, uppercase labels, launch-button style buttons/sliders) from the landing page's control panel — visual continuity between "the screen where you configured the disaster" and "the screen where you watch it play out."

### 4.4 Desktop panel behavior
- All three panels (Map, Overview, Properties) have **draggable borders** and can be resized relative to one another (simple splitter/resizer implementation in vanilla JS — no library required; e.g. mousedown/mousemove/mouseup on a thin drag-handle div that adjusts flex-basis or grid-template sizes).

### 4.5 Mobile layout
- Vertical single-column stack.
- Map and Disaster Properties **share the top area** behind a **tabbed toggle** (two tabs, switching which of the two is visible).
- That combined Map/Properties block sits directly **above** the Overview panel below it.
- No resizing/drag-splitters on mobile — just the tab switch.

---

## 5. Simulation engine behavior (ties Sections 3 + 4 together)

- On dashboard load, read `simulation` from `localStorage`, look up its rules in `disaster-rules.js`, and initialize a `simulationState` object (severity, elapsed time, current property values, mock-derived counts for the Overview metrics).
- Advance the simulation over time (a simple `setInterval`/`requestAnimationFrame` tick) so metrics, map layers, and the AI summary visibly evolve — this is what makes it a "simulation," not a static report.
- Keep the whole engine in `simulation-engine.js` as pure-ish functions operating on `simulationState`, so the map/overview/properties renderers just subscribe to state changes (simple pub-sub or a manual re-render call is fine — no state library).

---

## 6. Acceptance checklist for whoever builds this

- [ ] No React/TS/Tailwind/build-step files added; everything runs by opening `index.html`/`dashboard.html` directly or via a static file server.
- [ ] `dashboard.html` reuses the landing page's fonts, color tokens, panel chrome (corner brackets, uppercase labels, search-wrapper/select styling, button treatment), background texture, and light/dark toggle — including the light-mode dark-green "ready" accent for positive status states — verbatim, not reinterpreted.
- [ ] Redirects to `index.html` if `resqSimulation` isn't in `localStorage`.
- [ ] City/disaster combination respects the landlocked-vs-coastal rule.
- [ ] All three panels present with the exact data/legend items listed in Section 4.
- [ ] Desktop: draggable/resizable panel borders. Mobile: stacked + tabbed Map/Properties above Overview.
- [ ] Map uses MapLibre GL JS (no Mapbox token dependency) at 45° pitch with 3D buildings.
- [ ] Mock data clearly commented as mock, isolated so a real backend/API can be swapped in later.
- [ ] `memory.md` created and kept current per Section 7.

---

## 7. `memory.md` requirement

Every build session must update `/memory.md` at the end of the session and after major milestones. At minimum record: what was completed, which files changed, which file is currently in progress, the next task, blockers/bugs, decisions made, and remaining open decisions. On a new session, read `memory.md` first and inspect only the files needed for the requested task. Do not let it go stale.
