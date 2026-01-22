# ADR-0011: Coordinate System Standardization

## Status

Accepted

## Context

The Space Freighter Sim used multiple conflicting coordinate and heading systems across different modules:
- **Standard Math/Trigonometry**: $0^{\circ}$ = East ($+X$), $90^{\circ}$ = North ($+Y$), counter-clockwise.
- **Canvas Rendering**: $0^{\circ}$ = Right, $90^{\circ}$ = Down, clockwise.
- **Initial Game Heading**: A mix of systems where "Down" was sometimes $90^{\circ}$ and "East" was sometimes $0^{\circ}$.

These discrepancies caused several issues:
1. Autopilot steering the ship 90 degrees away from waypoints.
2. The Compass/Helm gauge labels ('N', 'E', 'S', 'W') not matching the ship's actual direction of travel.
3. Difficulty in predicting ship movement when manually setting headings.

A unified, predictable system was required to ensure the Map, UI Gauges, Autopilot, and Physics all agree on direction.

## Decision

We have standardized on a **North-Up, Clockwise Heading System**.

### 1. The Heading System (Degrees)

All navigation headings use a 0-360 degree scale:
- **$000^{\circ}$ (North)**: Upward on the screen / Positive $Y$ in world space.
- **$090^{\circ}$ (East)**: Rightward on the screen / Positive $X$ in world space.
- **$180^{\circ}$ (South)**: Downward on the screen / Negative $Y$ in world space.
- **$270^{\circ}$ (West)**: Leftward on the screen / Negative $X$ in world space.

### 2. World Space vs. Screen Space

- **World Space**: Follows a standard Cartesian grid where $+X$ is Right and $+Y$ is Up.
- **Screen Space**: The rendering system maps World Space to the screen. 
    - The `worldToScreen` utility flips the $Y$ axis so that $+Y$ world coordinates appear at the top of the screen.

### 3. Physics & Vectors (`math.ts`)

To align the $0^{\circ}$ = North ($+Y$) system with standard trigonometry:
- **Vector from Angle**: To get a velocity vector $(x, y)$ from a heading $\theta$:
    - $x = \sin(\theta)$
    - $y = \cos(\theta)$
    - *Note: This is swapped from standard math because our 0-axis is Vertical (North) instead of Horizontal (East).*
- **Angle from Vector**: To get a heading from a vector $(x, y)$:
    - $\theta = \text{atan2}(x, y)$

### 4. UI Representation (`HeadingGauge.vue`)

The Compass/Helm gauge reflects this standard:
- Labels are placed manually to match the $0=$ North convention.
- For canvas drawing purposes (which usually treats $0=$ Right), we apply a $-90^{\circ}$ visual offset to all elements so that the $0$-degree needle points at the "North" label at the top.

### 5. Tactical Map (`mapUtils.ts`)

Ship icons and velocity lines follow the same logic:
- The default ship icon (0 rotation) points North (Up).
- Heading rotation is applied clockwise.
- Autopilot calculates its target heading using the normalized `Math.atan2(dx, dy)` logic to ensure it aims directly at waypoint coordinates.

## Consequences

### Positive

- **Intuitive Navigation**: "North" is always up, matching standard maritime and aeronautical navigation expected by players.
- **Consistency**: The number shown on the compass gauge matches the ship's direction of travel on the map and the waypoint calculations.
- **Simplified Math**: New systems (like AI or more complex autopilot) can use a single set of formulas for all direction-based logic.

### Negative

- **Developer Caveat**: Developers must remember to use `Math.sin(rad)` for $X$ and `Math.cos(rad)` for $Y$ when converting headings to vectors, which is the inverse of standard unit-circle trigonometry.

## References

- `src/models/math.ts`: Implementation of standardized `vec2FromAngle` and `vec2ToAngle`.
- `src/core/rendering/mapUtils.ts`: Unified rotation logic.
- `src/components/ui/HeadingGauge.vue`: Standardized compass display logic.
- `src/stores/navigationStore.ts`: Corrected waypoint heading calculations.
