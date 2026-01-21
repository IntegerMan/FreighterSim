import type { Vector2 } from './math';

/**
 * Types of celestial bodies
 */
export type PlanetType = 'terrestrial' | 'gas-giant' | 'ice-giant' | 'dwarf' | 'moon';

/**
 * A planet or moon in a star system
 */
export interface Planet {
  id: string;
  name: string;
  type: PlanetType;
  position: Vector2;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number; // degrees per second
  orbitAngle: number; // current angle in degrees
  color: string;
  description?: string;
  isScannable: boolean;
}

/**
 * Create a planet with orbital mechanics
 */
export function createPlanet(config: {
  id: string;
  name: string;
  type: PlanetType;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle?: number;
  radius?: number;
  color?: string;
  description?: string;
}): Planet {
  const angle = config.initialAngle ?? Math.random() * 360;
  const radians = angle * (Math.PI / 180);
  
  return {
    id: config.id,
    name: config.name,
    type: config.type,
    orbitRadius: config.orbitRadius,
    orbitSpeed: config.orbitSpeed,
    orbitAngle: angle,
    radius: config.radius ?? 20,
    color: config.color ?? '#888888',
    description: config.description,
    isScannable: true,
    position: {
      x: Math.cos(radians) * config.orbitRadius,
      y: Math.sin(radians) * config.orbitRadius,
    },
  };
}

/**
 * Update a planet's position based on orbital mechanics
 */
export function updatePlanetOrbit(planet: Planet, deltaTime: number): Planet {
  const newAngle = (planet.orbitAngle + planet.orbitSpeed * deltaTime) % 360;
  const radians = newAngle * (Math.PI / 180);
  
  return {
    ...planet,
    orbitAngle: newAngle,
    position: {
      x: Math.cos(radians) * planet.orbitRadius,
      y: Math.sin(radians) * planet.orbitRadius,
    },
  };
}
