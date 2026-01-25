/**
 * Performance monitoring utilities for tracking FPS, frame time, and memory usage.
 */

export interface PerformanceSnapshot {
  /** Current frames per second */
  fps: number;
  
  /** Average FPS over the monitoring window */
  avgFps: number;
  
  /** 95th percentile frame time in milliseconds */
  frameTimeP95Ms: number;
  
  /** Memory usage in megabytes (if available) */
  memoryMB: number | null;
  
  /** Timestamp of the snapshot */
  timestamp: number;
}

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private fpsHistory: number[] = [];
  private lastFrameTime = performance.now();
  private windowSizeMs: number;
  private maxSamples: number;

  constructor(windowSizeSec: number = 2) {
    this.windowSizeMs = windowSizeSec * 1000;
    // At 60fps, we'd get 120 samples in 2 seconds
    this.maxSamples = Math.ceil(windowSizeSec * 60);
  }

  /**
   * Records a frame and updates performance metrics.
   * Should be called once per frame.
   */
  recordFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // Record frame time
    this.frameTimes.push(frameTime);
    
    // Calculate instantaneous FPS
    const fps = frameTime > 0 ? 1000 / frameTime : 0;
    this.fpsHistory.push(fps);
    
    // Trim old samples
    while (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
    while (this.fpsHistory.length > this.maxSamples) {
      this.fpsHistory.shift();
    }
    
    this.lastFrameTime = now;
  }

  /**
   * Gets current performance metrics.
   */
  getSnapshot(): PerformanceSnapshot {
    const fps = this.getCurrentFPS();
    const avgFps = this.getAverageFPS();
    const frameTimeP95Ms = this.getFrameTimeP95();
    const memoryMB = this.getMemoryUsage();
    
    return {
      fps,
      avgFps,
      frameTimeP95Ms,
      memoryMB,
      timestamp: performance.now(),
    };
  }

  /**
   * Gets instantaneous FPS from the most recent frame.
   */
  getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory[this.fpsHistory.length - 1] ?? 0;
  }

  /**
   * Gets average FPS over the monitoring window.
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Gets 95th percentile frame time in milliseconds.
   */
  getFrameTimeP95(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }

  /**
   * Gets memory usage in megabytes (if available).
   */
  getMemoryUsage(): number | null {
    // Check if performance.memory is available (Chrome/Edge)
    interface PerformanceMemory {
      usedJSHeapSize: number;
    }
    interface PerformanceWithMemory extends Performance {
      memory?: PerformanceMemory;
    }
    
    const perf = performance as PerformanceWithMemory;
    if (perf.memory && 'usedJSHeapSize' in perf.memory) {
      return perf.memory.usedJSHeapSize / (1024 * 1024); // Convert bytes to MB
    }
    return null;
  }

  /**
   * Resets all collected metrics.
   */
  reset(): void {
    this.frameTimes = [];
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
  }

  /**
   * Updates the monitoring window size.
   */
  setWindowSize(windowSizeSec: number): void {
    this.windowSizeMs = windowSizeSec * 1000;
    this.maxSamples = Math.ceil(windowSizeSec * 60);
    this.reset();
  }

  /**
   * Gets the current window size in milliseconds.
   */
  getWindowSizeMs(): number {
    return this.windowSizeMs;
  }
}
