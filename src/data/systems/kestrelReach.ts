import type { StarSystem } from '@/models';
import { createPlanet, createStation, createStarSystem, vec2 } from '@/models';

/**
 * Kestrel Reach - A frontier system on the edge of settled space
 * 
 * The system features:
 * - A yellow-orange star (Kestrel)
 * - 3 planets: Ashara Prime (terrestrial), Veris Minor (ice), Thallos (gas giant)
 * - 3 stations: Nexus Trading Hub, Deepcore Mining Outpost, Waypoint Fuel Depot
 * - 1 jump gate (placeholder for future expansion)
 * 
 * Scale: Space is vast - stations and planets are spaced far apart to 
 * emphasize the "space is big and dangerous" atmosphere.
 */
export const KESTREL_REACH: StarSystem = createStarSystem({
  id: 'kestrel-reach',
  name: 'Kestrel Reach',
  description: 'A frontier system on the edge of settled space, known for its rich asteroid fields and as a waypoint for deep space expeditions.',
  star: {
    id: 'kestrel',
    name: 'Kestrel',
    color: '#FFB347',
    radius: 80,
  },
  planets: [
    createPlanet({
      id: 'ashara-prime',
      name: 'Ashara Prime',
      type: 'terrestrial',
      orbitRadius: 2000,  // Much farther from star
      orbitSpeed: 1.5,
      initialAngle: 45,
      radius: 45,
      color: '#4A90D9',
      description: 'A temperate world with scattered settlements. The primary population center of the system.',
    }),
    createPlanet({
      id: 'veris-minor',
      name: 'Veris Minor',
      type: 'ice-giant',
      orbitRadius: 4000,  // Much farther
      orbitSpeed: 0.8,
      initialAngle: 180,
      radius: 30,
      color: '#A8D8EA',
      description: 'A frozen dwarf planet rich in water ice, supporting several mining operations.',
    }),
    createPlanet({
      id: 'thallos',
      name: 'Thallos',
      type: 'gas-giant',
      orbitRadius: 6500,  // Much farther
      orbitSpeed: 0.4,
      initialAngle: 270,
      radius: 70,
      color: '#D4A574',
      description: 'A massive gas giant with swirling amber storms. Its moons host fuel harvesting operations.',
    }),
  ],
  stations: [
    createStation({
      id: 'nexus-hub',
      name: 'Nexus Trading Hub',
      type: 'trading-hub',
      position: vec2(1500, 900),  // Farther out, more spread
      services: ['refuel', 'repair', 'trade', 'missions', 'storage'],
      description: 'The commercial heart of Kestrel Reach. Merchants from across the sector gather here.',
      faction: 'Merchants Guild',
    }),
    createStation({
      id: 'deepcore-outpost',
      name: 'Deepcore Mining Outpost',
      type: 'mining-outpost',
      position: vec2(-2500, 1800),  // Much farther, different quadrant
      services: ['refuel', 'trade', 'storage'],
      description: 'A rugged mining station extracting valuable ores from nearby asteroid clusters.',
      faction: 'Deepcore Industries',
    }),
    createStation({
      id: 'waypoint-depot',
      name: 'Waypoint Fuel Depot',
      type: 'fuel-depot',
      position: vec2(800, -2500),  // Farther out, different quadrant
      services: ['refuel', 'repair'],
      description: 'An automated fuel depot serving vessels traveling to and from the outer system.',
      faction: 'Independent',
    }),
  ],
  jumpGates: [
    {
      id: 'gate-to-corvalis',
      name: 'Corvalis Gate',
      position: vec2(-4000, -3000),  // Much farther
      destinationSystemId: 'corvalis-cluster',
      destinationGateId: 'gate-from-kestrel',
    },
  ],
});

/**
 * Default spawn position for new games in Kestrel Reach
 * Near the Nexus Trading Hub but at a visible distance
 */
export const KESTREL_REACH_SPAWN = vec2(1000, 500);
