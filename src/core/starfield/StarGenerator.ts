import type { Star, StarfieldConfig } from '@/models/Starfield';
import type { Vector2 } from '@/models';
import type { CameraState } from '@/core/rendering';

/**
 * Mulberry32 - Fast seeded PRNG returning values in [0, 1)
 * @param seed - 32-bit integer seed
 * @returns Function that generates the next random number
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a consistent 32-bit hash from a string
 * Uses djb2 variant for good distribution
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash + char) | 0; // hash * 33 + char, force 32-bit
  }
  return hash;
}

/**
 * Generate stars for a specific grid cell
 * Stars are deterministically positioned based on cell coordinates and config seed
 *
 * @param cellX - Cell X coordinate (grid space, not world)
 * @param cellY - Cell Y coordinate (grid space, not world)
 * @param layerIndex - Index of the layer (0 = near, 1 = mid, 2 = far)
 * @param config - Starfield configuration
 * @returns Array of stars within the cell
 */
export function generateStarsForCell(
  cellX: number,
  cellY: number,
  layerIndex: number,
  config: StarfieldConfig
): Star[] {
  const layer = config.layers[layerIndex];
  if (!layer) return [];

  // Create unique seed from system seed + layer + cell coordinates
  const cellKey = `${config.seed}:${layerIndex}:${cellX},${cellY}`;
  const seed = hashString(cellKey);
  const rng = mulberry32(seed);

  const stars: Star[] = [];

  // Stars per cell = density / average visible cells (approximately 9 cells visible)
  const starsPerCell = Math.ceil(layer.density / 9);

  for (let i = 0; i < starsPerCell; i++) {
    // Position within cell (0-1 range) then scale to world coordinates
    const localX = rng();
    const localY = rng();
    const worldX = (cellX + localX) * config.cellSize;
    const worldY = (cellY + localY) * config.cellSize;

    // Random radius within range
    const radiusT = rng();
    const radius =
      layer.radiusRange[0] + radiusT * (layer.radiusRange[1] - layer.radiusRange[0]);

    // Random brightness within range
    const brightnessT = rng();
    const brightness =
      layer.brightnessRange[0] +
      brightnessT * (layer.brightnessRange[1] - layer.brightnessRange[0]);

    stars.push({
      worldPos: { x: worldX, y: worldY },
      radius,
      brightness,
    });
  }

  return stars;
}

/**
 * Calculate screen position of a star with parallax effect
 * Parallax is achieved by scaling the camera offset, not moving star positions
 *
 * @param star - Star to position
 * @param camera - Current camera state
 * @param parallaxFactor - Layer's parallax factor (1.0 = full movement, 0.25 = quarter)
 * @returns Screen coordinates
 */
export function starToScreen(
  star: Pick<Star, 'worldPos'>,
  camera: CameraState,
  parallaxFactor: number
): Vector2 {
  // Apply parallax by reducing the camera offset effect for distant layers
  const parallaxCenterX = camera.centerX * parallaxFactor;
  const parallaxCenterY = camera.centerY * parallaxFactor;

  const screenCenterX = camera.canvasWidth / 2;
  const screenCenterY = camera.canvasHeight / 2;

  return {
    x: screenCenterX + (star.worldPos.x - parallaxCenterX) * camera.zoom,
    // Y is flipped: world Y increases up, screen Y increases down
    y: screenCenterY - (star.worldPos.y - parallaxCenterY) * camera.zoom,
  };
}

/**
 * Get grid cells that are visible for a given layer
 * Includes a buffer zone around the viewport for smooth scrolling
 *
 * @param camera - Current camera state
 * @param cellSize - Size of grid cells in world units
 * @param parallaxFactor - Layer's parallax factor
 * @returns Array of cell coordinates to render
 */
export function getVisibleCells(
  camera: CameraState,
  cellSize: number,
  parallaxFactor: number
): Array<{ x: number; y: number }> {
  // Calculate world bounds visible at this parallax layer
  const halfWidth = camera.canvasWidth / 2 / camera.zoom;
  const halfHeight = camera.canvasHeight / 2 / camera.zoom;

  // Effective camera center for this parallax layer
  const centerX = camera.centerX * parallaxFactor;
  const centerY = camera.centerY * parallaxFactor;

  // Add buffer of 1 cell on each side for smooth scrolling
  const minCellX = Math.floor((centerX - halfWidth) / cellSize) - 1;
  const maxCellX = Math.ceil((centerX + halfWidth) / cellSize) + 1;
  const minCellY = Math.floor((centerY - halfHeight) / cellSize) - 1;
  const maxCellY = Math.ceil((centerY + halfHeight) / cellSize) + 1;

  const cells: Array<{ x: number; y: number }> = [];
  for (let x = minCellX; x <= maxCellX; x++) {
    for (let y = minCellY; y <= maxCellY; y++) {
      cells.push({ x, y });
    }
  }

  return cells;
}
