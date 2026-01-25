/**
 * Represents a rendering layer in the PixiJS scene graph.
 * Layers are used to organize renderable objects by z-index and manage visibility.
 */
export interface RenderingLayer {
  /**
   * Unique identifier for the layer (e.g., 'background', 'game', 'effects', 'ui')
   */
  id: string;

  /**
   * Z-index ordering for layer rendering (higher values render on top)
   * Must be unique across all layers
   */
  zIndex: number;

  /**
   * Whether the layer is currently visible
   */
  visible: boolean;

  /**
   * Scale factor applied to the layer for resolution scaling during throttling
   * Range: (0, 1] where 1 is full resolution
   * Default: 1
   */
  scaleFactor: number;
}
