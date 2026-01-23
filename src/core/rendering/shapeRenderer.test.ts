/**
 * Unit tests for shape rendering utilities
 * TEST-FIRST: These tests define expected coordinate transformation behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Shape, EngineMount } from '@/models';
import {
  transformVertex,
  transformVertices,
  worldToScreen,
  screenToWorld,
  getShapeScreenSize,
  shouldRenderAsPoint,
  getEngineMountWorldPosition,
  getEngineMountWorldDirection,
  createVertexCacheKey,
  VertexCache,
} from './shapeRenderer';

// Test helper: create a simple square shape
function createSquareShape(): Shape {
  return {
    id: 'test-square',
    name: 'Test Square',
    vertices: [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ],
    boundingRadius: Math.SQRT2,
  };
}

// Test helper: create an engine mount
function createEngineMount(name: string, x: number, y: number): EngineMount {
  return {
    name,
    position: { x, y },
    direction: { x: 0, y: -1 }, // Pointing backward
  };
}

describe('shapeRenderer', () => {
  describe('transformVertex', () => {
    it('should not change vertex at 0 degrees with scale 1 at origin', () => {
      const vertex = { x: 1, y: 0 };
      const result = transformVertex(vertex, { x: 0, y: 0 }, 0, 1);
      
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should translate vertex to position', () => {
      const vertex = { x: 0, y: 0 };
      const result = transformVertex(vertex, { x: 10, y: 5 }, 0, 1);
      
      expect(result).toEqual({ x: 10, y: 5 });
    });

    it('should scale vertex', () => {
      const vertex = { x: 1, y: 1 };
      const result = transformVertex(vertex, { x: 0, y: 0 }, 0, 2);
      
      expect(result).toEqual({ x: 2, y: 2 });
    });

    it('should rotate vertex 90 degrees', () => {
      const vertex = { x: 1, y: 0 };
      const result = transformVertex(vertex, { x: 0, y: 0 }, 90, 1);
      
      // Navigation convention: 90° is clockwise from north
      // (1, 0) rotated 90° CW = (0, -1)
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-1, 5);
    });

    it('should rotate vertex 180 degrees', () => {
      const vertex = { x: 1, y: 0 };
      const result = transformVertex(vertex, { x: 0, y: 0 }, 180, 1);
      
      expect(result.x).toBeCloseTo(-1, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should rotate vertex 270 degrees', () => {
      const vertex = { x: 1, y: 0 };
      const result = transformVertex(vertex, { x: 0, y: 0 }, 270, 1);
      
      // Navigation convention: 270° is clockwise from north
      // (1, 0) rotated 270° CW = (0, 1)
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });

    it('should combine scale, rotation, and translation', () => {
      const vertex = { x: 1, y: 0 };
      // Scale by 2: (2, 0)
      // Rotate 90° CW (navigation): (0, -2)
      // Translate by (5, 3): (5, 1)
      const result = transformVertex(vertex, { x: 5, y: 3 }, 90, 2);
      
      expect(result.x).toBeCloseTo(5, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });
  });

  describe('transformVertices', () => {
    it('should transform all vertices', () => {
      const vertices = [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      const result = transformVertices(vertices, { x: 10, y: 10 }, 0, 1);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ x: 9, y: 10 });
      expect(result[1]).toEqual({ x: 11, y: 10 });
      expect(result[2]).toEqual({ x: 10, y: 11 });
    });

    it('should handle empty array', () => {
      const result = transformVertices([], { x: 0, y: 0 }, 0, 1);
      expect(result).toEqual([]);
    });
  });

  describe('worldToScreen', () => {
    const camera = { x: 0, y: 0 };
    const screenCenter = { x: 400, y: 300 };
    const zoom = 1;

    it('should map world origin to screen center', () => {
      const result = worldToScreen({ x: 0, y: 0 }, camera, screenCenter, zoom);
      expect(result).toEqual({ x: 400, y: 300 });
    });

    it('should map positive X to right on screen', () => {
      const result = worldToScreen({ x: 100, y: 0 }, camera, screenCenter, zoom);
      expect(result.x).toBe(500);
    });

    it('should map positive Y to up on screen (inverted)', () => {
      const result = worldToScreen({ x: 0, y: 100 }, camera, screenCenter, zoom);
      expect(result.y).toBe(200); // Y is inverted
    });

    it('should apply zoom correctly', () => {
      const result = worldToScreen({ x: 10, y: 0 }, camera, screenCenter, 2);
      expect(result.x).toBe(420); // 400 + 10 * 2
    });

    it('should follow camera position', () => {
      const movedCamera = { x: 50, y: 0 };
      const result = worldToScreen({ x: 50, y: 0 }, movedCamera, screenCenter, zoom);
      expect(result.x).toBe(400); // Camera at same position as point = center
    });
  });

  describe('screenToWorld', () => {
    const camera = { x: 0, y: 0 };
    const screenCenter = { x: 400, y: 300 };
    const zoom = 1;

    it('should be inverse of worldToScreen', () => {
      const worldPoint = { x: 50, y: 75 };
      const screenPoint = worldToScreen(worldPoint, camera, screenCenter, zoom);
      const backToWorld = screenToWorld(screenPoint, camera, screenCenter, zoom);
      
      expect(backToWorld.x).toBeCloseTo(worldPoint.x, 5);
      expect(backToWorld.y).toBeCloseTo(worldPoint.y, 5);
    });

    it('should map screen center to camera position', () => {
      const result = screenToWorld(screenCenter, camera, screenCenter, zoom);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getShapeScreenSize', () => {
    it('should calculate screen size from bounding radius', () => {
      const shape = createSquareShape();
      // boundingRadius = sqrt(2), scale = 1, zoom = 1
      const result = getShapeScreenSize(shape, 1, 1);
      expect(result).toBeCloseTo(Math.SQRT2 * 2, 5);
    });

    it('should scale with zoom', () => {
      const shape = createSquareShape();
      const size1 = getShapeScreenSize(shape, 1, 1);
      const size2 = getShapeScreenSize(shape, 1, 2);
      
      expect(size2).toBeCloseTo(size1 * 2, 5);
    });

    it('should scale with shape scale', () => {
      const shape = createSquareShape();
      const size1 = getShapeScreenSize(shape, 1, 1);
      const size2 = getShapeScreenSize(shape, 2, 1);
      
      expect(size2).toBeCloseTo(size1 * 2, 5);
    });
  });

  describe('shouldRenderAsPoint', () => {
    it('should return true for small shapes', () => {
      const shape = createSquareShape();
      // With scale 0.1 and zoom 1, size = sqrt(2) * 0.1 * 1 * 2 ≈ 0.28
      expect(shouldRenderAsPoint(shape, 0.1, 1, 4)).toBe(true);
    });

    it('should return false for large shapes', () => {
      const shape = createSquareShape();
      // With scale 10 and zoom 1, size = sqrt(2) * 10 * 1 * 2 ≈ 28
      expect(shouldRenderAsPoint(shape, 10, 1, 4)).toBe(false);
    });

    it('should respect custom minSize threshold', () => {
      const shape = createSquareShape();
      const scale = 2;
      const zoom = 1;
      const size = getShapeScreenSize(shape, scale, zoom);
      
      // Just above threshold
      expect(shouldRenderAsPoint(shape, scale, zoom, size - 1)).toBe(false);
      // Just below threshold
      expect(shouldRenderAsPoint(shape, scale, zoom, size + 1)).toBe(true);
    });
  });

  describe('getEngineMountWorldPosition', () => {
    it('should transform engine mount to world position', () => {
      const mount = createEngineMount('main', 0, -0.9);
      const result = getEngineMountWorldPosition(
        mount,
        { x: 100, y: 50 },
        0,
        40
      );
      
      // Scale: (0, -0.9) * 40 = (0, -36)
      // Translate: (0, -36) + (100, 50) = (100, 14)
      expect(result.x).toBeCloseTo(100, 5);
      expect(result.y).toBeCloseTo(14, 5);
    });

    it('should rotate engine mount position with ship', () => {
      const mount = createEngineMount('main', 0, -1);
      const result = getEngineMountWorldPosition(
        mount,
        { x: 0, y: 0 },
        90,
        10
      );
      
      // Scale: (0, -1) * 10 = (0, -10)
      // Rotate 90° CW (navigation): (0, -10) -> (-10, 0)
      expect(result.x).toBeCloseTo(-10, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });
  });

  describe('getEngineMountWorldDirection', () => {
    it('should rotate direction with ship rotation', () => {
      const mount = createEngineMount('main', 0, -1);
      // Default direction is (0, -1) pointing backward
      
      const result = getEngineMountWorldDirection(mount, 90);
      
      // (0, -1) rotated 90° CW (navigation) = (-1, 0)
      expect(result.x).toBeCloseTo(-1, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should not change direction at 0 degrees', () => {
      const mount = createEngineMount('main', 0, -1);
      const result = getEngineMountWorldDirection(mount, 0);
      
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-1, 5);
    });
  });

  describe('createVertexCacheKey', () => {
    it('should create unique keys for different parameters', () => {
      const key1 = createVertexCacheKey('ship', { x: 100, y: 200 }, 45, 10);
      const key2 = createVertexCacheKey('ship', { x: 100, y: 200 }, 90, 10);
      const key3 = createVertexCacheKey('ship', { x: 101, y: 200 }, 45, 10);
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should create same key for same parameters', () => {
      const key1 = createVertexCacheKey('ship', { x: 100, y: 200 }, 45, 10);
      const key2 = createVertexCacheKey('ship', { x: 100, y: 200 }, 45, 10);
      
      expect(key1).toBe(key2);
    });
  });

  describe('VertexCache', () => {
    let cache: VertexCache;

    beforeEach(() => {
      cache = new VertexCache();
    });

    it('should compute and cache vertices', () => {
      const compute = vi.fn(() => [{ x: 1, y: 2 }]);
      const key = 'test-key';
      
      const result1 = cache.getOrCompute(key, compute);
      const result2 = cache.getOrCompute(key, compute);
      
      expect(compute).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('should clear cache', () => {
      const compute = vi.fn(() => [{ x: 1, y: 2 }]);
      const key = 'test-key';
      
      cache.getOrCompute(key, compute);
      cache.clear();
      cache.getOrCompute(key, compute);
      
      expect(compute).toHaveBeenCalledTimes(2);
    });

    it('should track cache size', () => {
      expect(cache.size).toBe(0);
      
      cache.getOrCompute('key1', () => []);
      expect(cache.size).toBe(1);
      
      cache.getOrCompute('key2', () => []);
      expect(cache.size).toBe(2);
      
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });
});
