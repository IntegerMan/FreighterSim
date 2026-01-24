# ADR-0012: 2D Polygon Shape System for Ships and Stations

## Status

Accepted

## Implementation Notes (summary)

- The 2D polygon shape system described here has been implemented on branch `005-2d-shape-system` and is now the canonical shape/collision system for ships and stations.
- Notable implemented details:
  - `Shape`, `EngineMount`, and `ShipTemplate` interfaces: `src/models/Shape.ts`
  - Player ship template (`firefly`) and engines: `src/data/shapes/playerShip.ts` (20-vertex hull, 3 engine mounts; `defaultSize` 40)
  - Engine particles are registered via `useShipEngineParticles` / `particleStore` for per-engine emission
  - SAT collision and utilities: `src/core/physics/collision.ts` (includes SAT, AABB pre-checks, swept collision, and circle-polygon fallback)
  - Station modules and docking ports are defined in `src/data/shapes/stationModules.ts` — docking ports live on specific module types (e.g., `habitat`, `cargo`, `refinery`); `docking-ring` is visual-only
  - Station visual scale = `dockingRange * 3`; module scale factor = `0.12`
  - Sensor raytracing and occlusion implemented in `src/stores/sensorStore.ts` (uses polygon/circle approximations for contacts and `hasLineOfSight` raycasts)
  - LOD is configurable (renderer default `minSize` = 4px; `HelmMap` uses `6px` for ships and `8px` for stations)
  - Approach vector validation is exposed for UI (runway/heading UI) but is currently not required for port availability — availability is primarily range + outward-facing port check

## Context

Currently, ships and stations in the game are rendered as simple geometric primitives:
- Ships: Triangle icons pointing in heading direction
- Stations: Circles with a docking range indicator

This simplified rendering creates several limitations:

1. **Visual Identity**: All ships look identical; all stations look identical. Players cannot visually distinguish between a freighter and a military cruiser, or between a trading hub and a mining outpost.

2. **Collision Detection**: Current collision uses simple radius-based checks (`vec2Distance(a, b) < combinedRadius`), which is imprecise. A ship could "collide" with empty space next to a station arm.

3. **Engine Particle Traces**: The existing particle system emits traces from ship center points. The spec requires traces to originate from specific engine mount locations (player ship needs 3 distinct engine points: center, port, starboard).

4. **Docking Mechanics**: Docking currently triggers when the player is within a radius of the station center. The spec requires docking at designated docking ports with approach vectors and alignment requirements.

5. **Sensor Raytracing**: Future sensor occlusion requires raytracing against actual object shapes, not circles.

The feature spec (005-2d-shape-system) calls for detailed 2D shapes, with the player's ship resembling Serenity from Firefly, and stations composed of modular building blocks.

## Decision

### 1. Shape Definition Model

Introduce a `Shape` interface representing a 2D polygon in normalized local coordinates (-1 to 1):

```typescript
interface Shape {
  id: string;
  name: string;
  vertices: Vector2[];      // Local coords, counter-clockwise
  boundingRadius: number;   // For quick collision pre-checks
}
```

Shapes are scaled at runtime by a `size` property on ships/stations. This allows the same shape definition to be reused at different scales.

### 2. Ship Templates with Engine Mounts

Ships are defined using templates that combine a shape with engine mount points:

```typescript
interface EngineMount {
  name: string;           // 'main', 'port', 'starboard'
  position: Vector2;      // Local coords on shape
  direction: Vector2;     // Thrust direction (normalized)
}

interface ShipTemplate {
  id: string;
  name: string;
  shape: Shape;
  engineMounts: EngineMount[];
  defaultSize: number;
  category: ShipCategory;
}
```

The player's Firefly-class ship has 3 engine mounts. NPC ships vary from 1-4 engines depending on type.

### 3. Modular Station Composition

Stations use a **module-based composition pattern** rather than monolithic shapes:

```typescript
type StationModuleType = 
  | 'core'          // Central hub
  | 'docking-ring'  // Contains docking ports
  | 'habitat'       // Crew quarters
  | 'cargo'         // Storage
  | 'solar-array'   // Power generation
  | 'antenna'       // Communications
  | 'refinery'      // Processing
  | 'command';      // Control center

interface StationModule {
  type: StationModuleType;
  shape: Shape;
  connectionPoints: Vector2[];  // Where other modules attach
  dockingPorts?: DockingPort[]; // If this module has docking
}

interface StationTemplate {
  id: string;
  name: string;
  type: StationType;
  modules: StationModulePlacement[];
}
```

