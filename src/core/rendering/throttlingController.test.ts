import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThrottlingController, DEFAULT_THROTTLING_CONFIG } from './throttlingController';
import { DEFAULT_PERFORMANCE_PROFILE } from '../../models/PerformanceProfile';
import type { PerformanceSnapshot } from './performanceMonitor';

describe('ThrottlingController', () => {
  let controller: ThrottlingController;

  beforeEach(() => {
    controller = new ThrottlingController(DEFAULT_PERFORMANCE_PROFILE, DEFAULT_THROTTLING_CONFIG);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start in idle state', () => {
    expect(controller.getState()).toBe('idle');
  });

  it('should transition to monitoring when started', () => {
    controller.start();
    expect(controller.getState()).toBe('monitoring');
  });

  it('should not throttle with good performance', () => {
    controller.start();

    const goodSnapshot: PerformanceSnapshot = {
      fps: 60,
      avgFps: 60,
      frameTimeP95Ms: 16,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    const changed = controller.update(goodSnapshot);
    expect(changed).toBe(false);
    expect(controller.getState()).toBe('monitoring');
  });

  it('should throttle particles when FPS drops below threshold', () => {
    controller.start();

    const badSnapshot: PerformanceSnapshot = {
      fps: 50,
      avgFps: 50,
      frameTimeP95Ms: 20,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    // Update for duration threshold (2 seconds)
    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }

    expect(controller.getState()).toBe('throttling-particles');
    expect(controller.getParticleReductionFactor()).toBe(0.5);
  });

  it('should escalate throttling if performance remains poor', () => {
    controller.start();

    const badSnapshot: PerformanceSnapshot = {
      fps: 50,
      avgFps: 50,
      frameTimeP95Ms: 30,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    // Trigger particle throttling
    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }
    expect(controller.getState()).toBe('throttling-particles');

    // Continue with bad performance to escalate
    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }
    expect(controller.getState()).toBe('throttling-effects');
    expect(controller.getEffectsIntensity()).toBe(0.5);

    // Escalate further
    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }
    expect(controller.getState()).toBe('throttling-resolution');
    expect(controller.getResolutionScale()).toBeLessThan(1.0);
  });

  it('should recover when performance improves', () => {
    controller.start();

    // Cause throttling
    const badSnapshot: PerformanceSnapshot = {
      fps: 50,
      avgFps: 50,
      frameTimeP95Ms: 30,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }
    expect(controller.getState()).toBe('throttling-particles');

    // Improve performance
    const goodSnapshot: PerformanceSnapshot = {
      fps: 60,
      avgFps: 60,
      frameTimeP95Ms: 16,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    // Update for recovery duration (3 seconds)
    for (let i = 0; i < 15; i++) {
      controller.update(goodSnapshot);
      vi.advanceTimersByTime(250);
    }

    expect(controller.getState()).toBe('recovered');
    expect(controller.getParticleReductionFactor()).toBe(1.0);
    expect(controller.getEffectsIntensity()).toBe(1.0);
    expect(controller.getResolutionScale()).toBe(1.0);
  });

  it('should throttle on high frame time even with acceptable FPS', () => {
    controller.start();

    const highFrameTimeSnapshot: PerformanceSnapshot = {
      fps: 60,
      avgFps: 60,
      frameTimeP95Ms: 30, // Above threshold
      memoryMB: 100,
      timestamp: performance.now(),
    };

    // Update for frame time duration threshold (5 seconds)
    for (let i = 0; i < 25; i++) {
      controller.update(highFrameTimeSnapshot);
      vi.advanceTimersByTime(250);
    }

    expect(controller.getState()).toBe('throttling-particles');
  });

  it('should calculate max particle count based on throttling', () => {
    controller.start();

    // Initial max (no throttling)
    expect(controller.getMaxParticleCount()).toBe(5000);

    // Trigger throttling
    const badSnapshot: PerformanceSnapshot = {
      fps: 50,
      avgFps: 50,
      frameTimeP95Ms: 30,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }

    // Should be reduced to 50%
    expect(controller.getMaxParticleCount()).toBe(2500);
  });

  it('should reset to initial state', () => {
    controller.start();

    // Cause throttling
    const badSnapshot: PerformanceSnapshot = {
      fps: 50,
      avgFps: 50,
      frameTimeP95Ms: 30,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    for (let i = 0; i < 10; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }
    expect(controller.getState()).toBe('throttling-particles');

    // Reset
    controller.reset();

    expect(controller.getState()).toBe('monitoring');
    expect(controller.getParticleReductionFactor()).toBe(1.0);
    expect(controller.getEffectsIntensity()).toBe(1.0);
    expect(controller.getResolutionScale()).toBe(1.0);
  });

  it('should not throttle if duration threshold not met', () => {
    controller.start();

    const badSnapshot: PerformanceSnapshot = {
      fps: 50,
      avgFps: 50,
      frameTimeP95Ms: 30,
      memoryMB: 100,
      timestamp: performance.now(),
    };

    // Update for less than duration threshold (1 second)
    for (let i = 0; i < 4; i++) {
      controller.update(badSnapshot);
      vi.advanceTimersByTime(250);
    }

    // Should still be monitoring
    expect(controller.getState()).toBe('monitoring');
  });
});
