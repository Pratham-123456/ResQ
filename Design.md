# RESQ — Design System & Visual Specification

## 1. Typography & Hierarchy

- **Primary Sans-Serif Font**: `"Inter", sans-serif;` (Weights: 300, 400, 500, 600, 700, 800). Used for all body text, counters, modal titles, and action items.
- **Monospace HUD Font**: `"DM Mono", monospace;` (Weights: 300, 400, 500). Used for micro-labels, coordinate readouts, telemetry metrics, panel indices, and status tags.

### Micro-Label Convention
- Uppercase, letter-spaced (`letter-spacing: 0.14em` to `0.22em`), small font size (`8px` to `10px`), muted color opacity (`0.35` to `0.65`). Applied consistently to all panel headers, data field labels, and telemetry indicators.

---

## 2. Color Tokens & Palette

### Base Surfaces
- Dark Mode Surface: `#080a0c`
- Dark Mode Panel Background: `linear-gradient(145deg, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0.025))`
- Dark Mode Panel Border: `1px solid rgba(255, 255, 255, 0.12)`
- Dark Mode Backdrop Filter: `blur(25px)`
- Primary Dark Text: `#f4f5f6`
- Light Mode Surface: `#eef1f3`
- Light Mode Panel Background: `linear-gradient(145deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.34))`
- Light Mode Primary Text: `#11161a`

### Semantic Status Colors
- **Critical Failure / Blocked Roads**: `#ef4444` (Glowing red)
- **High Risk / Hazard Zone**: `#f59e0b` (Translucent amber/orange)
- **Medium Severity**: `#eab308` (Yellow)
- **OK / Active Shelter / Evacuation Route**: `#10b981` (Vibrant green in dark mode)
- **Light-Mode Ready / Available Accent**: `#1f6b3a` (Deep forest green for text and indicators in light mode)
- **Flood / Hydro Blue**: `#0284c7` / `#38bdf8`
- **Route Orange**: `#f97316`

---

## 3. UI Component Anatomy

### Corner Brackets (`.corner`)
Placed at the four absolute corners of glass panels (`.tl`, `.tr`, `.bl`, `.br`):
- Dimensions: `17px × 17px`
- Stroke: `1px solid rgba(255, 255, 255, 0.35)` (Dark mode) / `rgba(20, 28, 34, 0.35)` (Light mode)

### Action Buttons (`.launch-button`)
- Dark Mode: Surface `#f1f2f2`, text `#080a0c`, sliding highlight pseudo-element `:hover::before`.
- Font: 9px, Weight 700, `letter-spacing: 0.17em`.
- Arrow indicator transitioning on hover (`translateX(5px)`).

### Resizer Splitters (`.resizer-v`, `.resizer-h`)
- Subtle line: `rgba(255, 255, 255, 0.08)`, expanding on hover with active grab cursor and glowing accent highlight.
