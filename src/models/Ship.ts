import type { Vector2 } from './math';

/**
 * Ship status for various systems
 */
export type SystemStatus = 'nominal' | 'damaged' | 'critical' | 'offline';

/**
 * Player ship state
 */
export interface Ship {
  name: string;
  position: Vector2;
  heading: number;
  targetHeading: number;
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  turnRate: number; // degrees per second
  acceleration: number; // units per second squared
}

/**
 * Default ship configuration
 */
export const DEFAULT_SHIP: Ship = {
  name: 'Freighter',
  position: { x: 0, y: 0 },
  heading: 0,
  targetHeading: 0,
  speed: 0,
  targetSpeed: 0,
  maxSpeed: 100,
  turnRate: 45,
  acceleration: 20,
};

/**
 * Create a ship with custom configuration
 */
export function createShip(config: Partial<Ship> = {}): Ship {
  return {
    ...DEFAULT_SHIP,
    ...config,
  };
}
