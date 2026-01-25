/**
 * Represents a renderable object in the scene.
 * Can be a sprite, graphic, or other PixiJS display object.
 */
export interface RenderableObject {
  /**
   * Unique identifier for the object
   */
  id: string;

  /**
   * World position of the object
   */
  position: {
    x: number;
    y: number;
  };

  /**
   * Rotation in radians
   */
  rotation: number;

  /**
   * Whether the object is currently selected (affects visual effects)
   */
  selected: boolean;

  /**
   * Effects configuration for the object
   */
  effects: {
    /**
     * Whether the object is eligible for enhanced effects (glow, trails, etc.)
     */
    eligible: boolean;

    /**
     * Current intensity of effects applied to the object
     * Range: [0, 1] where 0 is no effects and 1 is full intensity
     * When eligible is false, intensity is forced to 0
     */
    intensity: number;
  };
}
