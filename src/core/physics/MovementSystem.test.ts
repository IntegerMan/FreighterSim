import { describe, it, expect } from 'vitest';
import { updateMovement, calculateStoppingDistance, calculateTimeToStop } from './MovementSystem';
import type { MovementState } from './MovementSystem';

describe('MovementSystem', () => {
  const createDefaultState = (overrides: Partial<MovementState> = {}): MovementState => ({
    position: { x: 0, y: 0 },
    heading: 0,
    targetHeading: 0,
    speed: 0,
    targetSpeed: 0,
    maxSpeed: 100,
    turnRate: 45,
    acceleration: 20,
    ...overrides,
  });

  describe('updateMovement', () => {
    it('should not move when speed is 0', () => {
      const state = createDefaultState({ speed: 0 });
      const result = updateMovement(state, 1);

      expect(result.position.x).toBe(0);
      expect(result.position.y).toBe(0);
    });

    it('should move in the direction of heading', () => {
      const state = createDefaultState({
        heading: 0, // North (0° = +Y in this coordinate system)
        speed: 100,
        targetSpeed: 100,
      });
      const result = updateMovement(state, 1);

      expect(result.position.x).toBeCloseTo(0, 1);
      expect(result.position.y).toBeCloseTo(100, 1);
    });

    it('should move east when heading is 90 degrees', () => {
      // 0° = North (+Y), 90° = East (+X)
      const state = createDefaultState({
        heading: 90,
        targetHeading: 90, // Must match to prevent turning
        speed: 100,
        targetSpeed: 100,
      });
      const result = updateMovement(state, 1);

      expect(result.position.x).toBeCloseTo(100, 1);
      expect(result.position.y).toBeCloseTo(0, 1);
    });

    it('should accelerate towards target speed', () => {
      const state = createDefaultState({
        speed: 0,
        targetSpeed: 100,
        acceleration: 20,
      });
      const result = updateMovement(state, 1);

      expect(result.speed).toBe(20);
    });

    it('should decelerate towards target speed', () => {
      const state = createDefaultState({
        speed: 100,
        targetSpeed: 0,
        acceleration: 20,
      });
      const result = updateMovement(state, 1);

      expect(result.speed).toBe(80);
    });

    it('should not exceed max speed', () => {
      const state = createDefaultState({
        speed: 90,
        targetSpeed: 200,
        maxSpeed: 100,
        acceleration: 20,
      });
      const result = updateMovement(state, 1);

      expect(result.speed).toBe(100);
    });

    it('should turn towards target heading', () => {
      const state = createDefaultState({
        heading: 0,
        targetHeading: 90,
        turnRate: 45,
      });
      const result = updateMovement(state, 1);

      expect(result.heading).toBe(45);
    });

    it('should turn the shortest direction', () => {
      const state = createDefaultState({
        heading: 350,
        targetHeading: 30, // 40° difference, more than turnRate of 45
        turnRate: 25,      // Reduced so we don't reach target in one step
      });
      const result = updateMovement(state, 1);

      // Should turn right (clockwise through 0), not left
      // 350 + 25 = 375 → 15 (normalized)
      expect(result.heading).toBeCloseTo(15, 1);
    });

    it('should reach target heading exactly', () => {
      const state = createDefaultState({
        heading: 80,
        targetHeading: 90,
        turnRate: 45,
      });
      const result = updateMovement(state, 1);

      expect(result.heading).toBe(90);
    });

    it('should scale movement by delta time', () => {
      const state = createDefaultState({
        heading: 0, // North = +Y direction
        speed: 100,
        targetSpeed: 100,
      });
      const result = updateMovement(state, 0.5);

      // At 0.5s, should move 50 units in +Y direction
      expect(result.position.y).toBeCloseTo(50, 1);
    });
  });

  describe('calculateStoppingDistance', () => {
    it('should return 0 when speed is 0', () => {
      expect(calculateStoppingDistance(0, 20)).toBe(0);
    });

    it('should calculate correct stopping distance', () => {
      // At 100 units/s with 20 units/s² deceleration
      // s = v² / (2a) = 10000 / 40 = 250
      expect(calculateStoppingDistance(100, 20)).toBe(250);
    });

    it('should return Infinity when deceleration is 0', () => {
      expect(calculateStoppingDistance(100, 0)).toBe(Infinity);
    });
  });

  describe('calculateTimeToStop', () => {
    it('should return 0 when speed is 0', () => {
      expect(calculateTimeToStop(0, 20)).toBe(0);
    });

    it('should calculate correct time to stop', () => {
      // At 100 units/s with 20 units/s² deceleration
      // t = v / a = 100 / 20 = 5
      expect(calculateTimeToStop(100, 20)).toBe(5);
    });

    it('should return Infinity when deceleration is 0', () => {
      expect(calculateTimeToStop(100, 0)).toBe(Infinity);
    });
  });
});
