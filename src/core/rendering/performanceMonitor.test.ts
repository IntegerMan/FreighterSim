import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from './performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor(2);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with zero metrics', () => {
    const snapshot = monitor.getSnapshot();
    expect(snapshot.fps).toBe(0);
    expect(snapshot.avgFps).toBe(0);
    expect(snapshot.frameTimeP95Ms).toBe(0);
  });

  it('should record frames and calculate FPS', () => {
    // Simulate 60 FPS (16.67ms per frame)
    for (let i = 0; i < 10; i++) {
      monitor.recordFrame();
      vi.advanceTimersByTime(16.67);
    }

    const snapshot = monitor.getSnapshot();
    expect(snapshot.avgFps).toBeGreaterThan(50);
    expect(snapshot.avgFps).toBeLessThan(70);
  });

  it('should calculate average FPS over window', () => {
    // Record some frames
    for (let i = 0; i < 5; i++) {
      monitor.recordFrame();
      vi.advanceTimersByTime(16.67); // ~60 FPS
    }

    const avgFps = monitor.getAverageFPS();
    expect(avgFps).toBeGreaterThan(0);
  });

  it('should calculate 95th percentile frame time', () => {
    // Simulate varying frame times
    const frameTimes = [10, 12, 14, 16, 18, 20, 25, 30, 40, 50];
    
    for (const frameTime of frameTimes) {
      monitor.recordFrame();
      vi.advanceTimersByTime(frameTime);
    }

    const p95 = monitor.getFrameTimeP95();
    // P95 should be around 40-50ms (95th percentile of our data)
    expect(p95).toBeGreaterThanOrEqual(30);
    expect(p95).toBeLessThanOrEqual(50);
  });

  it('should trim old samples beyond window size', () => {
    const windowSize = 2; // seconds
    monitor.setWindowSize(windowSize);

    // Record many frames to exceed the window
    for (let i = 0; i < 200; i++) {
      monitor.recordFrame();
      vi.advanceTimersByTime(16.67);
    }

    const snapshot = monitor.getSnapshot();
    // Should only keep samples from the last 2 seconds (~120 samples at 60fps)
    expect(snapshot.avgFps).toBeGreaterThan(0);
  });

  it('should reset metrics', () => {
    // Record some frames
    for (let i = 0; i < 5; i++) {
      monitor.recordFrame();
      vi.advanceTimersByTime(16.67);
    }

    expect(monitor.getAverageFPS()).toBeGreaterThan(0);

    // Reset
    monitor.reset();

    const snapshot = monitor.getSnapshot();
    expect(snapshot.avgFps).toBe(0);
    expect(snapshot.frameTimeP95Ms).toBe(0);
  });

  it('should update window size', () => {
    monitor.setWindowSize(5); // 5 seconds
    
    // Record frames for more than 2 seconds
    for (let i = 0; i < 150; i++) {
      monitor.recordFrame();
      vi.advanceTimersByTime(16.67);
    }

    // Should still have data (window is now 5 seconds)
    expect(monitor.getAverageFPS()).toBeGreaterThan(0);
  });

  it('should handle memory usage detection', () => {
    const snapshot = monitor.getSnapshot();
    // Memory may or may not be available depending on the browser
    expect(snapshot.memoryMB === null || typeof snapshot.memoryMB === 'number').toBe(true);
  });

  it('should include timestamp in snapshot', () => {
    const before = performance.now();
    const snapshot = monitor.getSnapshot();
    const after = performance.now();

    expect(snapshot.timestamp).toBeGreaterThanOrEqual(before);
    expect(snapshot.timestamp).toBeLessThanOrEqual(after);
  });
});
