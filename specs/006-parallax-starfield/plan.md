# Implementation Plan: Parallax Starfield Background

**Branch**: `006-parallax-starfield` | **Date**: 2026-01-24 | **Spec**: [spec.md](spec.md)

## Summary

Implement a 3-layer parallax starfield background that creates depth perception during ship movement. Stars are deterministically positioned using seeded PRNG for consistency across sessions. Each layer moves at geometric rates (1.0x near, 0.5x mid, 0.25x far) with varying star sizes and brightness.

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode
**Primary Dependencies**: Vue 3 Composition API, Pinia, Canvas 2D
**Storage**: N/A (runtime visual effect)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web browser (Canvas 2D)
**Project Type**: Single SPA with game systems
**Performance Goals**: 60 FPS rendering without frame drops
**Constraints**: Must integrate with existing render pipeline; render before grid

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game-First Architecture | PASS | Starfield logic decoupled from Vue; lives in `/src/core/starfield/` |
| II. Type Safety & Composition API | PASS | All interfaces typed; uses existing CameraState |
| III. Test-First Development | PASS | Unit tests before implementation; E2E + lint gates |
| IV. Canvas Rendering Optimization | PASS | Cell-based culling; cache-first rendering |
| V. LCARS Design System | PASS | White/pale blue stars complement existing palette |

## Project Structure

### Documentation (this feature)

```text
specs/006-parallax-starfield/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (below)
├── data-model.md        # Phase 1 output (below)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (new files)

```text
src/
├── core/
│   └── starfield/
│       ├── index.ts                  # Public exports
│       ├── Starfield.ts              # Main renderer class
│       ├── Starfield.test.ts         # Unit tests
│       ├── StarGenerator.ts          # Deterministic star generation
│       ├── StarGenerator.test.ts     # Unit tests
│       └── starfieldConfig.ts        # Default layer configurations
│
└── models/
    └── Starfield.ts                  # Star/Layer interfaces

