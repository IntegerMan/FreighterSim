/**
 * WebGL context loss detection and recovery handler.
 * Implements single automatic recovery with halt on repeated failures.
 */

import type { PerformanceProfile } from '../../models/PerformanceProfile';

export type ContextLossState = 'active' | 'recovering' | 'halted';

export interface ContextLossHandler {
  state: ContextLossState;
  attemptCount: number;
  lastLossTime: number | null;
}

export class WebGLContextLossHandler {
  private readonly canvas: HTMLCanvasElement;
  private readonly profile: PerformanceProfile;
  private state: ContextLossState = 'active';
  private attemptCount = 0;
  private lastLossTime: number | null = null;
  private readonly onRecoveryCallback?: () => Promise<void>;
  private readonly onHaltCallback?: (reason: string) => void;
  private readonly boundHandleContextLost: (event: Event) => void;
  private readonly boundHandleContextRestored: (event: Event) => Promise<void>;

  constructor(
    canvas: HTMLCanvasElement,
    profile: PerformanceProfile,
    onRecovery?: () => Promise<void>,
    onHalt?: (reason: string) => void
  ) {
    this.canvas = canvas;
    this.profile = profile;
    this.onRecoveryCallback = onRecovery;
    this.onHaltCallback = onHalt;
    
    // Bind event handlers once
    this.boundHandleContextLost = this.handleContextLost.bind(this);
    this.boundHandleContextRestored = this.handleContextRestored.bind(this);

    this.setupListeners();
  }

  /**
   * Sets up WebGL context loss and restore event listeners.
   */
  private setupListeners(): void {
    this.canvas.addEventListener('webglcontextlost', this.boundHandleContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.boundHandleContextRestored);
  }

  /**
   * Handles WebGL context lost event.
   */
  private handleContextLost(event: Event): void {
    event.preventDefault(); // Prevent default behavior

    const now = Date.now();
    
    // Check if this is a repeated loss within the window
    if (this.lastLossTime !== null) {
      const elapsed = (now - this.lastLossTime) / 1000;
      
      if (elapsed < this.profile.contextLossPolicy.repeatWindowSec) {
        // Repeated loss within window - halt
        this.state = 'halted';
        const reason = `WebGL context lost repeatedly within ${this.profile.contextLossPolicy.repeatWindowSec}s. Application halted.`;
        console.error(reason);
        this.onHaltCallback?.(reason);
        return;
      } else {
        // Reset count if outside the window
        this.attemptCount = 0;
      }
    }

    this.lastLossTime = now;
    this.attemptCount++;

    // Check if we can attempt recovery
    if (this.attemptCount > this.profile.contextLossPolicy.autoRecoveryAttempts) {
      this.state = 'halted';
      const reason = `WebGL context loss recovery attempts exhausted (${this.profile.contextLossPolicy.autoRecoveryAttempts}). Application halted.`;
      console.error(reason);
      this.onHaltCallback?.(reason);
      return;
    }

    // Attempt recovery
    this.state = 'recovering';
    console.warn(`WebGL context lost. Attempting recovery (attempt ${this.attemptCount}/${this.profile.contextLossPolicy.autoRecoveryAttempts})...`);
  }

  /**
   * Handles WebGL context restored event.
   */
  private async handleContextRestored(_event: Event): Promise<void> {
    if (this.state === 'halted') {
      return; // Don't recover if halted
    }

    console.log('WebGL context restored. Reinitializing renderer...');
    
    try {
      if (this.onRecoveryCallback) {
        await this.onRecoveryCallback();
      }
      
      this.state = 'active';
      console.log('Renderer recovery successful.');
    } catch (error) {
      this.state = 'halted';
      const reason = `Failed to recover from WebGL context loss: ${error}`;
      console.error(reason);
      this.onHaltCallback?.(reason);
    }
  }

  /**
   * Gets the current state of the context loss handler.
   */
  getState(): ContextLossHandler {
    return {
      state: this.state,
      attemptCount: this.attemptCount,
      lastLossTime: this.lastLossTime,
    };
  }

  /**
   * Manually triggers a halt (for testing or emergency shutdown).
   */
  halt(reason: string): void {
    this.state = 'halted';
    this.onHaltCallback?.(reason);
  }

  /**
   * Cleans up event listeners.
   */
  destroy(): void {
    this.canvas.removeEventListener('webglcontextlost', this.boundHandleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.boundHandleContextRestored);
  }
}
