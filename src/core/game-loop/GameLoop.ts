import type { GameTime } from './GameTime';
import { createGameTime } from './GameTime';

/**
 * Callback function type for game loop subscribers
 */
export type GameLoopCallback = (gameTime: GameTime) => void;

/**
 * Game loop using requestAnimationFrame
 * Provides consistent timing and time scaling for game simulation
 */
export class GameLoop {
  private running = false;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private readonly subscribers: Set<GameLoopCallback> = new Set();
  private readonly gameTime: GameTime;

  constructor() {
    this.gameTime = createGameTime();
    this.tick = this.tick.bind(this);
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Check if the game loop is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Subscribe to game loop updates
   * @returns Unsubscribe function
   */
  subscribe(callback: GameLoopCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Set the time scale (1 = normal, 2 = double speed, etc.)
   */
  setTimeScale(scale: number): void {
    this.gameTime.timeScale = Math.max(0, scale);
  }

  /**
   * Get the current time scale
   */
  getTimeScale(): number {
    return this.gameTime.timeScale;
  }

  /**
   * Pause the game (stops time progression but loop continues)
   */
  pause(): void {
    this.gameTime.paused = true;
  }

  /**
   * Resume the game after pausing
   */
  resume(): void {
    this.gameTime.paused = false;
  }

  /**
   * Check if the game is paused
   */
  isPaused(): boolean {
    return this.gameTime.paused;
  }

  /**
   * Get the current game time state
   */
  getGameTime(): Readonly<GameTime> {
    return { ...this.gameTime };
  }

  /**
   * Main tick function called each frame
   */
  private tick(currentTime: number): void {
    if (!this.running) return;

    // Calculate delta time in seconds
    const realDeltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    // Apply time scaling if not paused
    const deltaTime = this.gameTime.paused ? 0 : realDeltaTime * this.gameTime.timeScale;

    // Update game time
    this.gameTime.realDeltaTime = realDeltaTime;
    this.gameTime.deltaTime = deltaTime;
    if (!this.gameTime.paused) {
      this.gameTime.elapsed += deltaTime;
    }

    // Notify subscribers
    for (const callback of this.subscribers) {
      callback(this.gameTime);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.tick);
  }
}

/**
 * Singleton game loop instance
 */
let gameLoopInstance: GameLoop | null = null;

/**
 * Get or create the singleton game loop instance
 */
export function getGameLoop(): GameLoop {
  gameLoopInstance ??= new GameLoop();
  return gameLoopInstance;
}

/**
 * Reset the singleton game loop (useful for testing)
 */
export function resetGameLoop(): void {
  if (gameLoopInstance) {
    gameLoopInstance.stop();
    gameLoopInstance = null;
  }
}
