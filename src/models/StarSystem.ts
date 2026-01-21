import type { Vector2 } from './math';
import type { Planet } from './Planet';
import type { Station } from './Station';

/**
 * A star at the center of a system
 */
export interface Star {
  id: string;
  name: string;
  color: string;
  radius: number;
}

/**
 * A jump gate connecting to another system
 */
export interface JumpGate {
  id: string;
  name: string;
  position: Vector2;
  destinationSystemId: string;
  destinationGateId: string;
}

/**
 * A complete star system
 */
export interface StarSystem {
  id: string;
  name: string;
  description: string;
  star: Star;
  planets: Planet[];
  stations: Station[];
  jumpGates: JumpGate[];
}

/**
 * Create a star system with default structure
 */
export function createStarSystem(config: {
  id: string;
  name: string;
  description: string;
  star: Star;
  planets?: Planet[];
  stations?: Station[];
  jumpGates?: JumpGate[];
}): StarSystem {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    star: config.star,
    planets: config.planets ?? [],
    stations: config.stations ?? [],
    jumpGates: config.jumpGates ?? [],
  };
}
