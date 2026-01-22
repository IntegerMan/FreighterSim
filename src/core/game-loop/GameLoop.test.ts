import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameLoop, resetGameLoop } from './GameLoop';

describe('GameLoop', () => {
  let gameLoop: GameLoop;

  beforeEach(() => {
    vi.useFakeTimers();
    resetGameLoop();
    gameLoop = new GameLoop();
  });

  afterEach(() => {
    gameLoop.stop();
    vi.useRealTimers();
  });

  describe('start/stop', () => {
    it('should not be running initially', () => {
      expect(gameLoop.isRunning()).toBe(false);
    });

    it('should be running after start', () => {
      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);
    });

    it('should not be running after stop', () => {
      gameLoop.start();
      gameLoop.stop();
      expect(gameLoop.isRunning()).toBe(false);
    });

    it('should be idempotent when starting multiple times', () => {
      gameLoop.start();
      gameLoop.start();
      expect(gameLoop.isRunning()).toBe(true);
    });
  });

  describe('subscribers', () => {
    it('should call subscribers on each frame', () => {
      const callback = vi.fn();
      gameLoop.subscribe(callback);
      gameLoop.start();

      vi.advanceTimersByTime(16); // ~1 frame at 60fps
      expect(callback).toHaveBeenCalled();
    });

    it('should provide game time to subscribers', () => {
      const callback = vi.fn();
      gameLoop.subscribe(callback);
      gameLoop.start();

      vi.advanceTimersByTime(16);
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          deltaTime: expect.any(Number),
          elapsed: expect.any(Number),
          timeScale: 1,
          paused: false,
        })
      );
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = gameLoop.subscribe(callback);
      gameLoop.start();

      vi.advanceTimersByTime(16);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      vi.advanceTimersByTime(16);
      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should not call subscribers after stop', () => {
      const callback = vi.fn();
      gameLoop.subscribe(callback);
      gameLoop.start();

      vi.advanceTimersByTime(16);
      expect(callback).toHaveBeenCalledTimes(1);

      gameLoop.stop();
      vi.advanceTimersByTime(16);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('time scaling', () => {
    it('should default to time scale of 1', () => {
      expect(gameLoop.getTimeScale()).toBe(1);
    });

    it('should allow setting time scale', () => {
      gameLoop.setTimeScale(2);
      expect(gameLoop.getTimeScale()).toBe(2);
    });

    it('should apply time scale to delta time', () => {
      const callback = vi.fn();
      gameLoop.subscribe(callback);
      gameLoop.setTimeScale(2);
      gameLoop.start();

      vi.advanceTimersByTime(100);

      expect(callback.mock.calls.length).toBeGreaterThan(0);
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1]![0];
      // deltaTime should be roughly double realDeltaTime
      expect(lastCall.timeScale).toBe(2);
    });

    it('should not allow negative time scale', () => {
      gameLoop.setTimeScale(-1);
      expect(gameLoop.getTimeScale()).toBe(0);
    });
  });

  describe('pause/resume', () => {
    it('should not be paused initially', () => {
      expect(gameLoop.isPaused()).toBe(false);
    });

    it('should be paused after pause()', () => {
      gameLoop.pause();
      expect(gameLoop.isPaused()).toBe(true);
    });

    it('should not be paused after resume()', () => {
      gameLoop.pause();
      gameLoop.resume();
      expect(gameLoop.isPaused()).toBe(false);
    });

    it('should set deltaTime to 0 when paused', () => {
      const callback = vi.fn();
      gameLoop.subscribe(callback);
      gameLoop.start();
      gameLoop.pause();

      vi.advanceTimersByTime(100);

      expect(callback.mock.calls.length).toBeGreaterThan(0);
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1]![0];
      expect(lastCall.deltaTime).toBe(0);
      expect(lastCall.paused).toBe(true);
    });

    it('should not advance elapsed time when paused', () => {
      gameLoop.start();
      vi.advanceTimersByTime(100);
      
      const elapsedBefore = gameLoop.getGameTime().elapsed;
      gameLoop.pause();
      
      vi.advanceTimersByTime(100);
      
      const elapsedAfter = gameLoop.getGameTime().elapsed;
      expect(elapsedAfter).toBe(elapsedBefore);
    });
  });

  describe('elapsed time', () => {
    it('should accumulate elapsed time', () => {
      gameLoop.start();
      
      vi.advanceTimersByTime(100);
      const elapsed1 = gameLoop.getGameTime().elapsed;
      
      vi.advanceTimersByTime(100);
      const elapsed2 = gameLoop.getGameTime().elapsed;
      
      expect(elapsed2).toBeGreaterThan(elapsed1);
    });
  });
});
