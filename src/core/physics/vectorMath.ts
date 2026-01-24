/**
 * Vector Math Utilities for Shape System
 * 
 * Additional vector operations needed for shape transformation,
 * collision detection, and raycasting.
 * 
 * @module core/physics/vectorMath
 */

import type { Vector2 } from '@/models';
import { degreesToRadians } from '@/models';

/**
 * Subtract vector b from vector a
 */
export function vec2Sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Normalize a vector to unit length
 * Returns zero vector if input is zero
 */
export function vec2Normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Calculate dot product of two vectors
 */
export function vec2Dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Calculate cross product of two 2D vectors (returns scalar z-component)
 */
export function vec2Cross(a: Vector2, b: Vector2): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * Get the perpendicular vector (rotated 90 degrees counter-clockwise)
 */
export function vec2Perpendicular(v: Vector2): Vector2 {
  return { x: -v.y, y: v.x };
}

/**
 * Rotate a point around the origin by a given angle in degrees
 * Uses standard mathematical convention: positive angle = counter-clockwise
 */
export function rotatePoint(point: Vector2, angleDegrees: number): Vector2 {
  const radians = degreesToRadians(angleDegrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

/**
 * Rotate a point around a specified center by a given angle in degrees
 */
export function rotatePointAround(point: Vector2, center: Vector2, angleDegrees: number): Vector2 {
  // Translate to origin
  const translated = vec2Sub(point, center);
  // Rotate
  const rotated = rotatePoint(translated, angleDegrees);
  // Translate back
  return {
    x: rotated.x + center.x,
    y: rotated.y + center.y,
  };
}

/**
 * Get the length (magnitude) of a vector
 */
export function vec2Length(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Get the squared length of a vector (faster than length for comparisons)
 */
export function vec2LengthSquared(v: Vector2): number {
  return v.x * v.x + v.y * v.y;
}

/**
 * Get the distance between two points
 */
export function vec2Distance(a: Vector2, b: Vector2): number {
  return vec2Length(vec2Sub(b, a));
}

/**
 * Multiply vector by scalar
 */
export function vec2Scale(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Add two vectors
 */
export function vec2Add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Linearly interpolate between two vectors
 */
export function vec2Lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Check if two vectors are approximately equal within a tolerance
 */
export function vec2ApproxEqual(a: Vector2, b: Vector2, epsilon: number = 0.0001): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

/**
 * Negate a vector
 */
export function vec2Negate(v: Vector2): Vector2 {
  return { x: -v.x, y: -v.y };
}

/**
 * Project vector a onto vector b
 */
export function vec2Project(a: Vector2, b: Vector2): Vector2 {
  const bLenSq = vec2LengthSquared(b);
  if (bLenSq === 0) return { x: 0, y: 0 };
  const scalar = vec2Dot(a, b) / bLenSq;
  return vec2Scale(b, scalar);
}

/**
 * Reflect vector v across a normal
 */
export function vec2Reflect(v: Vector2, normal: Vector2): Vector2 {
  const d = 2 * vec2Dot(v, normal);
  return {
    x: v.x - d * normal.x,
    y: v.y - d * normal.y,
  };
}
