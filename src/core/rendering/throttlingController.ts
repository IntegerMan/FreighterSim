/**
 * Throttling controller for auto-scaling rendering based on performance metrics.
 * Implements state machine for managing throttling stages and recovery.
 */

import type { PerformanceProfile } from '../../models/PerformanceProfile';
import type { PerformanceSnapshot } from './performanceMonitor';

export type ThrottlingState = 
  | 'idle' 
  | 'monitoring' 
  | 'throttling-particles' 
  | 'throttling-effects' 
  | 'throttling-resolution' 
  | 'recovered';

export interface ThrottlingConfig {
  /** Threshold FPS for triggering throttling (default: 58) */
  fpsThreshold: number;
  
  /** Duration in seconds that FPS must be below threshold to trigger (default: 2) */
  fpsDurationSec: number;
  
  /** Duration in seconds that frame time must exceed threshold to trigger (default: 5) */
  frameTimeDurationSec: number;
  
  /** Duration in seconds that metrics must be good to recover (default: 3) */
  recoveryDurationSec: number;
}

export const DEFAULT_THROTTLING_CONFIG: ThrottlingConfig = {
  fpsThreshold: 58,
  fpsDurationSec: 2,
  frameTimeDurationSec: 5,
  recoveryDurationSec: 3,
};

export class ThrottlingController {
  private state: ThrottlingState = 'idle';
  private readonly profile: PerformanceProfile;
  private readonly config: ThrottlingConfig;
  
  // Throttling state
  private particleReductionFactor = 1; // 1 = no reduction
  private effectsIntensity = 1; // 1 = full intensity
  private resolutionScale = 1; // 1 = full resolution
  
  // Trigger tracking
  private lowFpsStartTime: number | null = null;
  private highFrameTimeStartTime: number | null = null;
  private goodMetricsStartTime: number | null = null;

  constructor(profile: PerformanceProfile, config: ThrottlingConfig = DEFAULT_THROTTLING_CONFIG) {
    this.profile = profile;
    this.config = config;
  }

  /**
   * Starts the throttling controller.
   */
  start(): void {
    if (this.state === 'idle') {
      this.state = 'monitoring';
    }
  }

  /**
   * Updates the controller with current performance metrics.
   * Returns true if throttling settings changed.
   */
  update(snapshot: PerformanceSnapshot): boolean {
    if (this.state === 'idle') {
      return false;
    }

    const now = performance.now();
    let changed = false;

    // Check if performance is degraded
    const isFpsLow = snapshot.avgFps < this.config.fpsThreshold;
    const isFrameTimeHigh = snapshot.frameTimeP95Ms > this.profile.frameTimeP95ThresholdMs;

    // Track low FPS duration
    if (isFpsLow) {
      this.lowFpsStartTime ??= now;
    } else {
      this.lowFpsStartTime = null;
    }

    // Track high frame time duration
    if (isFrameTimeHigh) {
      this.highFrameTimeStartTime ??= now;
    } else {
      this.highFrameTimeStartTime = null;
    }

    // Check if we should trigger throttling
    const shouldThrottle = this.shouldTriggerThrottling(now);

    if (shouldThrottle && this.state !== 'recovered') {
      // Only escalate if not already escalated for this window
      const escalated = this.escalateThrottling();
      if (escalated) {
        changed = true;
        // Reset timing to prevent immediate re-escalation
        this.lowFpsStartTime = now;
        this.highFrameTimeStartTime = now;
      }
      this.goodMetricsStartTime = null; // Reset recovery tracking
    }

    // Check for recovery
    const shouldRecover = !isFpsLow && !isFrameTimeHigh;
    if (shouldRecover) {
      this.goodMetricsStartTime ??= now;
      
      const goodDuration = (now - this.goodMetricsStartTime) / 1000;
      if (goodDuration >= this.config.recoveryDurationSec) {
        changed = this.recover() || changed;
      }
    } else {
      this.goodMetricsStartTime = null;
    }

    return changed;
  }

  /**
   * Checks if throttling should be triggered based on duration thresholds.
   */
  private shouldTriggerThrottling(now: number): boolean {
    // Check FPS threshold
    if (this.lowFpsStartTime !== null) {
      const duration = (now - this.lowFpsStartTime) / 1000;
      if (duration >= this.config.fpsDurationSec) {
        return true;
      }
    }

    // Check frame time threshold
    if (this.highFrameTimeStartTime !== null) {
      const duration = (now - this.highFrameTimeStartTime) / 1000;
      if (duration >= this.config.frameTimeDurationSec) {
        return true;
      }
    }

    return false;
  }

  /**
   * Escalates throttling to the next stage.
   * Returns true if settings changed.
   */
  private escalateThrottling(): boolean {
    switch (this.state) {
      case 'monitoring':
        this.state = 'throttling-particles';
        this.particleReductionFactor = 0.5; // Reduce to 50%
        console.warn('Throttling: Reducing particle count to 50%');
        return true;

      case 'throttling-particles':
        this.state = 'throttling-effects';
        this.effectsIntensity = 0.5; // Reduce effects to 50%
        console.warn('Throttling: Reducing effects intensity to 50%');
        return true;

      case 'throttling-effects':
        this.state = 'throttling-resolution';
        this.resolutionScale = 0.75; // Reduce resolution to 75%
        console.warn('Throttling: Reducing resolution to 75%');
        return true;

      case 'throttling-resolution':
        // Already at max throttling
        if (this.resolutionScale > 0.5) {
          this.resolutionScale = Math.max(0.5, this.resolutionScale - 0.1);
          console.warn(`Throttling: Further reducing resolution to ${this.resolutionScale * 100}%`);
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Recovers from throttling, returning to normal operation.
   * Returns true if settings changed.
   */
  private recover(): boolean {
    if (this.state === 'monitoring') {
      return false; // Already at normal operation
    }

    // Gradually recover
    this.state = 'recovered';
    this.particleReductionFactor = 1;
    this.effectsIntensity = 1;
    this.resolutionScale = 1;
    
    console.log('Throttling: Performance recovered, returning to normal operation');
    
    // Return to monitoring after recovery
    setTimeout(() => {
      if (this.state === 'recovered') {
        this.state = 'monitoring';
      }
    }, 1000);

    return true;
  }

  /**
   * Gets the current throttling state.
   */
  getState(): ThrottlingState {
    return this.state;
  }

  /**
   * Gets the current particle reduction factor (0-1).
   */
  getParticleReductionFactor(): number {
    return this.particleReductionFactor;
  }

  /**
   * Gets the current effects intensity (0-1).
   */
  getEffectsIntensity(): number {
    return this.effectsIntensity;
  }

  /**
   * Gets the current resolution scale (0-1).
   */
  getResolutionScale(): number {
    return this.resolutionScale;
  }

  /**
   * Gets the maximum particle count based on current throttling.
   */
  getMaxParticleCount(): number {
    return Math.floor(this.profile.particleCap * this.particleReductionFactor);
  }

  /**
   * Resets the throttling controller to initial state.
   */
  reset(): void {
    this.state = 'monitoring';
    this.particleReductionFactor = 1;
    this.effectsIntensity = 1;
    this.resolutionScale = 1;
    this.lowFpsStartTime = null;
    this.highFrameTimeStartTime = null;
    this.goodMetricsStartTime = null;
  }
}
