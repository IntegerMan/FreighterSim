/**
 * Unit tests for vectorMath utilities
 * TEST-FIRST: These tests define expected behavior before implementation
 */

import { describe, it, expect } from 'vitest';
import {
  vec2Sub,
  vec2Normalize,
  vec2Dot,
  vec2Cross,
  vec2Perpendicular,
  rotatePoint,
  rotatePointAround,
  vec2Length,
  vec2LengthSquared,
  vec2Distance,
  vec2Scale,
  vec2Add,
  vec2Lerp,
  vec2ApproxEqual,
  vec2Negate,
  vec2Project,
  vec2Reflect,
} from './vectorMath';

describe('vectorMath', () => {
  describe('vec2Sub', () => {
    it('should subtract two vectors', () => {
      const result = vec2Sub({ x: 5, y: 10 }, { x: 2, y: 3 });
      expect(result).toEqual({ x: 3, y: 7 });
    });

    it('should handle negative results', () => {
      const result = vec2Sub({ x: 1, y: 1 }, { x: 3, y: 5 });
      expect(result).toEqual({ x: -2, y: -4 });
    });
  });

  describe('vec2Normalize', () => {
    it('should normalize a unit vector to itself', () => {
      const result = vec2Normalize({ x: 1, y: 0 });
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should normalize a vector to unit length', () => {
      const result = vec2Normalize({ x: 3, y: 4 });
      expect(result.x).toBeCloseTo(0.6, 5);
      expect(result.y).toBeCloseTo(0.8, 5);
    });

    it('should return zero vector for zero input', () => {
      const result = vec2Normalize({ x: 0, y: 0 });
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('vec2Dot', () => {
    it('should return 0 for perpendicular vectors', () => {
      const result = vec2Dot({ x: 1, y: 0 }, { x: 0, y: 1 });
      expect(result).toBe(0);
    });

    it('should return positive for same direction vectors', () => {
      const result = vec2Dot({ x: 1, y: 0 }, { x: 1, y: 0 });
      expect(result).toBe(1);
    });

    it('should return negative for opposite direction vectors', () => {
      const result = vec2Dot({ x: 1, y: 0 }, { x: -1, y: 0 });
      expect(result).toBe(-1);
    });

    it('should calculate dot product correctly', () => {
      const result = vec2Dot({ x: 2, y: 3 }, { x: 4, y: 5 });
      expect(result).toBe(23); // 2*4 + 3*5
    });
  });

  describe('vec2Cross', () => {
    it('should return 0 for parallel vectors', () => {
      const result = vec2Cross({ x: 2, y: 0 }, { x: 4, y: 0 });
      expect(result).toBe(0);
    });

    it('should return positive for counter-clockwise orientation', () => {
      const result = vec2Cross({ x: 1, y: 0 }, { x: 0, y: 1 });
      expect(result).toBe(1);
    });

    it('should return negative for clockwise orientation', () => {
      const result = vec2Cross({ x: 0, y: 1 }, { x: 1, y: 0 });
      expect(result).toBe(-1);
    });
  });

  describe('vec2Perpendicular', () => {
    it('should rotate 90 degrees counter-clockwise', () => {
      const result = vec2Perpendicular({ x: 1, y: 0 });
      expect(result.x).toBe(-0); // Perpendicular of (1,0) is (-0, 1) due to formula: (-y, x)
      expect(result.y).toBe(1);
    });

    it('should work for any vector', () => {
      const result = vec2Perpendicular({ x: 3, y: 4 });
      expect(result).toEqual({ x: -4, y: 3 });
    });
  });

  describe('rotatePoint', () => {
    it('should not change point at 0 degrees', () => {
      const result = rotatePoint({ x: 1, y: 0 }, 0);
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should rotate 90 degrees counter-clockwise', () => {
      const result = rotatePoint({ x: 1, y: 0 }, 90);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });

    it('should rotate 180 degrees', () => {
      const result = rotatePoint({ x: 1, y: 0 }, 180);
      expect(result.x).toBeCloseTo(-1, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should rotate 270 degrees', () => {
      const result = rotatePoint({ x: 1, y: 0 }, 270);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-1, 5);
    });

    it('should rotate -90 degrees (clockwise)', () => {
      const result = rotatePoint({ x: 1, y: 0 }, -90);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-1, 5);
    });

    it('should rotate 45 degrees correctly', () => {
      const result = rotatePoint({ x: 1, y: 0 }, 45);
      const expected = Math.SQRT1_2; // 1/√2 ≈ 0.707
      expect(result.x).toBeCloseTo(expected, 5);
      expect(result.y).toBeCloseTo(expected, 5);
    });

    it('should preserve vector length', () => {
      const original = { x: 3, y: 4 };
      const result = rotatePoint(original, 73);
      const originalLength = Math.sqrt(original.x ** 2 + original.y ** 2);
      const resultLength = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(resultLength).toBeCloseTo(originalLength, 5);
    });
  });

  describe('rotatePointAround', () => {
    it('should rotate around origin same as rotatePoint', () => {
      const point = { x: 1, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAround(point, center, 90);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });

    it('should rotate around a custom center', () => {
      const point = { x: 2, y: 0 };
      const center = { x: 1, y: 0 };
      const result = rotatePointAround(point, center, 90);
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });

    it('should not move point at center', () => {
      const point = { x: 5, y: 5 };
      const center = { x: 5, y: 5 };
      const result = rotatePointAround(point, center, 90);
      expect(result.x).toBeCloseTo(5, 5);
      expect(result.y).toBeCloseTo(5, 5);
    });
  });

  describe('vec2Length', () => {
    it('should return correct length for unit vector', () => {
      expect(vec2Length({ x: 1, y: 0 })).toBe(1);
    });

    it('should return correct length for 3-4-5 triangle', () => {
      expect(vec2Length({ x: 3, y: 4 })).toBe(5);
    });

    it('should return 0 for zero vector', () => {
      expect(vec2Length({ x: 0, y: 0 })).toBe(0);
    });
  });

  describe('vec2LengthSquared', () => {
    it('should return squared length', () => {
      expect(vec2LengthSquared({ x: 3, y: 4 })).toBe(25);
    });
  });

  describe('vec2Distance', () => {
    it('should calculate distance between two points', () => {
      const result = vec2Distance({ x: 0, y: 0 }, { x: 3, y: 4 });
      expect(result).toBe(5);
    });
  });

  describe('vec2Scale', () => {
    it('should scale vector by scalar', () => {
      const result = vec2Scale({ x: 2, y: 3 }, 4);
      expect(result).toEqual({ x: 8, y: 12 });
    });

    it('should negate vector with -1 scalar', () => {
      const result = vec2Scale({ x: 2, y: 3 }, -1);
      expect(result).toEqual({ x: -2, y: -3 });
    });
  });

  describe('vec2Add', () => {
    it('should add two vectors', () => {
      const result = vec2Add({ x: 1, y: 2 }, { x: 3, y: 4 });
      expect(result).toEqual({ x: 4, y: 6 });
    });
  });

  describe('vec2Lerp', () => {
    it('should return start at t=0', () => {
      const result = vec2Lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should return end at t=1', () => {
      const result = vec2Lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 1);
      expect(result).toEqual({ x: 10, y: 10 });
    });

    it('should return midpoint at t=0.5', () => {
      const result = vec2Lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5);
      expect(result).toEqual({ x: 5, y: 5 });
    });
  });

  describe('vec2ApproxEqual', () => {
    it('should return true for equal vectors', () => {
      expect(vec2ApproxEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    });

    it('should return true for approximately equal vectors', () => {
      expect(vec2ApproxEqual({ x: 1, y: 2 }, { x: 1.00001, y: 2.00001 }, 0.0001)).toBe(true);
    });

    it('should return false for different vectors', () => {
      expect(vec2ApproxEqual({ x: 1, y: 2 }, { x: 2, y: 3 })).toBe(false);
    });
  });

  describe('vec2Negate', () => {
    it('should negate a vector', () => {
      const result = vec2Negate({ x: 3, y: -4 });
      expect(result).toEqual({ x: -3, y: 4 });
    });
  });

  describe('vec2Project', () => {
    it('should project vector onto axis', () => {
      // Project (3, 4) onto x-axis (1, 0)
      const result = vec2Project({ x: 3, y: 4 }, { x: 1, y: 0 });
      expect(result).toEqual({ x: 3, y: 0 });
    });

    it('should return zero for perpendicular vectors', () => {
      const result = vec2Project({ x: 0, y: 5 }, { x: 1, y: 0 });
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should return zero for zero projection axis', () => {
      const result = vec2Project({ x: 3, y: 4 }, { x: 0, y: 0 });
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('vec2Reflect', () => {
    it('should reflect vector across horizontal normal', () => {
      const result = vec2Reflect({ x: 1, y: -1 }, { x: 0, y: 1 });
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });

    it('should reflect vector across vertical normal', () => {
      const result = vec2Reflect({ x: -1, y: 1 }, { x: 1, y: 0 });
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });
  });
});