e2e/
└── starfield.spec.ts                 # E2E visual tests
```

### Modified Files

- `src/components/map/HelmMap.vue` - Add starfield rendering at line 61 (after clear, before grid)
- `src/components/map/SystemMap.vue` - Add starfield rendering (same pattern)
- `src/models/index.ts` - Export new Starfield types

---

## Phase 0: Research

### Decision: Seeded PRNG Algorithm

**Decision**: Use Mulberry32 seeded PRNG
**Rationale**: Simple, fast 32-bit generator. Produces high-quality random numbers for visual purposes. Easy to seed from string hash of cell coordinates.
**Alternatives Considered**:
- xorshift128+ (more complex, overkill for this use case)
- Math.random() with seed override (not portable, browser-dependent)

### Decision: Cell-Based Generation

**Decision**: Generate stars per spatial grid cell, cache results
**Rationale**: Enables efficient culling (only generate/render visible cells). Cache prevents regeneration each frame. Matches existing particle grid pattern in codebase.
**Alternatives Considered**:
- Generate all stars upfront (memory issues at scale)
- Generate per-frame (performance issues, no caching)

### Decision: Parallax Implementation

**Decision**: Apply parallax by scaling camera offset, not star positions
**Rationale**: Stars have fixed world positions. Parallax effect achieved by reducing the camera offset effect for distant layers. This preserves determinism and simplifies the math.
**Alternatives Considered**:
- Move star positions each frame (breaks determinism)
- Separate coordinate systems per layer (more complex)

---

## Phase 1: Data Model

### Star Interface

```typescript
interface Star {
  worldPos: Vector2;      // Fixed world position
  radius: number;         // Visual size in pixels
  brightness: number;     // Alpha value 0.0-1.0
  color?: string;         // Optional color override
}
```

### StarfieldLayerConfig Interface

```typescript
interface StarfieldLayerConfig {
  parallaxFactor: number;              // 1.0 = full speed, 0.25 = quarter speed
  density: number;                     // Stars visible in viewport
  radiusRange: [number, number];       // [min, max] pixels
  brightnessRange: [number, number];   // [min, max] alpha
}
```

### StarfieldConfig Interface

```typescript
interface StarfieldConfig {
  seed: string;                        // System ID for determinism
  layers: StarfieldLayerConfig[];      // Layer definitions
  cellSize: number;                    // World units per grid cell
}
```

### Star Color Palette

```typescript
const STAR_COLORS = {
  white: '#FFFFFF',
  paleBlue: '#B8D4E8',
  warmWhite: '#FFF8E7',
  coolBlue: '#A0C4E8',
} as const;
```

Colors complement LCARS palette while providing subtle variation for visual depth.

### Default Layer Configuration

| Layer | Parallax | Density | Radius | Brightness |
|-------|----------|---------|--------|------------|
| Near  | 1.0x     | 15      | 1.5-3.0 | 0.8-1.0   |
| Mid   | 0.5x     | 40      | 0.8-1.5 | 0.5-0.8   |
| Far   | 0.25x    | 100     | 0.3-0.8 | 0.2-0.5   |

---

## Implementation Phases

### Phase 1: Types and Star Generator

**Goal**: Deterministic star generation with parallax math

1. Create `src/models/Starfield.ts` with interfaces
2. Write `src/core/starfield/StarGenerator.test.ts` (test-first):
   - `mulberry32` produces deterministic sequences
   - `hashString` produces consistent hashes
   - `generateStarsForCell` returns same stars for same coordinates
   - `starToScreen` applies parallax factor correctly
   - `getVisibleCells` returns correct cell coverage
3. Implement `src/core/starfield/StarGenerator.ts`

### Phase 2: Starfield Renderer

**Goal**: Cached, performant multi-layer rendering

1. Write `src/core/starfield/Starfield.test.ts`:
   - Renders all layers back-to-front
   - Caches stars for repeated renders
   - Prunes cache when cells leave viewport
2. Create `src/core/starfield/starfieldConfig.ts` with defaults
3. Implement `src/core/starfield/Starfield.ts`:
   - Constructor takes `StarfieldConfig`
   - `render(ctx, camera)` draws all layers
   - Cell-based caching per layer

### Phase 3: Vue Integration

**Goal**: Starfield visible in both map views

1. In `HelmMap.vue`:
   - Import Starfield class
   - Create instance on mount
   - Call `starfield.render()` after clear, before grid (line 61)
2. In `SystemMap.vue`:
   - Same integration pattern
3. Manual visual testing

### Phase 4: E2E Tests and Polish

**Goal**: Feature completion gates pass

1. Create `e2e/starfield.spec.ts`
2. Run `npm run test:run` - all green
3. Run `npm run test:e2e` - all green
4. Run `npm run lint` - no errors

---

## Key Algorithms

### Parallax Position Calculation

```typescript
function starToScreen(star: Star, camera: CameraState, parallaxFactor: number): Vector2 {
  const parallaxCenterX = camera.centerX * parallaxFactor;
  const parallaxCenterY = camera.centerY * parallaxFactor;

  const screenCenterX = camera.canvasWidth / 2;
  const screenCenterY = camera.canvasHeight / 2;

  return {
    x: screenCenterX + (star.worldPos.x - parallaxCenterX) * camera.zoom,
    y: screenCenterY - (star.worldPos.y - parallaxCenterY) * camera.zoom,
  };
}
```

### Deterministic Star Generation

```typescript
const cellKey = `${config.seed}:${layerIndex}:${cellX},${cellY}`;
const seed = hashString(cellKey);
const rng = mulberry32(seed);

const worldX = (cellX + rng()) * config.cellSize;
const worldY = (cellY + rng()) * config.cellSize;
```

---

## Verification

1. **Unit Tests**: `npm run test:run` - all green
2. **E2E Tests**: `npm run test:e2e` - all green
3. **Lint**: `npm run lint` - no errors
4. **Visual**: Stars create depth perception during flight
5. **Consistency**: Same stars appear at same coordinates across sessions
6. **Performance**: No frame drops at 60 FPS during movement

---

## Edge Cases

| Case | Solution |
|------|----------|
| Extreme coordinates | Use cell-relative positions to avoid float precision loss |
| Rapid movement | Buffer cells extend 1 beyond viewport for smooth scrolling |
| Zoom extremes | Skip rendering very small stars when zoomed out |
| System change | `setConfig()` clears all caches for new star patterns |

## Complexity Tracking

No constitution violations requiring justification.
