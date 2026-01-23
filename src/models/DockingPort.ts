/**
 * Docking Port System - Interfaces for station docking mechanics
 * 
 * Defines docking port positions, approach vectors, and size compatibility
 * for ship-station docking interactions.
 * 
 * @see ADR-0012 for design decisions
 */

import type { Vector2 } from './math';

// =============================================================================
// Docking Port Definitions
// =============================================================================

/** Size classification for docking ports */
export type DockingPortSize = 'small' | 'medium' | 'large';

/**
 * A position on a station where ships can dock.
 * Ships must approach from the correct vector and be within alignment tolerance.
 * 
 * @example
 * ```typescript
 * const portAlpha: DockingPort = {
 *   id: 'port-alpha',
 *   position: { x: 0, y: 200 },
 *   approachVector: { x: 0, y: 1 },
 *   size: 'medium',
 *   alignmentTolerance: 15,
 *   dockingRange: 30,
 * };
 * ```
 */
export interface DockingPort {
  /** Unique port identifier */
  id: string;
  /** Position relative to station origin (or local if on module) */
  position: Vector2;
  /** Required approach direction (normalized) - ship must face opposite */
  approachVector: Vector2;
  /** Ship size compatibility */
  size: DockingPortSize;
  /** Degrees of heading tolerance (default: 15) */
  alignmentTolerance?: number;
  /** Distance at which docking is available in world units (default: 30) */
  dockingRange?: number;
}

/** Default alignment tolerance in degrees */
export const DEFAULT_ALIGNMENT_TOLERANCE = 15;

/** Default docking range in world units */
export const DEFAULT_DOCKING_RANGE = 30;

/**
 * Get the effective alignment tolerance for a docking port
 */
export function getAlignmentTolerance(port: DockingPort): number {
  return port.alignmentTolerance ?? DEFAULT_ALIGNMENT_TOLERANCE;
}

/**
 * Get the effective docking range for a docking port
 */
export function getDockingRange(port: DockingPort): number {
  return port.dockingRange ?? DEFAULT_DOCKING_RANGE;
}
