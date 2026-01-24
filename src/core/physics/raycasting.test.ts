/**
 * Unit tests for 2D Raycasting System
 * 
 * @see src/core/physics/raycasting.ts
 */

import { describe, it, expect } from 'vitest';
import {
  rayPolygonIntersection,
  raySegmentIntersection,
  rayShapeIntersection,
  raycast,
  raycastAll,
  createRay,
  hasLineOfSight,
  calculateVisibility,
  getWorldVertices,
  type Ray,
  type RaycastTarget,
} from './raycasting';
import type { Shape, Vector2 } from '@/models';

// =============================================================================
// Test Fixtures
// =============================================================================

const createSquare = (size: number = 1): Shape => ({
  id: 'square',
  name: 'Square',
  vertices: [
    { x: -size, y: -size },
    { x: size, y: -size },
    { x: size, y: size },
    { x: -size, y: size },
  ],
  boundingRadius: Math.sqrt(2) * size,
});


const createTarget = (
  id: string,
  position: Vector2,
  shape: Shape,
  rotation: number = 0,
  scale: number = 1
): RaycastTarget => ({
  id,
  position,
  rotation,
  scale,
  shape,
});

// =============================================================================
// T051a: Ray-Polygon Intersection Tests
// =============================================================================

describe('raySegmentIntersection', () => {
  it('should detect intersection with horizontal segment', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const p1 = { x: 5, y: -1 };
    const p2 = { x: 5, y: 1 };

    const result = raySegmentIntersection(ray, p1, p2);

    expect(result.hit).toBe(true);
    expect(result.distance).toBeCloseTo(5);
    expect(result.point?.x).toBeCloseTo(5);
    expect(result.point?.y).toBeCloseTo(0);
  });

  it('should not detect intersection when ray misses segment', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const p1 = { x: 5, y: 2 };
    const p2 = { x: 5, y: 3 };

    const result = raySegmentIntersection(ray, p1, p2);

    expect(result.hit).toBe(false);
  });

  it('should not detect intersection when segment is behind ray', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const p1 = { x: -5, y: -1 };
    const p2 = { x: -5, y: 1 };

    const result = raySegmentIntersection(ray, p1, p2);

    expect(result.hit).toBe(false);
  });

  it('should handle ray parallel to segment', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const p1 = { x: 0, y: 1 };
    const p2 = { x: 10, y: 1 };

    const result = raySegmentIntersection(ray, p1, p2);

    expect(result.hit).toBe(false);
  });
});

describe('rayPolygonIntersection', () => {
  it('should detect ray hitting polygon from outside', () => {
    const ray: Ray = {
      origin: { x: -5, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const vertices = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ];

    const result = rayPolygonIntersection(ray, vertices);

    expect(result.hit).toBe(true);
    expect(result.distance).toBeCloseTo(4); // From -5 to -1
    expect(result.point?.x).toBeCloseTo(-1);
    expect(result.point?.y).toBeCloseTo(0);
  });

  it('should detect ray missing polygon', () => {
    const ray: Ray = {
      origin: { x: -5, y: 5 },
      direction: { x: 1, y: 0 },
    };
    const vertices = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ];

    const result = rayPolygonIntersection(ray, vertices);

    expect(result.hit).toBe(false);
  });

  it('should handle ray origin inside polygon', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const vertices = [
      { x: -2, y: -2 },
      { x: 2, y: -2 },
      { x: 2, y: 2 },
      { x: -2, y: 2 },
    ];

    const result = rayPolygonIntersection(ray, vertices);

    // Ray should hit the right edge
    expect(result.hit).toBe(true);
    expect(result.distance).toBeCloseTo(2);
    expect(result.point?.x).toBeCloseTo(2);
  });

  it('should find nearest intersection when ray crosses through polygon', () => {
    const ray: Ray = {
      origin: { x: -5, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const vertices = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ];

    const result = rayPolygonIntersection(ray, vertices);

    // Should find the entry point, not the exit
    expect(result.hit).toBe(true);
    expect(result.distance).toBeCloseTo(4); // Entry at x=-1
  });

  it('should handle ray tangent to polygon edge', () => {
    const ray: Ray = {
      origin: { x: -5, y: 1 },
      direction: { x: 1, y: 0 },
    };
    const vertices = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ];

    const result = rayPolygonIntersection(ray, vertices);

    // Tangent ray should hit at the edge
    expect(result.hit).toBe(true);
  });

  it('should return no hit for degenerate polygon', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    const vertices = [{ x: 1, y: 1 }]; // Only one vertex

    const result = rayPolygonIntersection(ray, vertices);

    expect(result.hit).toBe(false);
  });
});

