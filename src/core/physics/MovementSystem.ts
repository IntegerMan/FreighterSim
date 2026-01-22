import type { Vector2 } from '@/models';
import { vec2FromAngle, vec2Add, moveTowards, moveTowardsAngle } from '@/models';

/**
 * Ship movement state for physics calculations
 */
export interface MovementState {
  position: Vector2;
  heading: number;
  targetHeading: number;
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  turnRate: number;
  acceleration: number;
}

/**
 * Result of a movement update
 */
export interface MovementResult {
  position: Vector2;
  heading: number;
  speed: number;
}

/**
 * Update ship movement based on current state and delta time
 * 
 * @param state - Current movement state
 * @param deltaTime - Time elapsed in seconds
 * @returns Updated position, heading, and speed
 */
export function updateMovement(state: MovementState, deltaTime: number): MovementResult {
  // Update heading towards target
  const newHeading = moveTowardsAngle(
    state.heading,
    state.targetHeading,
    state.turnRate * deltaTime
  );

  // Update speed towards target (allow negative for reverse)
  const clampedTarget = Math.max(-state.maxSpeed * 0.25, Math.min(state.targetSpeed, state.maxSpeed));
  const newSpeed = moveTowards(
    state.speed,
    clampedTarget,
    state.acceleration * deltaTime
  );

  // Calculate velocity vector from heading and speed
  // When speed is negative, ship moves in opposite direction
  const velocity = vec2FromAngle(newHeading, newSpeed);

  // Update position
  const newPosition = vec2Add(state.position, {
    x: velocity.x * deltaTime,
    y: velocity.y * deltaTime,
  });

  return {
    position: newPosition,
    heading: newHeading,
    speed: newSpeed,
  };
}

/**
 * Calculate stopping distance at current speed with given deceleration
 */
export function calculateStoppingDistance(speed: number, deceleration: number): number {
  if (deceleration <= 0) return Infinity;
  // Using kinematic equation: v² = u² + 2as, solving for s when v = 0
  return (speed * speed) / (2 * deceleration);
}

/**
 * Calculate time to stop at current speed with given deceleration
 */
export function calculateTimeToStop(speed: number, deceleration: number): number {
  if (deceleration <= 0) return Infinity;
  return speed / deceleration;
}

/**
 * Calculate time to reach a target position at current speed
 */
export function calculateTimeToReach(distance: number, speed: number): number {
  if (speed <= 0) return Infinity;
  return distance / speed;
}
