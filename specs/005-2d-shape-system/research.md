# Research: 2D Ship and Station Shape System

**Feature**: 005-2d-shape-system  
**Date**: January 23, 2026  
**Status**: Complete

## Overview

This document captures research findings for implementing a 2D polygon-based shape system for ships and stations in Space Freighter Sim.

---

## 1. Polygon Rendering in Canvas 2D

### Decision: Use Canvas Path API with pre-transformed vertices

### Rationale
- Canvas 2D `Path2D` API provides efficient polygon rendering
- Pre-calculating world-space vertices once per frame (before drawing) eliminates redundant matrix operations
- Filling and stroking polygons is a single draw call per shape
- Supports complex shapes with holes if needed (for station modules)

### Implementation Pattern

```typescript
function renderPolygon(
  ctx: CanvasRenderingContext2D,
  vertices: Vector2[],       // Local normalized coords (-1 to 1)
  position: Vector2,         // World position
  rotation: number,          // Rotation in radians
  scale: number,             // Size multiplier
  camera: CameraState,       // For world-to-screen transform
  fillColor?: string,
  strokeColor?: string
): void {
  // 1. Transform vertices: local → world → screen
  const screenVertices = vertices.map(v => {
    const rotated = rotatePoint(v, rotation);
    const scaled = { x: rotated.x * scale, y: rotated.y * scale };
    const world = { x: position.x + scaled.x, y: position.y + scaled.y };
    return worldToScreen(world, camera);
  });

  // 2. Draw using Path2D for efficiency
  ctx.beginPath();
  ctx.moveTo(screenVertices[0].x, screenVertices[0].y);
  for (let i = 1; i < screenVertices.length; i++) {
    ctx.lineTo(screenVertices[i].x, screenVertices[i].y);
  }
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }
}
```

### Alternatives Considered
- **WebGL**: Better performance for 1000+ objects but adds complexity; our target is 20-50 objects
- **SVG**: DOM-based, violates "no DOM in hot paths" principle
- **Offscreen Canvas**: Good for static shapes, but ships/stations rotate frequently

---

## 2. Collision Detection Algorithm

### Decision: Separating Axis Theorem (SAT) for convex polygons

### Rationale
- SAT is the standard algorithm for convex polygon collision detection
- Provides both collision detection (boolean) and collision response data (penetration depth, normal)
- Works with any convex polygon vertex count
- Can be optimized with bounding box pre-checks

### Implementation Pattern

```typescript
interface CollisionResult {
  collides: boolean;
  penetration?: number;
  normal?: Vector2;
  contactPoint?: Vector2;
}

function checkPolygonCollision(
  verticesA: Vector2[],
  verticesB: Vector2[]
): CollisionResult {
  // 1. Quick AABB pre-check
  if (!aabbOverlap(getBoundingBox(verticesA), getBoundingBox(verticesB))) {
    return { collides: false };
  }

  // 2. SAT: Test all edges from both polygons
  let minPenetration = Infinity;
  let collisionNormal: Vector2 | undefined;

  for (const vertices of [verticesA, verticesB]) {
    for (let i = 0; i < vertices.length; i++) {
      const edge = vec2Sub(vertices[(i + 1) % vertices.length], vertices[i]);
      const axis = vec2Normalize({ x: -edge.y, y: edge.x }); // Perpendicular

      const projA = projectPolygon(verticesA, axis);
      const projB = projectPolygon(verticesB, axis);

      const overlap = getOverlap(projA, projB);
      if (overlap <= 0) {
        return { collides: false }; // Separating axis found
      }

      if (overlap < minPenetration) {
        minPenetration = overlap;
        collisionNormal = axis;
      }
    }
  }

  return {
    collides: true,
    penetration: minPenetration,
    normal: collisionNormal,
  };
}
```

### Performance Considerations
- Bounding box pre-check eliminates 90%+ of comparisons
- For swept collision (high-speed objects), use continuous collision detection (CCD) with Minkowski sums
- Cache world-space vertices per frame to avoid redundant transforms

### Alternatives Considered
- **Circle-only collision**: Current approach, too imprecise for shaped objects
- **GJK Algorithm**: More general (handles concave), but SAT is faster for convex and sufficient for our needs
- **Physics engine (Matter.js, Box2D)**: Overkill for our simple needs, adds dependency

---

## 3. Serenity-Inspired Ship Shape Design

### Decision: 24-vertex polygon approximating Serenity silhouette

