/**
 * Represents game time state
 */
export interface GameTime {
  /** Total elapsed game time in seconds */
  elapsed: number;
  /** Time since last frame in seconds (already scaled) */
  deltaTime: number;
  /** Real time since last frame in seconds */
  realDeltaTime: number;
  /** Time scale multiplier (1 = normal, 2 = double speed, etc.) */
  timeScale: number;
  /** Whether the game is paused */
  paused: boolean;
}

/**
 * Create initial game time state
 */
export function createGameTime(): GameTime {
  return {
    elapsed: 0,
    deltaTime: 0,
    realDeltaTime: 0,
    timeScale: 1,
    paused: false,
  };
}

/**
 * Available time scale presets
 */
export const TIME_SCALES = [1, 2, 4, 8] as const;
export type TimeScale = typeof TIME_SCALES[number];
