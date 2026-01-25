import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebGLContextLossHandler } from './contextLossHandler';
import { DEFAULT_PERFORMANCE_PROFILE } from '../../models/PerformanceProfile';

describe('WebGLContextLossHandler', () => {
  let canvas: HTMLCanvasElement;
  let handler: WebGLContextLossHandler;
  let onRecovery: () => Promise<void>;
  let onHalt: (reason: string) => void;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    onRecovery = vi.fn(() => Promise.resolve());
    onHalt = vi.fn();
    handler = new WebGLContextLossHandler(
      canvas,
      DEFAULT_PERFORMANCE_PROFILE,
      onRecovery,
      onHalt
    );
  });

  it('should start in active state', () => {
    const state = handler.getState();
    expect(state.state).toBe('active');
    expect(state.attemptCount).toBe(0);
    expect(state.lastLossTime).toBeNull();
  });

  it('should transition to recovering on context loss', () => {
    const event = new Event('webglcontextlost');
    canvas.dispatchEvent(event);

    const state = handler.getState();
    expect(state.state).toBe('recovering');
    expect(state.attemptCount).toBe(1);
    expect(state.lastLossTime).not.toBeNull();
  });

  it('should recover on context restored', async () => {
    // Lose context
    const lostEvent = new Event('webglcontextlost');
    canvas.dispatchEvent(lostEvent);

    // Restore context
    const restoredEvent = new Event('webglcontextrestored');
    canvas.dispatchEvent(restoredEvent);

    // Wait for async recovery
    await vi.waitFor(() => {
      expect(onRecovery).toHaveBeenCalled();
    });

    const state = handler.getState();
    expect(state.state).toBe('active');
  });

  it('should halt on repeated context loss within window', () => {
    vi.useFakeTimers();

    // First context loss
    const event1 = new Event('webglcontextlost');
    canvas.dispatchEvent(event1);

    // Restore
    const restored = new Event('webglcontextrestored');
    canvas.dispatchEvent(restored);

    // Advance time by 10 seconds (within 30s window)
    vi.advanceTimersByTime(10000);

    // Second context loss (within window)
    const event2 = new Event('webglcontextlost');
    canvas.dispatchEvent(event2);

    expect(onHalt).toHaveBeenCalled();
    const state = handler.getState();
    expect(state.state).toBe('halted');

    vi.useRealTimers();
  });

  it('should reset attempt count if loss occurs outside window', () => {
    vi.useFakeTimers();

    // First context loss
    const event1 = new Event('webglcontextlost');
    canvas.dispatchEvent(event1);

    // Restore
    const restored = new Event('webglcontextrestored');
    canvas.dispatchEvent(restored);

    // Advance time beyond window (35 seconds)
    vi.advanceTimersByTime(35000);

    // Second context loss (outside window)
    const event2 = new Event('webglcontextlost');
    canvas.dispatchEvent(event2);

    const state = handler.getState();
    expect(state.state).toBe('recovering');
    expect(state.attemptCount).toBe(1); // Reset

    vi.useRealTimers();
  });

  it('should halt after exhausting recovery attempts', () => {
    // Set recovery attempts to 1
    const profile = { ...DEFAULT_PERFORMANCE_PROFILE };
    profile.contextLossPolicy.autoRecoveryAttempts = 1;
    
    handler = new WebGLContextLossHandler(canvas, profile, onRecovery, onHalt);

    // First loss (attempt 1) - should recover
    const event1 = new Event('webglcontextlost');
    canvas.dispatchEvent(event1);
    expect(handler.getState().state).toBe('recovering');

    // Restore
    const restored = new Event('webglcontextrestored');
    canvas.dispatchEvent(restored);

    // Second loss (attempt 2) - should halt
    const event2 = new Event('webglcontextlost');
    canvas.dispatchEvent(event2);

    expect(onHalt).toHaveBeenCalled();
    expect(handler.getState().state).toBe('halted');
  });

  it('should handle recovery failure', async () => {
    onRecovery = vi.fn(() => Promise.reject(new Error('Recovery failed')));
    handler = new WebGLContextLossHandler(canvas, DEFAULT_PERFORMANCE_PROFILE, onRecovery, onHalt);

    // Lose context
    const lostEvent = new Event('webglcontextlost');
    canvas.dispatchEvent(lostEvent);

    // Attempt restore
    const restoredEvent = new Event('webglcontextrestored');
    canvas.dispatchEvent(restoredEvent);

    // Wait for async recovery failure
    await vi.waitFor(() => {
      expect(onHalt).toHaveBeenCalled();
    });

    const state = handler.getState();
    expect(state.state).toBe('halted');
  });

  it('should allow manual halt', () => {
    handler.halt('Manual shutdown');
    
    expect(onHalt).toHaveBeenCalledWith('Manual shutdown');
    expect(handler.getState().state).toBe('halted');
  });
});
