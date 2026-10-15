---
name: Vancouver+ Obsidian Glow Analytics
version: 1.0.0
description: AI-driven high-density analytics, monitoring & telemetry design system specification and component library guidelines.

# 1. Design Principles & Vision
- **Glanceable Density**: Maximize spatial efficiency without visual noise. Designed for 24/7 mission control, engineering consoles, and real-time operational cockpits.
- **Surface Stratification**: Deep obsidian layers absorb glare and provide clean visual stratification across L0 (Canvas), L1 (Containers), L2 (Elevated modules), and L3 (Floating overlays).
- **Purposeful Chromatic Signals**: Vibrant neon and spectral gradients reserved strictly for telemetry status, KPI trends, and focal interactions.
- **Monospaced Data Precision**: Tabular numerals and strict column grid alignment ensure zero layout shift during continuous live websocket data streaming.

---

# 2. Color System & Semantic Tokens

## 2.1 Surface Hierarchy (Dark Mode Obsidian)
```yaml
surface-base: "#0D0E14"       # L0 Root canvas background (deep matte obsidian)
surface-subtle: "#121319"     # L0.5 Global workspace & sidebar backdrop
surface-card: "#181B24"       # L1 Primary widget cards & table containers
surface-card-hover: "#1E2230" # L1.5 Interactive hover state for list items and cards
surface-elevated: "#252A38"   # L2 Dropdowns, popovers, floating contextual drawers
surface-overlay: "rgba(13, 14, 20, 0.75)" # Backdrop dimming layer with 16px blur
border-subtle: "rgba(255, 255, 255, 0.08)" # Universal 1px boundary stroke
border-highlight: "rgba(255, 255, 255, 0.16)" # Focused/active element border
```

## 2.2 Brand & Interaction Accents
```yaml
accent-brand: "#7C77F4"       # Periwinkle Violet (Navigation active tab, primary buttons)
accent-brand-hover: "#6C66E8" # Primary CTA hover state
accent-brand-subtle: "rgba(124, 119, 244, 0.15)" # Ghost badge & subtle selection fill
focus-ring: "#00E5FF"         # 2px accessible focus outline
```

## 2.3 Telemetry & Status Semantics
```yaml
status-nominal:
  base: "#10B981"             # Vibrant Emerald (Normal, Healthy, Online)
  glow: "rgba(16, 185, 129, 0.25)"
  subtle: "rgba(16, 185, 129, 0.12)"
status-warning:
  base: "#F59E0B"             # Warm Amber (Warning, High Load, Pending)
  glow: "rgba(245, 158, 11, 0.25)"
  subtle: "rgba(245, 158, 11, 0.12)"
status-critical:
  base: "#F43F5E"             # Coral Crimson (Fault, Alarm, Breach)
  glow: "rgba(244, 63, 94, 0.3)"
  subtle: "rgba(244, 63, 94, 0.15)"
status-info:
  base: "#00E5FF"             # Electric Cyan (Active stream, Live sync, Sensor)
  glow: "rgba(0, 229, 255, 0.25)"
  subtle: "rgba(0, 229, 255, 0.12)"
status-standby:
  base: "#818CF8"             # Soft Indigo (Offline, Standby, Scheduled)
  subtle: "rgba(129, 140, 248, 0.12)"
```

## 2.4 Gradient & Spectral Accents
```yaml
gradient-sunset: "linear-gradient(135deg, #F7D070 0%, #F43F85 100%)" # Gauge arc & highlight
gradient-fulfilment: "linear-gradient(180deg, rgba(236, 72, 153, 0.3) 0%, rgba(6, 182, 212, 0.0) 100%)"
gradient-violet-glow: "radial-gradient(circle at 50% 0%, rgba(124, 119, 244, 0.2), transparent 70%)"
```

---

# 3. Typography & Monospaced Pairing

## 3.1 Font Families
- **Primary Interface**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Data & Telemetry**: `'JetBrains Mono', 'Fira Code', monospace`

