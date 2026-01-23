/**
 * 2D Shape System - TypeScript Contracts
 *
 * Feature: 005-2d-shape-system
 * Date: January 23, 2026
 *
 * These interfaces define the shape system for ships and stations.
 * Import from '@/models' after implementation.
 */

import type { Vector2 } from './math';

// =============================================================================
// Shape Definitions
// =============================================================================

/**
 * A 2D polygon shape definition for rendering and collision detection.
 * Vertices are in normalized local coordinates (-1 to 1).
 */
export interface Shape {
  /** Unique identifier for the shape */
  id: string;
  /** Human-readable name */
  name: string;
  /** Polygon vertices in local normalized coords, counter-clockwise order */
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
// Docking System
// =============================================================================

/** Size classification for docking ports */
export type DockingPortSize = 'small' | 'medium' | 'large';

/**
 * A position on a station where ships can dock.
 */
export interface DockingPort {
  /** Unique port identifier */
  id: string;
  /** World position (or local if on module) */
  position: Vector2;
  /** Required approach direction (normalized) */
  approachVector: Vector2;
  /** Ship size compatibility */
  size: DockingPortSize;
  /** Degrees of heading tolerance (default: 15) */
  alignmentTolerance?: number;
  /** Distance at which docking is available (default: 30) */
  dockingRange?: number;
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
// Station Modules
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
 */
export interface StationModule {
  /** Module classification */
  type: StationModuleType;
  /** Module polygon shape */
  shape: Shape;
  /** Where other modules can attach */
  connectionPoints: Vector2[];
  /** Docking ports if this is a docking module */
  dockingPorts?: DockingPort[];
}

/**
 * An instance of a module within a station template.
 */
export interface StationModulePlacement {
  /** Which module type to place */
  moduleType: StationModuleType;
  /** Offset from station origin in world units */
  position: Vector2;
  /** Rotation in degrees */
  rotation: number;
}

// =============================================================================
// Station Templates
// =============================================================================

/**
 * A complete station definition composed of modules.
 */
export interface StationTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Station type classification (matches existing StationType) */
  type: string; // StationType from Station.ts
  /** Module arrangement */
  modules: StationModulePlacement[];
  /** Initial rotation in degrees (default: 0) */
  defaultRotation?: number;
}

// =============================================================================
// Collision Detection
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

// =============================================================================
// Raytracing
// =============================================================================

/**
 * Result of a sensor raycast operation.
 */
export interface RaycastResult {
  /** Whether the ray hit an obstacle */
  hit: boolean;
  /** Distance to hit point */
  distance?: number;
  /** World position of hit */
  hitPoint?: Vector2;
  /** ID of the blocking object */
  hitObjectId?: string;
}

// =============================================================================
// LOD (Level of Detail)
// =============================================================================

/** Level of detail for shape rendering based on screen size */
export type ShapeLOD = 'dot' | 'simple' | 'detailed';

// =============================================================================
// Ship/Station Extensions
// =============================================================================

/**
 * Extended ship properties for shape system.
 * Merge with existing Ship interface.
 */
export interface ShipShapeExtension {
  /** Reference to ShipTemplate ID (undefined = legacy circle rendering) */
  templateId?: string;
  /** World-unit size (scales the shape) */
  size?: number;
}

/**
 * Extended station properties for shape system.
 * Merge with existing Station interface.
 */
export interface StationShapeExtension {
  /** Reference to StationTemplate ID */
  templateId?: string;
  /** Current rotation in degrees */
  rotation?: number;
}

// =============================================================================
// Rendering Context
// =============================================================================

/**
 * Context passed to shape rendering functions.
 */
export interface ShapeRenderContext {
  /** 2D canvas rendering context */
  ctx: CanvasRenderingContext2D;
  /** Fill color (undefined = no fill) */
  fillColor?: string;
  /** Stroke color (undefined = no stroke) */
  strokeColor?: string;
  /** Stroke line width */
  lineWidth?: number;
}

// =============================================================================
// Template Registries
// =============================================================================

/**
 * Registry for looking up ship templates by ID.
 */
export type ShipTemplateRegistry = Map<string, ShipTemplate>;

/**
 * Registry for looking up station templates by ID.
 */
export type StationTemplateRegistry = Map<string, StationTemplate>;

/**
 * Registry for looking up station modules by type.
 */
export type StationModuleRegistry = Map<StationModuleType, StationModule>;