// =============================================================================
// T052a: Multi-Object Raycast Tests
// =============================================================================

describe('raycast', () => {
  it('should return nearest hit when multiple objects are hit', () => {
    const ray: Ray = {
      origin: { x: -10, y: 0 },
      direction: { x: 1, y: 0 },
    };
    
    const square = createSquare(1);
    const targets: RaycastTarget[] = [
      createTarget('far', { x: 8, y: 0 }, square),
      createTarget('near', { x: 2, y: 0 }, square),
      createTarget('middle', { x: 5, y: 0 }, square),
    ];

    const result = raycast(ray, targets);

    expect(result.hit).toBe(true);
    expect(result.objectId).toBe('near');
    expect(result.distance).toBeLessThan(result.distance + 1);
  });

  it('should return no hit when ray misses all objects', () => {
    const ray: Ray = {
      origin: { x: 0, y: 10 },
      direction: { x: 1, y: 0 },
    };
    
    const square = createSquare(1);
    const targets: RaycastTarget[] = [
      createTarget('obj1', { x: 5, y: 0 }, square),
      createTarget('obj2', { x: 10, y: 0 }, square),
    ];

    const result = raycast(ray, targets);

    expect(result.hit).toBe(false);
    expect(result.objectId).toBeNull();
  });

  it('should respect maxDistance parameter', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    
    const square = createSquare(1);
    const targets: RaycastTarget[] = [
      createTarget('obj1', { x: 10, y: 0 }, square),
    ];

    const resultWithLimit = raycast(ray, targets, 5);
    const resultWithoutLimit = raycast(ray, targets);

    expect(resultWithLimit.hit).toBe(false);
    expect(resultWithoutLimit.hit).toBe(true);
  });

  it('should handle empty target array', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };

    const result = raycast(ray, []);

    expect(result.hit).toBe(false);
  });
});

describe('raycastAll', () => {
  it('should return all hits sorted by distance', () => {
    const ray: Ray = {
      origin: { x: -15, y: 0 },
      direction: { x: 1, y: 0 },
    };
    
    const square = createSquare(1);
    const targets: RaycastTarget[] = [
      createTarget('far', { x: 10, y: 0 }, square),
      createTarget('near', { x: 0, y: 0 }, square),
      createTarget('middle', { x: 5, y: 0 }, square),
    ];

    const results = raycastAll(ray, targets);

    expect(results.length).toBe(3);
    expect(results[0]!.objectId).toBe('near');
    expect(results[1]!.objectId).toBe('middle');
    expect(results[2]!.objectId).toBe('far');
  });

  it('should return empty array when no hits', () => {
    const ray: Ray = {
      origin: { x: 0, y: 100 },
      direction: { x: 1, y: 0 },
    };
    
    const square = createSquare(1);
    const targets: RaycastTarget[] = [
      createTarget('obj1', { x: 5, y: 0 }, square),
    ];

    const results = raycastAll(ray, targets);

    expect(results.length).toBe(0);
  });
});

describe('createRay', () => {
  it('should create normalized direction', () => {
    const ray = createRay({ x: 0, y: 0 }, { x: 10, y: 0 });

    expect(ray.direction.x).toBeCloseTo(1);
    expect(ray.direction.y).toBeCloseTo(0);
  });

  it('should handle diagonal direction', () => {
    const ray = createRay({ x: 0, y: 0 }, { x: 3, y: 4 });

    const length = Math.hypot(ray.direction.x, ray.direction.y);
    expect(length).toBeCloseTo(1);
    expect(ray.direction.x).toBeCloseTo(0.6);
    expect(ray.direction.y).toBeCloseTo(0.8);
  });

  it('should handle zero-length ray', () => {
    const ray = createRay({ x: 5, y: 5 }, { x: 5, y: 5 });

    // Should return a default direction
    const length = Math.hypot(ray.direction.x, ray.direction.y);
    expect(length).toBeCloseTo(1);
  });
});