### Rationale
- 24 vertices provides good visual fidelity without excessive polygon count
- Captures key features: wide rear cargo bay, tapered body, forward cockpit, side engine pods
- Normalized coordinates (-1 to 1) allow runtime scaling
- Engine mount points positioned at rear: center (0, -0.9), port (-0.4, -0.7), starboard (0.4, -0.7)

### Shape Definition

```typescript
const PLAYER_SHIP_SHAPE: ShapeDefinition = {
  id: 'serenity',
  name: 'Firefly-class Transport',
  vertices: [
    // Forward cockpit (tapered nose)
    { x: 0.0, y: 1.0 },     // Nose tip
    { x: 0.15, y: 0.85 },
    { x: 0.2, y: 0.6 },
    // Main body right side
    { x: 0.3, y: 0.3 },
    { x: 0.35, y: 0.0 },
    // Starboard engine pod
    { x: 0.6, y: -0.2 },
    { x: 0.65, y: -0.5 },
    { x: 0.55, y: -0.8 },
    { x: 0.4, y: -0.85 },
    // Rear cargo bay
    { x: 0.3, y: -0.9 },
    { x: 0.0, y: -0.95 },   // Center rear
    { x: -0.3, y: -0.9 },
    // Port engine pod
    { x: -0.4, y: -0.85 },
    { x: -0.55, y: -0.8 },
    { x: -0.65, y: -0.5 },
    { x: -0.6, y: -0.2 },
    // Main body left side
    { x: -0.35, y: 0.0 },
    { x: -0.3, y: 0.3 },
    { x: -0.2, y: 0.6 },
    { x: -0.15, y: 0.85 },
  ],
  engineMounts: [
    { position: { x: 0.0, y: -0.9 }, direction: { x: 0, y: -1 }, name: 'main' },
    { position: { x: -0.5, y: -0.7 }, direction: { x: 0, y: -1 }, name: 'port' },
    { position: { x: 0.5, y: -0.7 }, direction: { x: 0, y: -1 }, name: 'starboard' },
  ],
};
```

### Visual Reference
The shape captures Serenity's distinctive profile:
- Elongated forward section (cockpit/bridge)
- Wide mid-section (cargo bay)
- Distinctive engine pods on port and starboard
- Three engine glow points visible from rear

---

## 4. NPC Ship Type Designs

### Decision: 5 ship types with distinct silhouettes

### Ship Types

| Type | Vertices | Description | Key Features |
|------|----------|-------------|--------------|
| Freighter | 16 | Boxy cargo hauler | Wide rectangular body, single large engine |
| Cutter | 12 | Fast patrol vessel | Sleek triangular, twin engines |
| Cruiser | 20 | Medium military | Elongated, multiple engine arrays |
| Destroyer | 24 | Large military | Wedge-shaped, intimidating profile |
| Liner | 20 | Passenger transport | Rounded, elegant curves |

### Design Principles
- Each ship must be distinguishable at small scales (radar display)
- Silhouettes should communicate ship role (military = angular, civilian = rounded)
- Engine count reflects ship capabilities (more engines = faster/more maneuverable)

---

## 5. Modular Station Composition

### Decision: Component-based station assembly with predefined module types

### Rationale
- Stations are larger and more complex than ships
- Modular approach allows variety with limited artwork
- Each module type has connection points for assembly
- Docking ports are always on "docking ring" modules

### Module Types

| Module | Purpose | Connection Points |
|--------|---------|-------------------|
| `core` | Central hub | 4-6 radial connections |
| `docking-ring` | Ship docking | 2-4 docking ports, 2 connections |
| `habitat` | Crew quarters | 2 connections |
| `cargo` | Storage | 2 connections |
| `solar-array` | Power generation | 1 connection |
| `antenna` | Communications | 1 connection |
| `refinery` | Processing | 2 connections |

### Station Template Example

```typescript
const TRADING_HUB_TEMPLATE: StationTemplate = {
  id: 'trading-hub',
  name: 'Trading Hub',
  modules: [
    { type: 'core', position: { x: 0, y: 0 }, rotation: 0 },
    { type: 'docking-ring', position: { x: 0, y: 150 }, rotation: 0 },
    { type: 'docking-ring', position: { x: 0, y: -150 }, rotation: 180 },
    { type: 'cargo', position: { x: 100, y: 0 }, rotation: 90 },
    { type: 'cargo', position: { x: -100, y: 0 }, rotation: 270 },
    { type: 'solar-array', position: { x: 150, y: 100 }, rotation: 45 },
    { type: 'solar-array', position: { x: -150, y: 100 }, rotation: -45 },
  ],
  dockingPorts: [
    { position: { x: 0, y: 200 }, approachVector: { x: 0, y: 1 }, size: 'medium' },
    { position: { x: 0, y: -200 }, approachVector: { x: 0, y: -1 }, size: 'medium' },
  ],
};
```

