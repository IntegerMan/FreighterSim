# ADR-0005: LCARS-Inspired Design System

## Status

Accepted

## Context

The game UI needs a distinctive visual style that:

- Evokes a sci-fi command center aesthetic
- Is inspired by Artemis Starship Simulator and Star Trek
- Provides clear visual hierarchy for data-dense panels
- Uses a specific color palette: purple, gold, white, black

## Decision

We will implement an **LCARS-inspired design system** using SCSS with CSS custom properties.

### Color Palette

```scss
// Primary
$color-purple: #9966FF;
$color-gold: #FFCC00;

// Neutral
$color-white: #FFFFFF;
$color-black: #000000;

// Semantic
$color-success: #66FF66;
$color-warning: #FFAA00;
$color-danger: #FF6666;
```

### Component Library

Reusable LCARS-styled components:

- `LcarsFrame` - Panel container with characteristic rounded corners
- `LcarsButton` - Rounded rectangular buttons
- `LcarsGauge` - Status bars and indicators
- `LcarsDisplay` - Data readouts with monospace font

### Typography

- **Display font**: Orbitron or similar for headers
- **Monospace font**: Share Tech Mono for data displays

## Consequences

### Positive

- **Distinctive aesthetic**: Immediately recognizable sci-fi style
- **Clear hierarchy**: LCARS design naturally creates visual organization
- **Flexible system**: CSS custom properties allow easy theming
- **Reusable components**: Consistent UI across all panels

### Negative

- **Accessibility considerations**: High-contrast color combinations need testing
- **Custom components**: More upfront work than using a UI library
- **Font loading**: Custom fonts add to initial load time

## Design Principles

1. **Panels are containers**: Every control group lives in an LcarsFrame
2. **Color indicates function**: Purple for navigation, gold for actions
3. **Data is monospace**: All numeric readouts use monospace font
4. **Corners are characteristic**: Rounded corners with LCARS elbow shapes
5. **Black backgrounds**: Dark theme throughout for space aesthetic

## References

- [LCARS Design](https://en.wikipedia.org/wiki/LCARS)
- [Artemis Starship Bridge Simulator](https://www.artemisspaceshipbridge.com/)
