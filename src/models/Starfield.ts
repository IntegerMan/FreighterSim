import type { Vector2 } from './math';

/**
 * A single star in the background starfield
 */
export interface Star {
  /** World position (at parallax factor 1.0) */
  worldPos: Vector2;
  /** Visual radius in pixels (screen space) */
  radius: number;
  /** Brightness from 0.0 to 1.0 */
  brightness: number;
  /** Optional color override (defaults to white) */
  color?: string;
}

/**
 * Configuration for a single depth layer
 */
export interface StarfieldLayerConfig {
  /** Parallax movement factor (1.0 = full speed, 0.5 = half speed, 0.25 = quarter speed) */
  parallaxFactor: number;
  /** Number of stars visible in viewport at once */
  density: number;
  /** Star radius range [min, max] in pixels */
  radiusRange: [number, number];
  /** Brightness range [min, max] from 0.0 to 1.0 */
  brightnessRange: [number, number];
}

/**
 * Complete starfield configuration for a star system
 */
export interface StarfieldConfig {
  /** Seed for deterministic generation (typically system ID) */
  seed: string;
  /** Configuration per layer (near, mid, far) */
  layers: StarfieldLayerConfig[];
  /** Size of spatial grid cells for star generation (world units) */
  cellSize: number;
}

/**
 * Runtime state for a generated star layer (internal use)
 */
export interface StarfieldLayer {
  config: StarfieldLayerConfig;
  /** Cached stars by cell key "x,y" */
  starCache: Map<string, Star[]>;
}