## 3.2 Typographic Hierarchy
| Role | Size | Weight | Line Height | Font Family | Example Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-hero` | 48px | 700 | 1.1 | Plus Jakarta Sans | Hero KPIs (`$6,078.76`) |
| `headline-lg` | 24px | 700 | 1.25 | Plus Jakarta Sans | Section Headers & Page Titles |
| `headline-sm` | 16px | 600 | 1.3 | Plus Jakarta Sans | Card Titles, Modal Headers |
| `body-md` | 14px | 400/500 | 1.45 | Plus Jakarta Sans | Standard text, explanations |
| `body-sm` | 12px | 400 | 1.4 | Plus Jakarta Sans | Metadata labels, descriptions |
| `mono-stat` | 18px | 600 | 1.2 | JetBrains Mono | Live telemetry counters |
| `mono-code` | 12px | 500 | 1.5 | JetBrains Mono | Configs, JSON code, UUIDs |
| `mono-micro` | 10px | 600 | 1.0 | JetBrains Mono | Micro status tags, timestamps |

---

# 4. Spacing, Elevation & Corner Radii

## 4.1 Spacing Scale
- `2xs`: `4px` (Inner tag padding, badge gap)
- `xs`: `8px` (Icon to label gap, inline button spacing)
- `sm`: `12px` (Card inner elements margin)
- `md`: `16px` (Default card padding, form group gap)
- `lg`: `24px` (Widget section padding, grid column gap)
- `xl`: `32px` (Major layout block separation)

## 4.2 Radii & Glassmorphic Blur
```yaml
radius-sm: "4px"    # Tags, micro buttons, table cells
radius-md: "8px"    # Input fields, dropdown items, small cards
radius-lg: "16px"   # Standard widget panels, charts containers
radius-pill: "9999px" # Pill navigation buttons, status chips, avatar docks
blur-glass: "16px"  # Specular glassmorphic modal & header blur
```

---

# 5. Component Library Specifications

## 5.1 Interactive Controls & Buttons
1. **Primary Action Pill**:
   - Background: `#7C77F4`, Text: `#FFFFFF`, Radius: `9999px`
   - Height: `36px` / `42px`, Padding: `0 20px`, Font: `13px / 600`
   - Glow Effect: `box-shadow: 0 4px 14px rgba(124, 119, 244, 0.4)`
2. **Secondary / Outline Button**:
   - Background: `rgba(255, 255, 255, 0.05)`, Border: `1px solid rgba(255, 255, 255, 0.12)`
   - Text: `#E2E8F0`, Hover: `background: rgba(255, 255, 255, 0.1)`
3. **Omnibox Search Bar**:
   - Background: `#121319`, Border: `1px solid rgba(255, 255, 255, 0.08)`
   - Prefix: Search lens icon, Suffix: Keyboard shortcut badge (`Cmd + K`)

## 5.2 Status Chips & Badges
- **Structure**: `[Status Dot 6px] + [Text Uppercase 11px Mono]`
- **Variants**:
  - `Live / Running`: Dot `#10B981` (with subtle pulse animation), Text `#10B981`
  - `Warning`: Dot `#F59E0B`, Text `#F59E0B`
  - `Critical Breach`: Dot `#F43F5E`, Text `#F43F5E`
  - `Armed / Active`: Dot `#00E5FF`, Text `#00E5FF`

## 5.3 Metric Cards & Visual Telemetry Gauges
1. **Quad KPI Stream Card**:
   - Layout: Top icon in colored square container + Value + Metric Label + Delta Badge (`+10% from yesterday`)
2. **Radial Half-Arc Gauge (80% Efficiency Pattern)**:
   - Geometry: 180° semi-circle SVG arc
   - Gradient Stroke: `#F7D070` to `#F43F85`, Stroke-width: `14px`, Cap: `round`
   - Center Display: Big Monospace Value (`80%`) + Subtitle (`Target Efficiency`)
3. **Dual Glow Wave Chart**:
   - Multiple spline SVG curves with semi-transparent area gradients beneath.
   - Crosshair hover state displaying exact timestamp and localized tooltip.

## 5.4 High-Density Data Tables
- **Header**: Height `36px`, Uppercase 11px Monospace `#64748B`, 1px border-bottom.
- **Rows**: Alternating subtle backgrounds (`#181B24` / `#141720`), height `44px`.
- **Numerics & Tags**: All numerical channels rendered in JetBrains Mono with right alignment.
- **Row Action Trigger**: Fast slide-over drawer opener button (`Acknowledge`, `Diagnose`).

---

# 6. AI Agent System Prompt Injection Guide
*When using this specification with LLMs or UI generation models, include the following directive:*
> "You must strictly follow the `Vancouver+ Obsidian Glow Analytics` DESIGN.md specifications. Use `#0D0E14` base background, `#181B24` card surface, `#7C77F4` for primary branding/active states, and JetBrains Mono for all numeric telemetry, metrics, and codes. Adhere to 16px card radiuses and subtle 1px borders with `rgba(255,255,255,0.08)`."
