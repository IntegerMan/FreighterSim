/**
 * 2D Shape System - Core shape interfaces for ships and stations
 * 
 * This module defines the foundational types for the polygon-based
 * rendering and collision detection system.
 * 
 * @see ADR-0012 for design decisions
 */

import type { Vector2 } from './math';

// =============================================================================
// Shape Definitions
// =============================================================================

/**
 * A 2D polygon shape definition for rendering and collision detection.
 * Vertices are in normalized local coordinates (-1 to 1).
 * 
 * @example
 * ```typescript
 * const triangleShape: Shape = {
 *   id: 'triangle',
 *   name: 'Triangle',
 *   vertices: [
 *     { x: 0, y: 1 },
 *     { x: 0.87, y: -0.5 },
 *     { x: -0.87, y: -0.5 },
 *   ],
 *   boundingRadius: 1.0,
 * };
 * ```
 */
export interface Shape {
  /** Unique identifier for the shape */
  id: string;
  /** Human-readable name */
  name: string;
  /** Polygon vertices in local normalized coords (-1 to 1), counter-clockwise order */
  vertices: Vector2[];
  /** Pre-calculated bounding circle radius for quick collision checks */
  boundingRadius: number;
  /** Optional shape center of mass (defaults to origin) */
  centroid?: Vector2;
}

// =============================================================================
// Engine System
// =============================================================================

/**
 * A position and direction on a ship where an engine is located.
 * Used for particle emission origins and thrust calculations.
 * 
 * @example
 * ```typescript
 * const mainEngine: EngineMount = {
 *   name: 'main',
 *   position: { x: 0, y: -0.9 },
 *   direction: { x: 0, y: -1 },
 *   thrustMultiplier: 1.0,
 * };
 * ```
 */
export interface EngineMount {
  /** Engine identifier (e.g., 'main', 'port', 'starboard') */
  name: string;
  /** Local coordinates relative to shape origin (-1 to 1) */
  position: Vector2;
  /** Normalized thrust direction (typically pointing backward) */
  direction: Vector2;
  /** Relative thrust power multiplier (default: 1.0) */
  thrustMultiplier?: number;
}

// =============================================================================
// Ship Templates
// =============================================================================

/** Ship classification categories */
export type ShipCategory =
  | 'player'
  | 'freighter'
  | 'patrol'
  | 'military'
  | 'passenger'
  | 'utility';

/**
 * A reusable ship definition combining shape with engine configuration.
 * 
 * @example
 * ```typescript
 * const fireflyTemplate: ShipTemplate = {
 *   id: 'firefly',
 *   name: 'Firefly-class Transport',
 *   shape: serenityShape,
 *   engineMounts: [
 *     { name: 'main', position: { x: 0, y: -0.9 }, direction: { x: 0, y: -1 } },
 *   ],
 *   defaultSize: 40,
 *   category: 'player',
 * };
 * ```
 */
export interface ShipTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name for the ship type */
  name: string;
  /** The ship's polygon shape */
  shape: Shape;
  /** Engine locations (minimum 1) */
  engineMounts: EngineMount[];
  /** Default world-unit size when spawned */
  defaultSize: number;
  /** Ship classification */
  category: ShipCategory;
  /** Optional flavor text description */
  description?: string;
}

// =============================================================================
// Collision Detection Types
// =============================================================================

/**
 * Result of a collision check between two shapes.
 */
export interface CollisionResult {
  /** Whether collision occurred */
  collides: boolean;
  /** Overlap depth if colliding */
  penetration?: number;
  /** Push-out direction if colliding (normalized) */
  normal?: Vector2;
  /** Approximate contact location */
  contactPoint?: Vector2;
}

/**
 * Axis-aligned bounding box for quick collision pre-checks.
 */
export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
