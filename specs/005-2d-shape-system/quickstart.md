# Quickstart: 2D Ship and Station Shape System

**Feature**: 005-2d-shape-system  
**Date**: January 23, 2026

## Overview

This guide provides a quick implementation reference for the 2D shape system.

---

## 1. Create Shape Models

### Location: `src/models/Shape.ts`

```typescript
import type { Vector2 } from './math';

export interface Shape {
  id: string;
  name: string;
  vertices: Vector2[];
  boundingRadius: number;
  centroid?: Vector2;
}

export interface EngineMount {
  name: string;
  position: Vector2;
  direction: Vector2;
  thrustMultiplier?: number;
}

export interface ShipTemplate {
  id: string;
  name: string;
  shape: Shape;
  engineMounts: EngineMount[];
  defaultSize: number;
  category: ShipCategory;
}

export type ShipCategory = 'player' | 'freighter' | 'patrol' | 'military' | 'passenger' | 'utility';
```

---

## 2. Define Player Ship Shape

### Location: `src/data/shapes/playerShip.ts`

```typescript
import type { ShipTemplate, Shape } from '@/models';

const serenityShape: Shape = {
  id: 'serenity-shape',
  name: 'Serenity Hull',
  vertices: [
    { x: 0.0, y: 1.0 },      // Nose
    { x: 0.15, y: 0.85 },
    { x: 0.2, y: 0.6 },
    { x: 0.3, y: 0.3 },
    { x: 0.35, y: 0.0 },
    { x: 0.6, y: -0.2 },     // Starboard pod
    { x: 0.65, y: -0.5 },
    { x: 0.55, y: -0.8 },
    { x: 0.4, y: -0.85 },
    { x: 0.3, y: -0.9 },
    { x: 0.0, y: -0.95 },    // Rear center
    { x: -0.3, y: -0.9 },
    { x: -0.4, y: -0.85 },
    { x: -0.55, y: -0.8 },   // Port pod
    { x: -0.65, y: -0.5 },
    { x: -0.6, y: -0.2 },
    { x: -0.35, y: 0.0 },
    { x: -0.3, y: 0.3 },
    { x: -0.2, y: 0.6 },
    { x: -0.15, y: 0.85 },
  ],
  boundingRadius: 1.0,
};

export const PLAYER_SHIP_TEMPLATE: ShipTemplate = {
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
};
```

---

## 3. Create Shape Renderer

### Location: `src/core/rendering/shapeRenderer.ts`

```typescript
import type { Vector2, Shape } from '@/models';
import type { CameraState } from './mapUtils';
import { worldToScreen } from './mapUtils';

/**
 * Transform a local vertex to screen coordinates
 */
export function transformVertex(
  local: Vector2,
  worldPos: Vector2,
  rotation: number,  // radians
  scale: number,
  camera: CameraState
): Vector2 {
  // Rotate
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotated = {
    x: local.x * cos - local.y * sin,
    y: local.x * sin + local.y * cos,
  };
  
  // Scale and translate to world
  const world = {
    x: worldPos.x + rotated.x * scale,
    y: worldPos.y + rotated.y * scale,
  };
  
  // Convert to screen
  return worldToScreen(world, camera);
}

/**
 * Render a shape polygon
 */
export function renderShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  worldPos: Vector2,
  rotation: number,
  scale: number,
  camera: CameraState,
  fillColor?: string,
  strokeColor?: string
): void {
  const screenVerts = shape.vertices.map(v =>
    transformVertex(v, worldPos, rotation, scale, camera)
  );

  ctx.beginPath();
  ctx.moveTo(screenVerts[0].x, screenVerts[0].y);
  for (let i = 1; i < screenVerts.length; i++) {
    ctx.lineTo(screenVerts[i].x, screenVerts[i].y);
  }
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
```

---

## 4. Create Collision Detection

### Location: `src/core/physics/collision.ts`

