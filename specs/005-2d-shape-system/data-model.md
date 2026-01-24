# Data Model: 2D Ship and Station Shape System

**Feature**: 005-2d-shape-system  
**Date**: January 23, 2026  
**Status**: Complete

## Overview

This document defines the data models for the 2D shape system, including shapes, engine mounts, docking ports, and ship/station templates.

---

## Core Entities

### Shape

A 2D polygon definition for rendering and collision detection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the shape |
| `name` | `string` | Yes | Human-readable name |
| `vertices` | `Vector2[]` | Yes | Polygon vertices in local normalized coords (-1 to 1) |
| `boundingRadius` | `number` | Yes | Pre-calculated bounding circle radius for quick checks |
| `centroid` | `Vector2` | No | Shape center of mass (default: origin) |

**Constraints:**
- Minimum 3 vertices
- Maximum 32 vertices for performance
- Vertices must form a convex polygon (for SAT collision)
- Vertices ordered counter-clockwise

**Example:**
```typescript
const triangleShape: Shape = {
  id: 'triangle',
  name: 'Triangle',
  vertices: [
    { x: 0, y: 1 },
    { x: 0.87, y: -0.5 },
    { x: -0.87, y: -0.5 },
  ],
  boundingRadius: 1.0,
};
```

---

### EngineMount

A position and direction on a ship where an engine is located.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Engine identifier (e.g., 'main', 'port', 'starboard') |
| `position` | `Vector2` | Yes | Local coordinates relative to shape origin |
| `direction` | `Vector2` | Yes | Normalized thrust direction (typically backward) |
| `thrustMultiplier` | `number` | No | Relative thrust power (default: 1.0) |

**Constraints:**
- Position must be within shape bounds
- Direction must be normalized (length = 1)

**Example:**
```typescript
const mainEngine: EngineMount = {
  name: 'main',
  position: { x: 0, y: -0.9 },
  direction: { x: 0, y: -1 },
  thrustMultiplier: 1.0,
};
```

---

### DockingPort

A position on a station where ships can dock.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique port identifier |
| `position` | `Vector2` | Yes | World position (or local if on module) |
| `approachVector` | `Vector2` | Yes | Required approach direction (normalized) |
| `size` | `DockingPortSize` | Yes | Ship size compatibility |
| `alignmentTolerance` | `number` | No | Degrees of heading tolerance (default: 15) |
| `dockingRange` | `number` | No | Distance at which docking is available (default: 30) |

**DockingPortSize:** `'small' | 'medium' | 'large'`

**Constraints:**
- Approach vector must be normalized
- Alignment tolerance 5-45 degrees

**Example:**
```typescript
const portAlpha: DockingPort = {
  id: 'port-alpha',
  position: { x: 0, y: 200 },
  approachVector: { x: 0, y: 1 },
  size: 'medium',
  alignmentTolerance: 15,
  dockingRange: 30,
};
```

---

### ShipTemplate

A reusable definition combining a shape with engine configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique template identifier |
| `name` | `string` | Yes | Display name for the ship type |
| `shape` | `Shape` | Yes | The ship's polygon shape |
| `engineMounts` | `EngineMount[]` | Yes | Engine locations (minimum 1) |
| `defaultSize` | `number` | Yes | Default world-unit size |
| `category` | `ShipCategory` | Yes | Ship classification |
| `description` | `string` | No | Flavor text |

**ShipCategory:** `'player' | 'freighter' | 'patrol' | 'military' | 'passenger' | 'utility'`

**Constraints:**
- At least one engine mount required
- defaultSize > 0

**Example:**
```typescript
const fireflyTemplate: ShipTemplate = {
  id: 'firefly',
  name: 'Firefly-class Transport',
  shape: serenityShape,
  engineMounts: [
    { name: 'main', position: { x: 0, y: -0.9 }, direction: { x: 0, y: -1 } },
    { name: 'port', position: { x: -0.5, y: -0.7 }, direction: { x: 0, y: -1 } },
    { name: 'starboard', position: { x: 0.5, y: -0.7 }, direction: { x: 0, y: -1 } },
  ],
  defaultSize: 40,
  category: 'player',
  description: 'A mid-bulk transport, standard radion-accelerator core.',
};
```

---

### StationModule

A reusable building block for station composition.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `StationModuleType` | Yes | Module classification |
| `shape` | `Shape` | Yes | Module polygon shape |
| `connectionPoints` | `Vector2[]` | Yes | Where other modules can attach |
| `dockingPorts` | `DockingPort[]` | No | Ports if this is a docking module |

**StationModuleType:** `'core' | 'docking-ring' | 'habitat' | 'cargo' | 'solar-array' | 'antenna' | 'refinery' | 'command'`

**Example:**
```typescript
const dockingRingModule: StationModule = {
  type: 'docking-ring',
  shape: dockingRingShape,
  connectionPoints: [
    { x: 0, y: -50 },  // Connect to core
    { x: 0, y: 50 },   // Connect outward
  ],
  dockingPorts: [
    { id: 'port-1', position: { x: -40, y: 0 }, approachVector: { x: -1, y: 0 }, size: 'medium' },
    { id: 'port-2', position: { x: 40, y: 0 }, approachVector: { x: 1, y: 0 }, size: 'medium' },
  ],
};
```

---

### StationModulePlacement

An instance of a module within a station template.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `moduleType` | `StationModuleType` | Yes | Which module to place |
| `position` | `Vector2` | Yes | Offset from station origin |
| `rotation` | `number` | Yes | Rotation in degrees |

---