---

## 6. Particle System Integration

### Decision: Extend existing particleStore with multi-origin emitter support

### Current Implementation
The `particleStore` registers emitters with a single position callback:
```typescript
registerEmitter(id: string, getPosition: () => Vector2, getThrottle: () => number)
```

### Required Changes
1. Support multiple emission points per ship (one per engine mount)
2. Each emission point gets its own emitter ID: `${shipId}-engine-${mountName}`
3. Position callback transforms engine mount local coords to world coords

### Implementation Pattern

```typescript
// In shipStore or dedicated engine system
function registerShipEngines(ship: Ship, shape: ShipTemplate): void {
  const particleStore = useParticleStore();

  for (const mount of shape.engineMounts) {
    const emitterId = `${ship.id}-engine-${mount.name}`;

    particleStore.registerEmitter(
      emitterId,
      // Position: transform local mount position to world
      () => localToWorld(mount.position, ship.position, ship.heading, ship.size),
      // Throttle: use ship's current throttle
      () => ship.speed / ship.engines.maxSpeed
    );
  }
}
```

---

## 7. 2D Raytracing for Sensor Occlusion

### Decision: Line-polygon intersection testing for sensor rays

### Rationale
- Sensors cast rays from player ship to potential contacts
- Rays that intersect obstacle shapes result in occluded contacts
- Simple line-segment intersection with polygon edges

### Implementation Pattern

```typescript
interface RaycastResult {
  hit: boolean;
  distance?: number;
  hitPoint?: Vector2;
  hitObject?: string; // ID of blocking object
}

function castRay(
  origin: Vector2,
  direction: Vector2,
  maxDistance: number,
  obstacles: Array<{ id: string; vertices: Vector2[] }>
): RaycastResult {
  let closestHit: RaycastResult = { hit: false };
  const rayEnd = vec2Add(origin, vec2Scale(direction, maxDistance));

  for (const obstacle of obstacles) {
    for (let i = 0; i < obstacle.vertices.length; i++) {
      const edgeStart = obstacle.vertices[i];
      const edgeEnd = obstacle.vertices[(i + 1) % obstacle.vertices.length];

      const intersection = lineLineIntersection(origin, rayEnd, edgeStart, edgeEnd);
      if (intersection) {
        const distance = vec2Distance(origin, intersection);
        if (!closestHit.hit || distance < closestHit.distance!) {
          closestHit = {
            hit: true,
            distance,
            hitPoint: intersection,
            hitObject: obstacle.id,
          };
        }
      }
    }
  }

  return closestHit;
}
```

### Performance Considerations
- Only raycast to contacts within sensor range
- Use spatial partitioning (grid) for large object counts
- Cache obstacle world vertices per frame

---

## 8. Distance-Based Level of Detail (LOD)

### Decision: Three LOD levels based on screen pixel size

### Rationale
- Sub-pixel shapes should render as points for performance
- Distant shapes can use simplified outlines
- Close shapes get full detail

### LOD Thresholds

| Level | Screen Size | Rendering |
|-------|-------------|-----------|
| LOD0 | < 3 pixels | Single pixel dot |
| LOD1 | 3-15 pixels | Simple outline (4-8 vertices) |
| LOD2 | > 15 pixels | Full detail polygon |

### Implementation

```typescript
function getShapeLOD(
  worldSize: number,
  camera: CameraState
): 'dot' | 'simple' | 'detailed' {
  const screenSize = worldSize * camera.zoom;

  if (screenSize < 3) return 'dot';
  if (screenSize < 15) return 'simple';
  return 'detailed';
}
```

---

## Summary

All research questions have been resolved:

| Question | Resolution |
|----------|------------|
| Polygon rendering approach | Canvas Path2D with pre-transformed vertices |
| Collision detection algorithm | Separating Axis Theorem (SAT) with AABB pre-check |
| Player ship shape design | 24-vertex Serenity-inspired silhouette |
| NPC ship variety | 5 distinct types with 12-24 vertices each |
| Station composition | Modular component-based assembly |
| Particle system integration | Multi-origin emitters per engine mount |
| Sensor raytracing | Line-polygon intersection testing |
| LOD for distant objects | Three-level system based on screen pixel size |
