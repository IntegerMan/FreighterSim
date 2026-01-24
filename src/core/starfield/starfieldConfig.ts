import type { StarfieldConfig, StarfieldLayerConfig } from '@/models/Starfield';

/**
 * Default layer configurations:
 * - Near: parallax 0.6x, 15 stars, large/bright
 * - Mid: parallax 0.35x, 40 stars, medium
 * - Far: parallax 0.15x, 100 stars, small/dim
 *
 * All layers use parallax < 1.0 so stars are clearly background elements,
 * not objects in the play space (obstacles, powerups, etc.)
 */
export const DEFAULT_LAYER_CONFIGS: StarfieldLayerConfig[] = [
  // Near layer - large, bright stars, moves slower than player
  {
    parallaxFactor: 0.6,
    density: 15,
    radiusRange: [1.5, 3.0],
    brightnessRange: [0.8, 1.0],
  },
  // Mid layer - medium stars, noticeably slower
  {
    parallaxFactor: 0.35,
    density: 40,
    radiusRange: [0.8, 1.5],
    brightnessRange: [0.5, 0.8],
  },
  // Far layer - small, dim stars, barely moving
  {
    parallaxFactor: 0.15,
    density: 100,
    radiusRange: [0.3, 0.8],
    brightnessRange: [0.2, 0.5],
  },
];

/**
 * Default cell size for spatial grid (world units)
 * Larger cells = fewer cells to manage but more stars per cell
 */
export const DEFAULT_CELL_SIZE = 500;

/**
 * Create a starfield configuration with default settings
 * @param systemId - System identifier used as seed for deterministic generation
 * @param customLayers - Optional custom layer configs (overrides defaults)
 */
export function createDefaultStarfieldConfig(
  systemId: string,
  customLayers?: StarfieldLayerConfig[]
): StarfieldConfig {
  return {
    seed: systemId,
    layers: customLayers ?? DEFAULT_LAYER_CONFIGS,
    cellSize: DEFAULT_CELL_SIZE,
  };
}
