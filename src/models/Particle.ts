import type { Vector2 } from './math';

/**
 * Configuration for the particle grid system
 */
export interface ParticleGridConfig {
  /** World units per grid cell */
  cellSize: number;
  /** How fast particles spread to neighbors (0-1 per second) */
  spreadRate: number;
  /** How fast particles decay (density units per second) */
  decayRate: number;
  /** Maximum particle density per cell */
  maxDensity: number;
  /** Base particles emitted per second at full throttle */
  baseEmissionRate: number;
}

/**
 * Default particle grid configuration
 */
export const DEFAULT_PARTICLE_CONFIG: ParticleGridConfig = {
  cellSize: 50,
  spreadRate: 0.15,
  decayRate: 0.08,  // Reduced for longer-lasting particles
  maxDensity: 10,
  baseEmissionRate: 2.0,
};

/**
 * A single cell in the particle grid
 */
export interface ParticleCell {
  /** Grid x coordinate */
  x: number;
  /** Grid y coordinate */
  y: number;
  /** Current particle density (0 to maxDensity) */
  density: number;
  /** Time since last particle was added (seconds) */
  age: number;
}

/**
 * Sparse grid representation using Map for efficiency
 * Key: "x,y" string, Value: ParticleCell
 */
export type ParticleGrid = Map<string, ParticleCell>;

/**
 * Registered particle emitter (e.g., a ship)
 */
export interface ParticleEmitter {
  id: string;
  getPosition: () => Vector2;
  getThrottle: () => number;
}

/**
 * Threat level for radar display
 */
export type ThreatLevel = 'none' | 'far' | 'medium' | 'close' | 'critical';

/**
 * Radar segment data for proximity display
 */
export interface RadarSegment {
  /** Segment index (0-35 for 10° segments) */
  index: number;
  /** Segment start angle in degrees (0-360) */
  startAngle: number;
  /** Segment end angle in degrees */
  endAngle: number;
  /** Nearest contact in this segment, if any */
  nearestContact: {
    id: string;
    name: string;
    type: string;
    distance: number;
    bearing: number;
  } | null;
  /** Threat level based on distance */
  threatLevel: ThreatLevel;
}

/**
 * Create a cell key for the sparse grid Map
 */
export function createCellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Parse a cell key back to coordinates
 */
export function parseCellKey(key: string): { x: number; y: number } {
  const parts = key.split(',');
  return {
    x: Number(parts[0]),
    y: Number(parts[1]),
  };
}

/**
 * Convert world position to grid coordinates
 */
export function worldToGridCoord(worldPos: Vector2, cellSize: number): { x: number; y: number } {
  return {
    x: Math.floor(worldPos.x / cellSize),
    y: Math.floor(worldPos.y / cellSize),
  };
}

/**
 * Convert grid coordinates to world position (center of cell)
 */
export function gridToWorldCoord(gridX: number, gridY: number, cellSize: number): Vector2 {
  return {
    x: (gridX + 0.5) * cellSize,
    y: (gridY + 0.5) * cellSize,
  };
}

/**
 * Distance thresholds for threat level calculation (as fraction of sensor range)
 */
export const THREAT_THRESHOLDS = {
  critical: 0.1,  // 10% of range
  close: 0.25,    // 25% of range
  medium: 0.5,    // 50% of range
  far: 0.75,      // 75% of range
};

/**
 * Calculate threat level from distance and sensor range
 */
export function getThreatLevelFromDistance(distance: number, sensorRange: number): ThreatLevel {
  const ratio = distance / sensorRange;

  if (ratio <= THREAT_THRESHOLDS.critical) return 'critical';
  if (ratio <= THREAT_THRESHOLDS.close) return 'close';
  if (ratio <= THREAT_THRESHOLDS.medium) return 'medium';
  if (ratio <= THREAT_THRESHOLDS.far) return 'far';
  return 'none';
}

/**
 * Get color for threat level (for radar display)
 */
export function getThreatLevelColor(level: ThreatLevel): string {
  switch (level) {
    case 'critical': return '#FF4444';  // Red
    case 'close': return '#FF8800';     // Orange
    case 'medium': return '#FFCC00';    // Yellow
    case 'far': return '#44FF44';       // Green
    case 'none': return 'transparent';
  }
}

/**
 * Check if an angle falls within a segment (handles wrap-around)
 */
export function isAngleInSegment(angle: number, startAngle: number, endAngle: number): boolean {
  // Normalize angle to 0-360
  const normalizedAngle = ((angle % 360) + 360) % 360;

  if (startAngle <= endAngle) {
    // Normal case: segment doesn't wrap around 360
    return normalizedAngle >= startAngle && normalizedAngle < endAngle;
  } else {
    // Wrap-around case: segment crosses 360/0 boundary
    return normalizedAngle >= startAngle || normalizedAngle < endAngle;
  }
}
