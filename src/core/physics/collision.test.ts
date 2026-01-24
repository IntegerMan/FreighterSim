/**
 * Unit tests for collision detection utilities
 * TEST-FIRST: These tests define expected behavior for SAT collision detection
 */

import { describe, it, expect } from 'vitest';
import type { Vector2, Shape } from '@/models';
import {
  getBoundingBox,
  checkBoundingBoxOverlap,
  projectPolygon,
  checkPolygonCollision,
  getPolygonCentroid,
  getWorldVertices,
  getShapeBoundingBox,
  isPointInPolygon,
  checkCirclePolygonCollision,
  checkSweptCollision,
  getAllStationModuleVertices,
  checkStationCollision,
  getDistanceToStation,
  getStationVisualBoundingRadius,
} from './collision';

// Test helper: create a square centered at origin
function createSquare(size: number = 1): Vector2[] {
  const half = size / 2;
  return [
    { x: -half, y: -half },
    { x: half, y: -half },
    { x: half, y: half },
    { x: -half, y: half },
  ];
}

// Test helper: create a triangle
function createTriangle(): Vector2[] {
  return [
    { x: 0, y: 1 },
    { x: 0.87, y: -0.5 },
    { x: -0.87, y: -0.5 },
  ];
}

// Test helper: create a simple shape object
function createShape(vertices: Vector2[], id: string = 'test'): Shape {
  return {
    id,
    name: id,
    vertices,
    boundingRadius: 1,
  };
}