**Why modular composition for stations:**
- Stations are larger and more complex than ships
- Different station types share common modules (many need docking capabilities)
- Reduces art/design effort: 8 module types can create dozens of station variants
- Enables future station building/expansion mechanics
- Docking ports are placed on specific module types (for example: `habitat`, `cargo`, `refinery`); the `docking-ring` in the current implementation is primarily visual and does not itself provide docking ports

### 4. Collision Detection: Separating Axis Theorem (SAT)

Replace radius-based collision with SAT for convex polygon collision:

```typescript
function checkPolygonCollision(
  verticesA: Vector2[],
  verticesB: Vector2[]
): CollisionResult;
```

SAT provides:
- Accurate collision detection for any convex polygon
- Penetration depth for collision response
- Normal vector for push-out direction

Performance is maintained via AABB pre-checks that eliminate most comparisons.

### 5. Particle System Integration

Extend `particleStore` to support multiple emitters per ship:

```typescript
// Register one emitter per engine mount
registerEmitter(`${shipId}-engine-main`, getMainEnginePosition, getThrottle);
registerEmitter(`${shipId}-engine-port`, getPortEnginePosition, getThrottle);
registerEmitter(`${shipId}-engine-starboard`, getStarboardEnginePosition, getThrottle);
```

Position callbacks transform local engine mount coords to world coords based on ship position, heading, and size.

### 6. Level of Detail (LOD)

To maintain performance the renderer uses configurable LOD thresholds:

- Shapes smaller than a configurable `minSize` (renderer default: 4 pixels) render as a single point.
- `HelmMap` uses `minSize = 6px` for ships and `8px` for stations to tune visibility on the map view.
- Shapes larger than `minSize` may render simplified outlines (reduced vertex detail); full polygon detail is used beyond the detail threshold.

## Consequences

### Positive

- **Visual Distinction**: Players can identify ship and station types at a glance
- **Immersion**: Serenity-inspired player ship creates Firefly atmosphere
- **Accurate Collision**: Ship wings and station arms have real collision boundaries
- **Engine Realism**: Particle traces from visible engine locations
- **Flexible Docking**: Stations can have multiple docking ports with approach requirements
- **Sensor Depth**: Future raytracing for occlusion becomes possible
- **Scalable Content**: Modular stations allow many variants from few module designs
- **Future-Proof**: Foundation for station building, ship damage visualization, etc.

### Negative

- **Complexity**: More code to maintain than simple circle rendering
- **Performance Overhead**: Polygon collision is more expensive than radius checks (mitigated by AABB pre-checks and LOD)
- **Shape Design Effort**: Each ship/station type needs vertex definitions
- **Convex Limitation**: SAT requires convex polygons; complex concave shapes need decomposition
- **Testing Burden**: More visual edge cases to verify

## Alternatives Considered

### 1. Sprite-Based Rendering

Use bitmap images for ships/stations instead of polygons.

**Rejected because:**
- Rotation requires pre-rendered angles or expensive runtime rotation
- Collision still needs polygon bounds or pixel-perfect collision
- Doesn't integrate with existing Canvas 2D rendering pipeline
- Harder to maintain consistent LCARS aesthetic

### 2. Monolithic Station Shapes

Define each station type as a single complex polygon.

**Rejected because:**
- Every station variant needs unique artwork
- No code reuse between station types
- Docking port positions are arbitrary per design
- Cannot support future station building mechanics

### 3. Physics Engine (Matter.js, Box2D)

Use a full 2D physics engine for collision.

**Rejected because:**
- Overkill for our simple collision needs (no rigid body dynamics)
- Adds significant dependency
- Our ships don't need realistic physics (they turn and stop instantly)
- Constitution principle: keep game-first architecture simple

### 4. Circle Hierarchy (Bounding Circles)

Use multiple overlapping circles to approximate shapes.

**Rejected because:**
- Poor approximation for angular shapes (ship wings, station arms)
- More circles = worse performance than polygons
- Still imprecise for collision

## References

- [Feature Spec: 005-2d-shape-system](../../specs/005-2d-shape-system/spec.md)
- [Research: Collision Detection Algorithms](../../specs/005-2d-shape-system/research.md)
- [Data Model: Shape System](../../specs/005-2d-shape-system/data-model.md)
- [ADR-0007: Engine Particle Trace System](0007-engine-particle-trace-system.md)
- [ADR-0008: Ship Composition Architecture](0008-ship-composition.md)
- [Separating Axis Theorem (Wikipedia)](https://en.wikipedia.org/wiki/Hyperplane_separation_theorem)
