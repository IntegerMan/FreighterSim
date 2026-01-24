# Data Model: PixiJS Rendering Integration

## Entities

### RenderingLayer
- Fields:
  - `id`: string (e.g., `background`, `game`, `effects`, `ui`)
  - `zIndex`: number (ordering)
  - `visible`: boolean
  - `scaleFactor`: number (applied for resolution scaling when throttling)
- Relationships:
  - Contains `RenderableObject[]`
- Validation:
  - `zIndex` must be unique across layers
  - `scaleFactor` ∈ (0, 1] when throttling; default 1

### RenderableObject
- Fields:
  - `id`: string
  - `position`: { x: number, y: number }
  - `rotation`: number (radians)
  - `selected`: boolean
  - `effects`: { eligible: boolean, intensity: number }
- Relationships:
  - Belongs to `RenderingLayer`
- Validation:
  - `intensity` ∈ [0, 1]; `eligible` false forces `intensity = 0`

### PerformanceProfile
- Fields:
  - `targetFps`: number (default 60)
  - `fpsAvgWindowSec`: number (e.g., 2)
  - `frameTimeP95ThresholdMs`: number (e.g., 25)
  - `particleCap`: number (dynamic cap)
  - `scalingPriority`: enum [`particles`, `effects`, `resolution`]
  - `contextLossPolicy`: { autoRecoveryAttempts: 1, repeatWindowSec: 30 }
- Relationships:
  - Governs throttling decisions and renderer state
- Validation:
  - `targetFps` > 0; `frameTimeP95ThresholdMs` > 0
  - `scalingPriority` fixed order: particles → effects → resolution

## State Transitions

### Throttling Controller
- `Idle` → `Monitoring` when renderer starts
- `Monitoring` → `ThrottlingParticles` when triggers fire and particle count > cap
- `ThrottlingParticles` → `ThrottlingEffects` if triggers persist after particle reduction
- `ThrottlingEffects` → `ThrottlingResolution` if triggers persist after effects reduction
- Any → `Recovered` when metrics return within targets for sustained window

### Context Loss Handler
- `Active` → `Recovering` on WebGL context loss (attempt #1)
- `Recovering` → `Active` if recovery succeeds; else → `Halted`
- `Active` → `Halted` if repeat occurs within 30s window

## Notes
- Aligns with spec Success Criteria and Clarifications.
- Interfaces to be implemented in `src/core/` and state tracked via Pinia in `src/stores/`.