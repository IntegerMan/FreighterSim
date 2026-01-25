/**
 * Performance configuration and throttling policy for the renderer.
 * Controls auto-throttling behavior and performance targets.
 */
export interface PerformanceProfile {
  /**
   * Target frames per second (default: 60)
   */
  targetFps: number;

  /**
   * Window size in seconds for FPS averaging (default: 2)
   */
  fpsAvgWindowSec: number;

  /**
   * 95th percentile frame time threshold in milliseconds (default: 25)
   * Triggers throttling when exceeded for sustained period
   */
  frameTimeP95ThresholdMs: number;

  /**
   * Dynamic cap on particle count (adjusted by throttling)
   */
  particleCap: number;

  /**
   * Priority order for throttling strategies
   * Fixed order: particles -> effects -> resolution
   */
  scalingPriority: 'particles' | 'effects' | 'resolution';

  /**
   * WebGL context loss recovery policy
   */
  contextLossPolicy: {
    /**
     * Number of automatic recovery attempts (default: 1)
     */
    autoRecoveryAttempts: number;

    /**
     * Time window in seconds for detecting repeated context loss (default: 30)
     * If context is lost again within this window, halt instead of recovering
     */
    repeatWindowSec: number;
  };
}

/**
 * Default performance profile configuration
 */
export const DEFAULT_PERFORMANCE_PROFILE: PerformanceProfile = {
  targetFps: 60,
  fpsAvgWindowSec: 2,
  frameTimeP95ThresholdMs: 25,
  particleCap: 5000,
  scalingPriority: 'particles',
  contextLossPolicy: {
    autoRecoveryAttempts: 1,
    repeatWindowSec: 30,
  },
};