```typescript
import type { Vector2 } from '@/models';

export interface CollisionResult {
  collides: boolean;
  penetration?: number;
  normal?: Vector2;
}

/**
 * Project polygon onto axis, return min/max
 */
function projectPolygon(vertices: Vector2[], axis: Vector2): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  
  for (const v of vertices) {
    const dot = v.x * axis.x + v.y * axis.y;
    min = Math.min(min, dot);
    max = Math.max(max, dot);
  }
  
  return { min, max };
}

/**
 * SAT collision detection for convex polygons
 */
export function checkPolygonCollision(
  verticesA: Vector2[],
  verticesB: Vector2[]
): CollisionResult {
  let minPenetration = Infinity;
  let collisionNormal: Vector2 | undefined;

  // Test all edges from both polygons
  for (const vertices of [verticesA, verticesB]) {
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      
      // Edge perpendicular (normal)
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const len = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
      const axis = { x: -edge.y / len, y: edge.x / len };
      
      const projA = projectPolygon(verticesA, axis);
      const projB = projectPolygon(verticesB, axis);
      
      const overlap = Math.min(projA.max - projB.min, projB.max - projA.min);
      
      if (overlap <= 0) {
        return { collides: false };
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

---

## 5. Extend Particle Store

### Location: Update `src/stores/particleStore.ts`

```typescript
// Add to existing particleStore

/**
 * Register multiple emitters for a ship's engines
 */
function registerShipEngines(
  shipId: string,
  getShipState: () => { position: Vector2; heading: number; size: number; speed: number; maxSpeed: number },
  engineMounts: EngineMount[]
): void {
  for (const mount of engineMounts) {
    const emitterId = `${shipId}-engine-${mount.name}`;
    
    registerEmitter(
      emitterId,
      () => {
        const ship = getShipState();
        // Transform mount position from local to world
        const rad = ship.heading * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
          x: ship.position.x + (mount.position.x * cos - mount.position.y * sin) * ship.size,
          y: ship.position.y + (mount.position.x * sin + mount.position.y * cos) * ship.size,
        };
      },
      () => {
        const ship = getShipState();
        return ship.speed / ship.maxSpeed;
      }
    );
  }
}

/**
 * Unregister all emitters for a ship
 */
function unregisterShipEngines(shipId: string, engineMounts: EngineMount[]): void {
  for (const mount of engineMounts) {
    unregisterEmitter(`${shipId}-engine-${mount.name}`);
  }
}
```

---

## 6. Integration Checklist

- [ ] Create `src/models/Shape.ts` with interfaces
- [ ] Create `src/data/shapes/playerShip.ts` with Serenity shape
- [ ] Create `src/data/shapes/npcShips.ts` with 5 NPC ship types
- [ ] Create `src/data/shapes/stations.ts` with station modules and templates
- [ ] Create `src/core/rendering/shapeRenderer.ts`
- [ ] Create `src/core/physics/collision.ts`
- [ ] Update `src/models/Ship.ts` to add `templateId` and `size`
- [ ] Update `src/models/Station.ts` to add `templateId` and `rotation`
- [ ] Update `src/stores/particleStore.ts` for multi-engine support
- [ ] Update `src/components/map/SystemMap.vue` to render shapes
- [ ] Update `src/components/sensors/RadarDisplay.vue` to render shapes
- [ ] Write unit tests for collision detection
- [ ] Write unit tests for shape transforms
- [ ] Write E2E tests for visual rendering

---

## 7. Test Commands

```bash
# Run unit tests
npm run test

# Run specific test file
npm run test -- src/core/physics/collision.test.ts

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

---

## 8. Key Files Reference

| File | Purpose |
|------|---------|
| `src/models/Shape.ts` | Core shape interfaces |
| `src/data/shapes/playerShip.ts` | Player ship template |
| `src/data/shapes/npcShips.ts` | NPC ship templates |
| `src/data/shapes/stations.ts` | Station modules and templates |
| `src/core/rendering/shapeRenderer.ts` | Polygon rendering utilities |
| `src/core/physics/collision.ts` | SAT collision detection |
| `src/stores/particleStore.ts` | Multi-engine particle emission |
| `src/components/map/SystemMap.vue` | Main map rendering |
| `src/components/sensors/RadarDisplay.vue` | Sensor display rendering |
