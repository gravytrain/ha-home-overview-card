# Home Overview Card - Unified Styling Plan

## Overview
Apply the unified design system from `rv-energy-card` and `home-management-card` to the `home-overview-card`. All three cards share a common base theme with different accent palettes.

## Design System

### Base Theme (Dark)
The unified theme uses a consistent set of CSS variables across all cards:

```css
--housing: #14161b      /* Main background */
--panel: #1c2027        /* Card/section background */
--panel-2: #23282f      /* Secondary panel */
--well: #171a20         /* Input/button wells */
--bezel: #2c323b        /* Borders/dividers */
--hairline: #333a44     /* Subtle dividers */
--brass: #d9a441        /* Primary accent (gold) */
--brass-dim: #a67f34    /* Dimmed accent */
--needle: #c8483a       /* Alert/warning red */
--ledger: #9fbf8f       /* Success/positive green */
--ink: #e7e3d8          /* Primary text */
--ink-dim: #9aa0ab      /* Secondary text */
--ink-faint: #6b7280    /* Tertiary text */
```

### Typography
```css
--font-display: 'Oswald', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```

### Card-Specific Accents
- **RV Energy Card**: North (#5b9bd5), South (#6bbf7b), Shed (#a681c4)
- **Home Management Card**: Uses base theme as-is
- **Home Overview Card**: Will use base theme + weather/calendar color coding

## Implementation Tasks

### 1. Add CSS Variable Definitions
- [x] Create task
- [x] Add CSS variables to `:host` selector
- [x] Define base colors, typography, and spacing

### 2. Replace Hardcoded Colors
Current colors to replace:
- `#0f0f1a` → `var(--housing)`
- `#1a1a2e` → `var(--panel)`
- `#16213e` → `var(--well)`
- `#2a2a3e` → `var(--bezel)` or `var(--hairline)`
- `#e0e0e0` → `var(--ink)`
- `#888`, `#aaa` → `var(--ink-dim)`
- `#666`, `#555` → `var(--ink-faint)`
- `#fff` → `var(--ink)`
- `#1D9E75` → `var(--ledger)` (green/success)
- `#e74c3c` → `var(--needle)` (red/alert)

### 3. Update Font Families
- Replace `-apple-system, BlinkMacSystemFont...` → `var(--font-body)`
- Headers → `var(--font-display)`
- Monospace elements → `var(--font-mono)`

### 4. Preserve Functional Colors
Keep these specific colors as they have semantic meaning:
- Weather/calendar category colors (#4285f4, #9c27b0, etc.)
- AQI level colors (mapped to theme variables)
- AI briefing gradient (can adapt to use brass)

## File Changes

### `dist/home-overview-card.js`
- Update `_styles()` method (lines 655-919)
- Maintain all existing layout and structure
- Replace colors and fonts only

## Testing Checklist

- [ ] Card renders in Home Assistant (requires deployment)
- [x] All sections display correctly in local mockup
- [x] Weather banner uses appropriate colors
- [x] Forecast row displays in local mockup
- [x] Calendar events show distinct colors
- [x] AQI badges use correct color coding
- [x] System status pills retain their status animation
- [x] Responsive layout retains the existing mobile grid breakpoint
- [x] Text contrast updated to shared token values

## Version Bump
After successful implementation:
- Update `HOME_CARD_VERSION` from `0.2.0` → `0.3.0`
- Update `README.md` with changelog
- Commit with message: "Apply unified design system from rv-energy and home-management cards"

## Benefits
- **Consistency**: All home automation cards share visual language
- **Maintainability**: Single source of truth for colors
- **Theming**: Easy to add light mode or alternate themes
- **Readability**: Improved contrast and typography
- **Professional**: Cohesive design across dashboard
