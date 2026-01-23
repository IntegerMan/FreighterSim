/**
 * Station Module System - Interfaces for modular station composition
 * 
 * Stations are composed of interconnected modules, each with its own
 * shape, connection points, and optional docking ports.
 * 
 * @see ADR-0012 for design decisions
 */

import type { Vector2 } from './math';
import type { Shape } from './Shape';
import type { DockingPort } from './DockingPort';

// =============================================================================
// Station Module Types
// =============================================================================

/** Types of station modules for modular composition */
export type StationModuleType =
  | 'core'
  | 'docking-ring'
  | 'habitat'
  | 'cargo'
  | 'solar-array'
  | 'antenna'
  | 'refinery'
  | 'command';

/**
 * A reusable building block for station composition.
 * Modules can connect to each other via connection points and
 * may include docking ports for ship interactions.
 * 
 * @example
 * ```typescript
 * const dockingRingModule: StationModule = {
 *   type: 'docking-ring',
 *   shape: dockingRingShape,
 *   connectionPoints: [
 *     { x: 0, y: -50 },  // Connect to core
 *     { x: 0, y: 50 },   // Connect outward
 *   ],
 *   dockingPorts: [
 *     { id: 'port-1', position: { x: -40, y: 0 }, approachVector: { x: -1, y: 0 }, size: 'medium' },
 *   ],
 * };
 * ```
 */
export interface StationModule {
  /** Module classification */
  type: StationModuleType;
  /** Module polygon shape */
  shape: Shape;
  /** Where other modules can attach (local coordinates) */
  connectionPoints: Vector2[];
  /** Docking ports if this is a docking module */
  dockingPorts?: DockingPort[];
}

/**
 * An instance of a module within a station template.
 * Defines where and how a module is placed relative to station origin.
 */
export interface StationModulePlacement {
  /** Which module type to place */
  moduleType: StationModuleType;
  /** Offset from station origin in local station units */
  position: Vector2;
  /** Rotation in degrees (0 = default orientation) */
  rotation: number;
}

// =============================================================================
// Station Templates
// =============================================================================

/**
 * A complete station definition composed of modules.
 * Templates define the structure of station types like trading hubs
 * or mining outposts.
 * 
 * @example
 * ```typescript
 * const tradingHubTemplate: StationTemplate = {
 *   id: 'trading-hub',
 *   name: 'Trading Hub',
 *   type: 'trading-hub',
 *   modules: [
 *     { moduleType: 'core', position: { x: 0, y: 0 }, rotation: 0 },
 *     { moduleType: 'docking-ring', position: { x: 0, y: 100 }, rotation: 0 },
 *   ],
 *   defaultRotation: 0,
 * };
 * ```
 */
export interface StationTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Station type classification (matches existing StationType) */
  type: string;
  /** Module arrangement */
  modules: StationModulePlacement[];
  /** Initial rotation in degrees (default: 0) */
  defaultRotation?: number;
}

/** Default station rotation in degrees */
export const DEFAULT_STATION_ROTATION = 0;

/**
 * Get the effective default rotation for a station template
 */
export function getDefaultRotation(template: StationTemplate): number {
  return template.defaultRotation ?? DEFAULT_STATION_ROTATION;
}
