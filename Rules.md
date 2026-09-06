# RESQ — Engineering Rules & Constraints

## 1. Non-Negotiable Stack Rules

1. **Vanilla Only — No Frameworks, No Bundlers**:
   - Only native HTML5, CSS3, and modern vanilla JavaScript (ES6+ / ES modules).
   - Strict prohibition against React, Vue, Svelte, Vite, Webpack, Tailwind CSS, TypeScript, or npm build steps.
   - Files must execute directly in the browser via standard HTTP static servers or file protocol.

2. **MapLibre GL JS Standard**:
   - Use MapLibre GL JS (open-source fork) loaded via CDN.
   - Do NOT use Mapbox GL JS (avoids paid access token dependencies).
   - Use open/free vector or raster tiles (OpenFreeMap / CARTO) without requiring API keys.

3. **Phase 1 Visual Preservation**:
   - The landing page (`index.html`, `style.css`) is an approved, locked reference.
   - Do NOT redesign or overwrite Phase 1 components.
   - The dashboard must reuse Phase 1 styles verbatim: glassmorphic chrome, `.corner.tl/.tr/.bl/.br` corner brackets, uppercase letter-spaced mono labels (`DM Mono`), `Inter` typography, `.search-wrapper` aesthetics, `.launch-button` styling, and light/dark theme conventions.

4. **Isolated Mock Architecture**:
   - All mock data generator functions must be explicitly annotated with `// MOCK DATA — replace with live backend feed`.
   - Mock data feeds must be decoupled from rendering logic to ensure clean future backend swap-in.

5. **Operational Memory Protocol**:
   - `/memory.md` is the operational log and resume point.
   - Must be read first before tasks and updated after major milestones.