describe('hasLineOfSight', () => {
  it('should return true when path is clear', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 10, y: 0 };
    
    const square = createSquare(1);
    const obstacles: RaycastTarget[] = [
      createTarget('away', { x: 0, y: 5 }, square),
    ];

    expect(hasLineOfSight(from, to, obstacles)).toBe(true);
  });

  it('should return false when obstacle blocks path', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 10, y: 0 };
    
    const square = createSquare(1);
    const obstacles: RaycastTarget[] = [
      createTarget('blocker', { x: 5, y: 0 }, square),
    ];

    expect(hasLineOfSight(from, to, obstacles)).toBe(false);
  });

  it('should return true when obstacle is beyond target', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 5, y: 0 };
    
    const square = createSquare(1);
    const obstacles: RaycastTarget[] = [
      createTarget('beyond', { x: 10, y: 0 }, square),
    ];

    expect(hasLineOfSight(from, to, obstacles)).toBe(true);
  });
});

describe('calculateVisibility', () => {
  it('should return 1 when fully visible', () => {
    const from = { x: 0, y: 0 };
    const square = createSquare(1);
    const target = createTarget('target', { x: 10, y: 0 }, square);
    const obstacles: RaycastTarget[] = [];

    const visibility = calculateVisibility(from, target, obstacles);

    expect(visibility).toBeCloseTo(1);
  });

  it('should return less than 1 when partially occluded', () => {
    const from = { x: 0, y: 0 };
    const square = createSquare(1);
    const target = createTarget('target', { x: 10, y: 0 }, square);
    const blocker = createTarget('blocker', { x: 5, y: 0.5 }, createSquare(0.3));
    const obstacles: RaycastTarget[] = [blocker];

    const visibility = calculateVisibility(from, target, obstacles);

    expect(visibility).toBeLessThan(1);
    expect(visibility).toBeGreaterThan(0);
  });

  it('should not count target as obstacle', () => {
    const from = { x: 0, y: 0 };
    const square = createSquare(1);
    const target = createTarget('target', { x: 10, y: 0 }, square);
    const obstacles: RaycastTarget[] = [target]; // Target is in obstacles list

    const visibility = calculateVisibility(from, target, obstacles);

    expect(visibility).toBeCloseTo(1);
  });
});

describe('getWorldVertices', () => {
  it('should transform vertices with translation', () => {
    const shape = createSquare(1);
    const position = { x: 10, y: 5 };
    
    const worldVerts = getWorldVertices(shape, position, 0, 1);

    // Check that vertices are offset by position
    expect(worldVerts[0]!.x).toBeCloseTo(9); // -1 + 10
    expect(worldVerts[0]!.y).toBeCloseTo(4); // -1 + 5
    expect(worldVerts[2]!.x).toBeCloseTo(11); // 1 + 10
    expect(worldVerts[2]!.y).toBeCloseTo(6); // 1 + 5
  });

  it('should transform vertices with rotation', () => {
    const shape = createSquare(1);
    const position = { x: 0, y: 0 };
    
    const worldVerts = getWorldVertices(shape, position, 90, 1);

    // 90 degree rotation: (x, y) -> (-y, x)
    // Vertex at (-1, -1) should become (1, -1) after 90° rotation
    expect(worldVerts[0]!.x).toBeCloseTo(1);
    expect(worldVerts[0]!.y).toBeCloseTo(-1);
  });

  it('should transform vertices with scale', () => {
    const shape = createSquare(1);
    const position = { x: 0, y: 0 };
    
    const worldVerts = getWorldVertices(shape, position, 0, 2);

    // Vertices should be scaled by 2
    expect(worldVerts[0]!.x).toBeCloseTo(-2);
    expect(worldVerts[0]!.y).toBeCloseTo(-2);
    expect(worldVerts[2]!.x).toBeCloseTo(2);
    expect(worldVerts[2]!.y).toBeCloseTo(2);
  });
});

describe('rayShapeIntersection', () => {
  it('should hit transformed shape', () => {
    const ray: Ray = {
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
    };
    
    const target = createTarget('obj', { x: 10, y: 0 }, createSquare(2));

    const result = rayShapeIntersection(ray, target);

    expect(result.hit).toBe(true);
    expect(result.objectId).toBe('obj');
    expect(result.distance).toBeCloseTo(8); // 10 - 2 (position - half-width)
  });

  it('should miss transformed shape when ray is off-target', () => {
    const ray: Ray = {
      origin: { x: 0, y: 10 },
      direction: { x: 1, y: 0 },
    };
    
    const target = createTarget('obj', { x: 10, y: 0 }, createSquare(2));

    const result = rayShapeIntersection(ray, target);

    expect(result.hit).toBe(false);
    expect(result.objectId).toBeNull();
  });
});