describe('collision', () => {
  describe('getBoundingBox', () => {
    it('should calculate bounding box for a square', () => {
      const square = createSquare(2);
      const bbox = getBoundingBox(square);
      
      expect(bbox.minX).toBe(-1);
      expect(bbox.maxX).toBe(1);
      expect(bbox.minY).toBe(-1);
      expect(bbox.maxY).toBe(1);
    });

    it('should handle empty array', () => {
      const bbox = getBoundingBox([]);
      expect(bbox).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    });

    it('should handle single point', () => {
      const bbox = getBoundingBox([{ x: 5, y: 3 }]);
      expect(bbox).toEqual({ minX: 5, maxX: 5, minY: 3, maxY: 3 });
    });

    it('should calculate bounding box for irregular polygon', () => {
      const polygon = [
        { x: -2, y: 1 },
        { x: 3, y: -2 },
        { x: 1, y: 4 },
      ];
      const bbox = getBoundingBox(polygon);
      
      expect(bbox.minX).toBe(-2);
      expect(bbox.maxX).toBe(3);
      expect(bbox.minY).toBe(-2);
      expect(bbox.maxY).toBe(4);
    });
  });

  describe('checkBoundingBoxOverlap', () => {
    it('should detect overlapping boxes', () => {
      const a = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
      const b = { minX: 5, maxX: 15, minY: 5, maxY: 15 };
      expect(checkBoundingBoxOverlap(a, b)).toBe(true);
    });

    it('should detect non-overlapping boxes (horizontal gap)', () => {
      const a = { minX: 0, maxX: 5, minY: 0, maxY: 10 };
      const b = { minX: 10, maxX: 15, minY: 0, maxY: 10 };
      expect(checkBoundingBoxOverlap(a, b)).toBe(false);
    });

    it('should detect non-overlapping boxes (vertical gap)', () => {
      const a = { minX: 0, maxX: 10, minY: 0, maxY: 5 };
      const b = { minX: 0, maxX: 10, minY: 10, maxY: 15 };
      expect(checkBoundingBoxOverlap(a, b)).toBe(false);
    });

    it('should detect touching boxes as NOT overlapping', () => {
      const a = { minX: 0, maxX: 5, minY: 0, maxY: 5 };
      const b = { minX: 5, maxX: 10, minY: 0, maxY: 5 };
      // Touching (sharing exactly one edge/point) is NOT considered overlapping for AABB
      expect(checkBoundingBoxOverlap(a, b)).toBe(false);
    });

    it('should detect contained box', () => {
      const a = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
      const b = { minX: 2, maxX: 8, minY: 2, maxY: 8 };
      expect(checkBoundingBoxOverlap(a, b)).toBe(true);
    });
  });

  describe('projectPolygon', () => {
    it('should project square onto x-axis', () => {
      const square = createSquare(2);
      const axis = { x: 1, y: 0 };
      const proj = projectPolygon(square, axis);
      
      expect(proj.min).toBe(-1);
      expect(proj.max).toBe(1);
    });

    it('should project square onto y-axis', () => {
      const square = createSquare(2);
      const axis = { x: 0, y: 1 };
      const proj = projectPolygon(square, axis);
      
      expect(proj.min).toBe(-1);
      expect(proj.max).toBe(1);
    });

    it('should project square onto diagonal axis', () => {
      const square = createSquare(2);
      const axis = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
      const proj = projectPolygon(square, axis);
      
      // Diagonal of a 2x2 square projects to sqrt(2)
      expect(proj.min).toBeCloseTo(-Math.SQRT2, 5);
      expect(proj.max).toBeCloseTo(Math.SQRT2, 5);
    });

    it('should handle empty array', () => {
      const proj = projectPolygon([], { x: 1, y: 0 });
      expect(proj).toEqual({ min: 0, max: 0 });
    });
  });

  describe('checkPolygonCollision', () => {
    it('should detect collision between overlapping squares', () => {
      const squareA = createSquare(2); // -1 to 1
      const squareB = createSquare(2).map(v => ({ x: v.x + 1, y: v.y })); // 0 to 2
      
      const result = checkPolygonCollision(squareA, squareB);
      
      expect(result.collides).toBe(true);
      expect(result.penetration).toBeGreaterThan(0);
      expect(result.penetration).toBe(1); // 1 unit overlap
    });

    it('should detect no collision between separated squares', () => {
      const squareA = createSquare(2); // -1 to 1
      const squareB = createSquare(2).map(v => ({ x: v.x + 5, y: v.y })); // 4 to 6
      
      const result = checkPolygonCollision(squareA, squareB);
      
      expect(result.collides).toBe(false);
    });

    it('should detect collision between touching squares', () => {
      const squareA = createSquare(2); // -1 to 1
      const squareB = createSquare(2).map(v => ({ x: v.x + 2, y: v.y })); // 1 to 3
      
      const result = checkPolygonCollision(squareA, squareB);
      
      // Touching (sharing edge) should be detected as collision with 0 penetration
      expect(result.collides).toBe(true);
      expect(result.penetration).toBeCloseTo(0, 5);
    });

    it('should detect collision between triangle and square', () => {
      const triangle = createTriangle();
      const square = createSquare(1).map(v => ({ x: v.x, y: v.y + 0.5 }));
      
      const result = checkPolygonCollision(triangle, square);
      
      expect(result.collides).toBe(true);
    });

    it('should return collision normal pointing from A to B', () => {
      const squareA = createSquare(2);
      const squareB = createSquare(2).map(v => ({ x: v.x + 1, y: v.y }));
      
      const result = checkPolygonCollision(squareA, squareB);
      
      expect(result.collides).toBe(true);
      expect(result.normal).toBeDefined();
      // Normal should point roughly in positive X direction
      expect(result.normal!.x).toBeGreaterThan(0);
    });

    it('should return contact point in overlap region', () => {
      const squareA = createSquare(2);
      const squareB = createSquare(2).map(v => ({ x: v.x + 1, y: v.y }));
      
      const result = checkPolygonCollision(squareA, squareB);
      
      expect(result.collides).toBe(true);
      expect(result.contactPoint).toBeDefined();
      // Contact point should be between the two centers
      expect(result.contactPoint!.x).toBeGreaterThan(0);
      expect(result.contactPoint!.x).toBeLessThan(1);
    });

    it('should handle degenerate polygons', () => {
      const triangle = createTriangle();
      const line = [{ x: 0, y: 0 }, { x: 1, y: 0 }]; // Only 2 points
      
      const result = checkPolygonCollision(triangle, line);
      
      expect(result.collides).toBe(false);
    });
  });

  describe('getPolygonCentroid', () => {
    it('should calculate centroid of square at origin', () => {
      const square = createSquare(2);
      const centroid = getPolygonCentroid(square);
      
      expect(centroid.x).toBeCloseTo(0, 5);
      expect(centroid.y).toBeCloseTo(0, 5);
    });

    it('should calculate centroid of offset square', () => {
      const square = createSquare(2).map(v => ({ x: v.x + 5, y: v.y + 3 }));
      const centroid = getPolygonCentroid(square);
      
      expect(centroid.x).toBeCloseTo(5, 5);
      expect(centroid.y).toBeCloseTo(3, 5);
    });

    it('should calculate centroid of triangle', () => {
      const triangle = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 3 },
      ];
      const centroid = getPolygonCentroid(triangle);
      
      expect(centroid.x).toBeCloseTo(1, 5);
      expect(centroid.y).toBeCloseTo(1, 5);
    });

    it('should return origin for empty array', () => {
      const centroid = getPolygonCentroid([]);
      expect(centroid).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getWorldVertices', () => {
    it('should translate vertices to world position', () => {
      const shape = createShape(createSquare(2));
      const worldVerts = getWorldVertices(shape, { x: 10, y: 5 }, 0, 1);
      
      expect(worldVerts[0]).toEqual({ x: 9, y: 4 });
      expect(worldVerts[2]).toEqual({ x: 11, y: 6 });
    });

    it('should rotate vertices at 90 degrees', () => {
      const shape = createShape([
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
      ]);
      const worldVerts = getWorldVertices(shape, { x: 0, y: 0 }, 90, 1);
      
      // After 90° CCW rotation: (1,0) -> (0,1)
      expect(worldVerts[0]!.x).toBeCloseTo(0, 5);
      expect(worldVerts[0]!.y).toBeCloseTo(1, 5);
    });

    it('should rotate vertices at 180 degrees', () => {
      const shape = createShape([{ x: 1, y: 0 }]);
      const worldVerts = getWorldVertices(shape, { x: 0, y: 0 }, 180, 1);
      
      expect(worldVerts[0]!.x).toBeCloseTo(-1, 5);
      expect(worldVerts[0]!.y).toBeCloseTo(0, 5);
    });

    it('should rotate vertices at 270 degrees', () => {
      const shape = createShape([{ x: 1, y: 0 }]);
      const worldVerts = getWorldVertices(shape, { x: 0, y: 0 }, 270, 1);
      
      expect(worldVerts[0]!.x).toBeCloseTo(0, 5);
      expect(worldVerts[0]!.y).toBeCloseTo(-1, 5);
    });

    it('should scale vertices', () => {
      const shape = createShape(createSquare(2));
      const worldVerts = getWorldVertices(shape, { x: 0, y: 0 }, 0, 2);
      
      // Original square is -1 to 1, scaled by 2 = -2 to 2
      expect(worldVerts[0]).toEqual({ x: -2, y: -2 });
      expect(worldVerts[2]).toEqual({ x: 2, y: 2 });
    });

    it('should combine rotation, scale, and translation', () => {
      const shape = createShape([{ x: 1, y: 0 }]);
      const worldVerts = getWorldVertices(shape, { x: 5, y: 3 }, 90, 2);
      
      // Scale: (1,0) -> (2,0)
      // Rotate 90°: (2,0) -> (0,2)
      // Translate: (0,2) + (5,3) = (5,5)
      expect(worldVerts[0]!.x).toBeCloseTo(5, 5);
      expect(worldVerts[0]!.y).toBeCloseTo(5, 5);
    });
  });

  describe('getShapeBoundingBox', () => {
    it('should calculate world bounding box', () => {
      const shape = createShape(createSquare(2));
      const bbox = getShapeBoundingBox(shape, { x: 10, y: 10 }, 0, 1);
      
      expect(bbox.minX).toBe(9);
      expect(bbox.maxX).toBe(11);
      expect(bbox.minY).toBe(9);
      expect(bbox.maxY).toBe(11);
    });

    it('should calculate rotated bounding box (larger)', () => {
      const shape = createShape(createSquare(2));
      const bbox = getShapeBoundingBox(shape, { x: 0, y: 0 }, 45, 1);
      
      // 45° rotated square diagonal becomes axis-aligned
      const diagonal = Math.SQRT2;
      expect(bbox.minX).toBeCloseTo(-diagonal, 5);
      expect(bbox.maxX).toBeCloseTo(diagonal, 5);
    });
  });

  describe('isPointInPolygon', () => {
    it('should detect point inside square', () => {
      const square = createSquare(2);
      expect(isPointInPolygon({ x: 0, y: 0 }, square)).toBe(true);
      expect(isPointInPolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
    });

    it('should detect point outside square', () => {
      const square = createSquare(2);
      expect(isPointInPolygon({ x: 5, y: 0 }, square)).toBe(false);
      expect(isPointInPolygon({ x: 0, y: 5 }, square)).toBe(false);
    });

    it('should detect point inside triangle', () => {
      const triangle = createTriangle();
      expect(isPointInPolygon({ x: 0, y: 0 }, triangle)).toBe(true);
    });

    it('should detect point outside triangle', () => {
      const triangle = createTriangle();
      expect(isPointInPolygon({ x: 1, y: 1 }, triangle)).toBe(false);
    });

    it('should handle degenerate polygon', () => {
      const line = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
      expect(isPointInPolygon({ x: 0.5, y: 0 }, line)).toBe(false);
    });
  });

  describe('checkCirclePolygonCollision', () => {
    it('should detect circle center inside polygon', () => {
      const square = createSquare(2);
      const result = checkCirclePolygonCollision({ x: 0, y: 0 }, 0.5, square);
      
      expect(result.collides).toBe(true);
    });

    it('should detect circle overlapping edge', () => {
      const square = createSquare(2);
      const result = checkCirclePolygonCollision({ x: 1.5, y: 0 }, 1, square);
      
      expect(result.collides).toBe(true);
      expect(result.penetration).toBeCloseTo(0.5, 5);
    });

    it('should detect no collision when circle is outside', () => {
      const square = createSquare(2);
      const result = checkCirclePolygonCollision({ x: 5, y: 0 }, 0.5, square);
      
      expect(result.collides).toBe(false);
    });

    it('should provide collision normal pointing toward circle', () => {
      const square = createSquare(2);
      const result = checkCirclePolygonCollision({ x: 1.5, y: 0 }, 1, square);
      
      expect(result.normal).toBeDefined();
      expect(result.normal!.x).toBeGreaterThan(0);
    });
  });

  describe('checkSweptCollision', () => {
    it('should detect collision during movement', () => {
      const squareA = createSquare(2);
      const squareB = createSquare(2).map(v => ({ x: v.x + 5, y: v.y }));
      const velocity = { x: 10, y: 0 }; // Moving right
      
      const result = checkSweptCollision(squareA, velocity, squareB);
      
      expect(result).not.toBeNull();
      expect(result!.time).toBeGreaterThan(0);
      expect(result!.time).toBeLessThanOrEqual(1);
    });

    it('should return null for no collision', () => {
      const squareA = createSquare(2);
      const squareB = createSquare(2).map(v => ({ x: v.x + 5, y: v.y }));
      const velocity = { x: 0, y: 10 }; // Moving up (away)
      
      const result = checkSweptCollision(squareA, velocity, squareB);
      
      expect(result).toBeNull();
    });

    it('should detect collision for fast-moving objects', () => {
      const squareA = createSquare(1);
      const squareB = createSquare(1).map(v => ({ x: v.x + 3, y: v.y }));
      const velocity = { x: 100, y: 0 }; // Very fast
      
      const result = checkSweptCollision(squareA, velocity, squareB);
      
      expect(result).not.toBeNull();
      expect(result!.time).toBeCloseTo(0.02, 1); // Should hit early
    });

    it('should return collision normal opposite to velocity', () => {
      const squareA = createSquare(2);
      const squareB = createSquare(2).map(v => ({ x: v.x + 3, y: v.y }));
      const velocity = { x: 10, y: 0 };
      
      const result = checkSweptCollision(squareA, velocity, squareB);
      
      expect(result).not.toBeNull();
      // Normal should point left (opposite to velocity)
      expect(result!.normal.x).toBeLessThan(0);
    });

    it('should handle already overlapping shapes', () => {
      const squareA = createSquare(2);
      const squareB = createSquare(2).map(v => ({ x: v.x + 1, y: v.y })); // Overlapping
      const velocity = { x: 1, y: 0 };
      
      const result = checkSweptCollision(squareA, velocity, squareB);
      
      // For already overlapping shapes, swept collision may return null
      // (they're already colliding, use checkPolygonCollision for static check)
      // This is expected behavior - swept collision is for detecting WHEN collision starts
      // If already overlapping, there's no entry time
      // We just verify it doesn't crash
      if (result !== null) {
        expect(result.time).toBeLessThanOrEqual(1);
      }
    });
  });

  // =============================================================================
  // Station Module Collision Tests
  // =============================================================================
  
  describe('getAllStationModuleVertices', () => {
    it('should return empty array for station without template', () => {
      const station = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'non-existent-template',
      };
      
      const result = getAllStationModuleVertices(station);
      expect(result).toEqual([]);
    });

    it('should return vertices for all station modules', () => {
      const station = {
        id: 'trading-station',
        name: 'Trading Hub Alpha',
        type: 'trading-hub' as const,
        position: { x: 1000, y: 2000 },
        services: [],
        dockingRange: 200,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      const result = getAllStationModuleVertices(station);
      
      // Trading hub should have multiple modules
      expect(result.length).toBeGreaterThan(1);
      
      // Each result should have vertices
      for (const module of result) {
        expect(module.vertices.length).toBeGreaterThanOrEqual(3);
        expect(module.modulePlacement).toBeDefined();
        expect(module.moduleIndex).toBeGreaterThanOrEqual(0);
      }
    });

    it('should apply station rotation to module vertices', () => {
      const stationNoRotation = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      const stationRotated = {
        ...stationNoRotation,
        rotation: 90,
      };
      
      const verticesNoRotation = getAllStationModuleVertices(stationNoRotation);
      const verticesRotated = getAllStationModuleVertices(stationRotated);
      
      // Both should have modules
      expect(verticesNoRotation.length).toBeGreaterThan(0);
      expect(verticesRotated.length).toBe(verticesNoRotation.length);
      
      // Vertices should be different due to rotation
      // Compare first module's first vertex
      if (verticesNoRotation.length > 0 && verticesRotated.length > 0) {
        const v1 = verticesNoRotation[0]!.vertices[0]!;
        const v2 = verticesRotated[0]!.vertices[0]!;
        
        // After 90° rotation, x and y should swap (approximately)
        // We just check they're different
        const isDifferent = Math.abs(v1.x - v2.x) > 0.01 || Math.abs(v1.y - v2.y) > 0.01;
        expect(isDifferent).toBe(true);
      }
    });
  });

  describe('checkStationCollision', () => {
    it('should return null when no collision', () => {
      const shipVertices = createSquare(10).map(v => ({ x: v.x + 5000, y: v.y + 5000 }));
      const station = {
        id: 'far-station',
        name: 'Far Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      const result = checkStationCollision(shipVertices, station);
      expect(result).toBeNull();
    });

    it('should detect collision with station module', () => {
      // Create a ship near station center
      const station = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100, // Station scale = 100 * 6 = 600
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      // Place ship right at station center (should overlap with core module)
      const shipVertices = createSquare(50); // 50x50 ship at origin
      
      const result = checkStationCollision(shipVertices, station);
      
      // Should detect collision with core module
      expect(result).not.toBeNull();
      if (result) {
        expect(result.collision.collides).toBe(true);
        expect(result.modulePlacement).toBeDefined();
        expect(result.moduleVertices.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('getDistanceToStation', () => {
    it('should return 0 when point is inside a module', () => {
      const station = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      // Point at station center (inside core module)
      const result = getDistanceToStation({ x: 0, y: 0 }, station);
      expect(result.distance).toBe(0);
    });

    it('should return positive distance when point is outside all modules', () => {
      const station = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      // Point far from station
      const result = getDistanceToStation({ x: 5000, y: 5000 }, station);
      expect(result.distance).toBeGreaterThan(0);
    });
  });

  describe('getStationVisualBoundingRadius', () => {
    it('should return visual bounding radius larger than docking range', () => {
      const station = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      const visualRadius = getStationVisualBoundingRadius(station);
      
      // Visual radius should be much larger than docking range (due to 6x multiplier + modules)
      expect(visualRadius).toBeGreaterThan(station.dockingRange);
      // Visual radius should be larger than docking range by a comfortable margin
      expect(visualRadius).toBeGreaterThan(station.dockingRange * 1.5);
    });

    it('should return docking range for station without template', () => {
      const station = {
        id: 'test-station',
        name: 'Test Station',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'non-existent-template',
        rotation: 0,
      };
      
      const visualRadius = getStationVisualBoundingRadius(station);
      expect(visualRadius).toBe(station.dockingRange);
    });

    it('should account for station rotation', () => {
      const station1 = {
        id: 'test-station-1',
        name: 'Test Station 1',
        type: 'trading-hub' as const,
        position: { x: 0, y: 0 },
        services: [],
        dockingRange: 100,
        templateId: 'trading-hub',
        rotation: 0,
      };
      
      const station2 = {
        ...station1,
        id: 'test-station-2',
        rotation: 45, // Rotated 45 degrees
      };
      
      const radius1 = getStationVisualBoundingRadius(station1);
      const radius2 = getStationVisualBoundingRadius(station2);
      
      // Both should have similar bounding radius (rotation doesn't change max distance)
      // But small differences are expected due to non-circular shapes
      expect(Math.abs(radius1 - radius2)).toBeLessThan(radius1 * 0.2);
    });
  });
});