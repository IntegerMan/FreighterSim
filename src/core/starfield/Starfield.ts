import type { Star, StarfieldConfig, StarfieldLayer } from '@/models/Starfield';
import type { CameraState } from '@/core/rendering';
import { generateStarsForCell, getVisibleCells, starToScreen } from './StarGenerator';

/**
 * Starfield renderer with multi-layer parallax support
 *
 * Features:
 * - Deterministic star generation based on seed
 * - Cell-based caching for performance
 * - Automatic culling of off-screen stars
 * - Cache pruning when cells leave viewport
 */
export class Starfield {
  private config: StarfieldConfig;
  private layers: StarfieldLayer[];

  constructor(config: StarfieldConfig) {
    this.config = config;
    this.layers = this.initializeLayers(config);
  }

  private initializeLayers(config: StarfieldConfig): StarfieldLayer[] {
    return config.layers.map((layerConfig) => ({
      config: layerConfig,
      starCache: new Map<string, Star[]>(),
    }));
  }

  /**
   * Render the starfield to the canvas
   * MUST be called after canvas clear, before grid and other objects
   *
   * @param ctx - Canvas 2D rendering context
   * @param camera - Current camera state
   */
  render(ctx: CanvasRenderingContext2D, camera: CameraState): void {
    // Render from back (far) to front (near)
    // Iterate in reverse so far layers are drawn first
    for (let i = this.layers.length - 1; i >= 0; i--) {
      this.renderLayer(ctx, camera, i);
    }
  }

  private renderLayer(
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    layerIndex: number
  ): void {
    const layer = this.layers[layerIndex];
    if (!layer) return;

    const visibleCells = getVisibleCells(
      camera,
      this.config.cellSize,
      layer.config.parallaxFactor
    );

    // Render stars for each visible cell
    for (const cell of visibleCells) {
      const cellKey = `${cell.x},${cell.y}`;

      // Get or generate stars for this cell
      if (!layer.starCache.has(cellKey)) {
        const stars = generateStarsForCell(
          cell.x,
          cell.y,
          layerIndex,
          this.config
        );
        layer.starCache.set(cellKey, stars);
      }

      const stars = layer.starCache.get(cellKey)!;
      this.renderStars(ctx, camera, stars, layer.config.parallaxFactor);
    }

    // Prune cache of cells no longer visible
    this.pruneCache(layer, visibleCells);
  }

  private renderStars(
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    stars: Star[],
    parallaxFactor: number
  ): void {
    const margin = 10; // Pixels of margin for culling

    for (const star of stars) {
      const screenPos = starToScreen(star, camera, parallaxFactor);

      // Quick culling check - skip stars outside viewport
      if (
        screenPos.x < -margin ||
        screenPos.x > camera.canvasWidth + margin ||
        screenPos.y < -margin ||
        screenPos.y > camera.canvasHeight + margin
      ) {
        continue;
      }

      // Render star as filled circle with brightness as alpha
      const alpha = star.brightness;
      ctx.fillStyle = star.color ?? `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private pruneCache(
    layer: StarfieldLayer,
    visibleCells: Array<{ x: number; y: number }>
  ): void {
    const visibleKeys = new Set(visibleCells.map((c) => `${c.x},${c.y}`));

    for (const key of layer.starCache.keys()) {
      if (!visibleKeys.has(key)) {
        layer.starCache.delete(key);
      }
    }
  }

  /**
   * Update the starfield configuration (e.g., when changing star systems)
   * Clears all caches and regenerates stars on next render
   *
   * @param config - New starfield configuration
   */
  setConfig(config: StarfieldConfig): void {
    this.config = config;
    this.layers = this.initializeLayers(config);
  }

  /**
   * Get the current configuration
   */
  getConfig(): StarfieldConfig {
    return this.config;
  }
}