### StationTemplate

A complete station definition composed of modules.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique template identifier |
| `name` | `string` | Yes | Display name |
| `type` | `StationType` | Yes | Station classification |
| `modules` | `StationModulePlacement[]` | Yes | Module arrangement |
| `defaultRotation` | `number` | No | Initial rotation (default: 0) |

**Example:**
```typescript
const tradingHubTemplate: StationTemplate = {
  id: 'trading-hub-standard',
  name: 'Standard Trading Hub',
  type: 'trading-hub',
  modules: [
    { moduleType: 'core', position: { x: 0, y: 0 }, rotation: 0 },
    { moduleType: 'docking-ring', position: { x: 0, y: 100 }, rotation: 0 },
    { moduleType: 'docking-ring', position: { x: 0, y: -100 }, rotation: 180 },
    { moduleType: 'cargo', position: { x: 80, y: 0 }, rotation: 90 },
    { moduleType: 'cargo', position: { x: -80, y: 0 }, rotation: 270 },
  ],
  defaultRotation: 0,
};
```

---

## Extended Ship Model

The existing `Ship` interface is extended with shape references:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | `string` | No | Reference to ShipTemplate (null = legacy circle) |
| `size` | `number` | No | World-unit size (scales shape) |

**Fallback Behavior:**
- If `templateId` is undefined, render as legacy circle
- If template not found, log warning and render as circle

---

## Extended Station Model

The existing `Station` interface is extended:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | `string` | No | Reference to StationTemplate |
| `rotation` | `number` | No | Current rotation in degrees |

---

## Collision Data

### CollisionResult

Result of a collision check between two shapes.

| Field | Type | Description |
|-------|------|-------------|
| `collides` | `boolean` | Whether collision occurred |
| `penetration` | `number` | Overlap depth (if colliding) |
| `normal` | `Vector2` | Push-out direction (if colliding) |
| `contactPoint` | `Vector2` | Approximate contact location |

---

### BoundingBox (AABB)

Axis-aligned bounding box for quick collision pre-checks.

| Field | Type | Description |
|-------|------|-------------|
| `minX` | `number` | Left edge |
| `maxX` | `number` | Right edge |
| `minY` | `number` | Bottom edge |
| `maxY` | `number` | Top edge |

---

## Entity Relationships

```
┌──────────────────┐      ┌──────────────────┐
│   ShipTemplate   │──────│      Shape       │
├──────────────────┤      ├──────────────────┤
│ id               │      │ id               │
│ name             │      │ vertices[]       │
│ shape ───────────┼──────│ boundingRadius   │
│ engineMounts[] ──┼──┐   └──────────────────┘
│ defaultSize      │  │
│ category         │  │   ┌──────────────────┐
└──────────────────┘  └───│   EngineMount    │
         │                ├──────────────────┤
         │                │ name             │
         ▼                │ position         │
┌──────────────────┐      │ direction        │
│      Ship        │      └──────────────────┘
├──────────────────┤
│ templateId ──────┼────▶ (lookup ShipTemplate)
│ size             │
│ position         │
│ heading          │
└──────────────────┘

┌──────────────────┐      ┌──────────────────┐
│ StationTemplate  │──────│  StationModule   │
├──────────────────┤      ├──────────────────┤
│ id               │      │ type             │
│ name             │      │ shape ───────────┼──▶ Shape
│ type             │      │ connectionPoints │
│ modules[] ───────┼──────│ dockingPorts[] ──┼──┐
└──────────────────┘      └──────────────────┘  │
         │                                       │
         │                ┌──────────────────┐  │
         │                │   DockingPort    │◀─┘
         ▼                ├──────────────────┤
┌──────────────────┐      │ id               │
│     Station      │      │ position         │
├──────────────────┤      │ approachVector   │
│ templateId ──────┼────▶ │ size             │
│ rotation         │      └──────────────────┘
│ position         │
└──────────────────┘
```

---

## State Transitions

### Ship Engine Activation

```
Engine OFF ──[throttle > 0]──▶ Engine ON
     │                              │
     │                              ▼
     │                    Particle emitter registered
     │                    Traces emit from mount position
     │
     ◀───[throttle = 0]────────────┘
                │
                ▼
      Emitter unregistered (or emit 0)
```

### Docking State Machine

```
                    ┌─────────────┐
                    │   FLYING    │
                    └──────┬──────┘
                           │
         [within docking range & aligned]
                           │
                           ▼
                    ┌─────────────┐
                    │  DOCKING    │
                    │  AVAILABLE  │
                    └──────┬──────┘
                           │
                  [player initiates dock]
                           │
                           ▼
                    ┌─────────────┐
                    │   DOCKED    │
                    └──────┬──────┘
                           │
                    [player undocks]
                           │
                           ▼
                    ┌─────────────┐
                    │   FLYING    │
                    └─────────────┘
```

---

## Validation Rules

| Entity | Rule | Error |
|--------|------|-------|
| Shape | vertices.length >= 3 | "Shape must have at least 3 vertices" |
| Shape | vertices.length <= 32 | "Shape exceeds maximum 32 vertices" |
| Shape | isConvex(vertices) | "Shape must be convex for collision detection" |
| EngineMount | vec2Length(direction) ≈ 1 | "Engine direction must be normalized" |
| DockingPort | alignmentTolerance 5-45 | "Alignment tolerance must be 5-45 degrees" |
| ShipTemplate | engineMounts.length >= 1 | "Ship must have at least one engine" |
| ShipTemplate | defaultSize > 0 | "Ship size must be positive" |
