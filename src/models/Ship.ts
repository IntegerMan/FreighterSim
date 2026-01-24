import type { Vector2 } from './math';
import type { CargoBay } from './CargoBay';
import { DEFAULT_CARGO_BAY } from './CargoBay';

/**
 * Ship status for various systems
 */
export type SystemStatus = 'nominal' | 'damaged' | 'critical' | 'offline';

/**
 * Ship engine subsystem - controls propulsion and maneuvering
 */
export interface ShipEngines {
  turnRate: number;      // degrees per second
  acceleration: number;  // units per second squared
  maxSpeed: number;      // maximum forward speed
}

/**
 * Ship sensor subsystem - controls detection and radar capabilities
 */
export interface ShipSensors {
  range: number;              // maximum detection range
  segmentCount: number;       // radar fidelity (number of angular segments)
}

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINES: ShipEngines = {
  turnRate: 45,
  acceleration: 20,
  maxSpeed: 100,
};

/**
 * Default sensor configuration
 */
export const DEFAULT_SENSORS: ShipSensors = {
  range: 2000,
  segmentCount: 36,
};

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
  engines: ShipEngines;
  sensors: ShipSensors;
  cargoBay: CargoBay;
  /** Ship template ID for 2D shape rendering (optional for backward compatibility) */
  templateId?: string;
  /** Ship size in world units for rendering (optional, uses template default if not specified) */
  size?: number;
  /** Ship's docking port position relative to ship center ('nose' or 'port' or 'starboard') */
  dockingPortLocation?: 'nose' | 'port' | 'starboard';
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
  engines: { ...DEFAULT_ENGINES },
  sensors: { ...DEFAULT_SENSORS },
  cargoBay: { ...DEFAULT_CARGO_BAY },
  templateId: 'firefly', // Player ship uses Serenity-inspired template
  size: 40, // Default player ship size in world units
  dockingPortLocation: 'nose', // Ship's docking port is at the nose
};

/**
 * Create a ship with custom configuration
 */
export function createShip(config: Partial<Ship> = {}): Ship {
  return {
    ...DEFAULT_SHIP,
    ...config,
    engines: { ...DEFAULT_ENGINES, ...config.engines },
    sensors: { ...DEFAULT_SENSORS, ...config.sensors },
    cargoBay: { ...DEFAULT_CARGO_BAY, ...config.cargoBay, items: [...(config.cargoBay?.items ?? [])] },
  };
}
