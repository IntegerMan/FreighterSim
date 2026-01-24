/**
 * NPC Ship Shape Definitions
 * 
 * Various ship types encountered in the game world:
 * - Freighter: Boxy cargo hauler
 * - Cutter: Sleek patrol vessel  
 * - Cruiser: Military patrol ship
 * - Destroyer: Heavy military vessel
 * - Liner: Passenger transport
 * 
 * @module data/shapes/npcShips
 */

import type { Shape, EngineMount, ShipTemplate } from '@/models';

// =============================================================================
// Freighter - Boxy cargo hauler (16 vertices)
// =============================================================================

export const FREIGHTER_SHAPE: Shape = {
  id: 'freighter-hull',
  name: 'Bulk Freighter Hull',
  vertices: [
    // Front cargo section
    { x: -0.4, y: 0.9 },
    { x: 0.4, y: 0.9 },
    { x: 0.5, y: 0.7 },
    { x: 0.5, y: 0.3 },
    
    // Mid cargo section (wider)
    { x: 0.7, y: 0.2 },
    { x: 0.7, y: -0.3 },
    { x: 0.6, y: -0.5 },
    
    // Rear engine section
    { x: 0.5, y: -0.8 },
    { x: 0.3, y: -0.95 },
    { x: -0.3, y: -0.95 },
    { x: -0.5, y: -0.8 },
    
    // Left side (mirrored)
    { x: -0.6, y: -0.5 },
    { x: -0.7, y: -0.3 },
    { x: -0.7, y: 0.2 },
    { x: -0.5, y: 0.3 },
    { x: -0.5, y: 0.7 },
  ],
  boundingRadius: 0.95,
  centroid: { x: 0, y: -0.05 },
};

export const FREIGHTER_ENGINES: EngineMount[] = [
  {
    name: 'main',
    position: { x: 0, y: -0.9 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 1.0,
  },
  {
    name: 'port',
    position: { x: -0.4, y: -0.85 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.5,
  },
  {
    name: 'starboard',
    position: { x: 0.4, y: -0.85 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.5,
  },
];

export const FREIGHTER_TEMPLATE: ShipTemplate = {
  id: 'freighter',
  name: 'Bulk Freighter',
  shape: FREIGHTER_SHAPE,
  engineMounts: FREIGHTER_ENGINES,
  defaultSize: 50,
  category: 'freighter',
  description: 'A workhorse of interstellar commerce. Slow but capacious.',
};

// =============================================================================
// Cutter - Sleek patrol vessel (12 vertices)
// =============================================================================

export const CUTTER_SHAPE: Shape = {
  id: 'cutter-hull',
  name: 'Patrol Cutter Hull',
  vertices: [
    // Sharp nose
    { x: 0, y: 1.0 },
    { x: 0.25, y: 0.5 },
    
    // Wing section
    { x: 0.6, y: 0.1 },
    { x: 0.7, y: -0.2 },
    { x: 0.5, y: -0.5 },
    
    // Rear
    { x: 0.3, y: -0.9 },
    { x: -0.3, y: -0.9 },
    
    // Left wing (mirrored)
    { x: -0.5, y: -0.5 },
    { x: -0.7, y: -0.2 },
    { x: -0.6, y: 0.1 },
    { x: -0.25, y: 0.5 },
  ],
  boundingRadius: 0.85,
  centroid: { x: 0, y: -0.15 },
};

export const CUTTER_ENGINES: EngineMount[] = [
  {
    name: 'main',
    position: { x: 0, y: -0.85 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 1.2, // Faster than average
  },
];

export const CUTTER_TEMPLATE: ShipTemplate = {
  id: 'cutter',
  name: 'Patrol Cutter',
  shape: CUTTER_SHAPE,
  engineMounts: CUTTER_ENGINES,
  defaultSize: 25,
  category: 'patrol',
  description: 'Fast and maneuverable patrol vessel. Common in shipping lanes.',
};

// =============================================================================
// Cruiser - Military patrol ship (20 vertices)
// =============================================================================

export const CRUISER_SHAPE: Shape = {
  id: 'cruiser-hull',
  name: 'Light Cruiser Hull',
  vertices: [
    // Command section (elongated nose)
    { x: 0, y: 1.0 },
    { x: 0.15, y: 0.85 },
    { x: 0.2, y: 0.6 },
    { x: 0.2, y: 0.3 },
    
    // Weapon pods
    { x: 0.4, y: 0.2 },
    { x: 0.5, y: 0.0 },
    { x: 0.5, y: -0.2 },
    { x: 0.4, y: -0.4 },
    
    // Engine section
    { x: 0.35, y: -0.6 },
    { x: 0.4, y: -0.9 },
    { x: 0.2, y: -1.0 },
    { x: -0.2, y: -1.0 },
    { x: -0.4, y: -0.9 },
    { x: -0.35, y: -0.6 },
    
    // Left weapon pods (mirrored)
    { x: -0.4, y: -0.4 },
    { x: -0.5, y: -0.2 },
    { x: -0.5, y: 0.0 },
    { x: -0.4, y: 0.2 },
    { x: -0.2, y: 0.3 },
    { x: -0.2, y: 0.6 },
    { x: -0.15, y: 0.85 },
  ],
  boundingRadius: 1.0,
  centroid: { x: 0, y: -0.1 },
};

export const CRUISER_ENGINES: EngineMount[] = [
  {
    name: 'main',
    position: { x: 0, y: -0.95 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 1.0,
  },
  {
    name: 'port',
    position: { x: -0.35, y: -0.85 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.6,
  },
  {
    name: 'starboard',
    position: { x: 0.35, y: -0.85 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.6,
  },
];

export const CRUISER_TEMPLATE: ShipTemplate = {
  id: 'cruiser',
  name: 'Light Cruiser',
  shape: CRUISER_SHAPE,
  engineMounts: CRUISER_ENGINES,
  defaultSize: 45,
  category: 'military',
  description: 'Military patrol vessel. Well-armed and moderately fast.',
};

// =============================================================================
// Destroyer - Wedge-shaped military vessel (24 vertices)
// =============================================================================

export const DESTROYER_SHAPE: Shape = {
  id: 'destroyer-hull',
  name: 'Destroyer Hull',
  vertices: [
    // Sharp wedge nose
    { x: 0, y: 1.0 },
    { x: 0.1, y: 0.8 },
    { x: 0.2, y: 0.6 },
    
    // Right hull expansion
    { x: 0.4, y: 0.4 },
    { x: 0.6, y: 0.2 },
    { x: 0.8, y: 0.0 },
    { x: 0.9, y: -0.2 },
    
    // Right fin
    { x: 0.95, y: -0.4 },
    { x: 0.85, y: -0.6 },
    { x: 0.7, y: -0.7 },
    
    // Engine block
    { x: 0.5, y: -0.8 },
    { x: 0.4, y: -0.95 },
    { x: 0.15, y: -1.0 },
    { x: -0.15, y: -1.0 },
    { x: -0.4, y: -0.95 },
    { x: -0.5, y: -0.8 },
    
    // Left fin
    { x: -0.7, y: -0.7 },
    { x: -0.85, y: -0.6 },
    { x: -0.95, y: -0.4 },
    
    // Left hull (mirrored)
    { x: -0.9, y: -0.2 },
    { x: -0.8, y: 0.0 },
    { x: -0.6, y: 0.2 },
    { x: -0.4, y: 0.4 },
    { x: -0.2, y: 0.6 },
    { x: -0.1, y: 0.8 },
  ],
  boundingRadius: 1.05,
  centroid: { x: 0, y: -0.2 },
};

export const DESTROYER_ENGINES: EngineMount[] = [
  {
    name: 'main-center',
    position: { x: 0, y: -0.95 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 1.2,
  },
  {
    name: 'main-port',
    position: { x: -0.3, y: -0.9 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.8,
  },
  {
    name: 'main-starboard',
    position: { x: 0.3, y: -0.9 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.8,
  },
  {
    name: 'aux-port',
    position: { x: -0.6, y: -0.75 },
    direction: { x: -0.2, y: -1 },
    thrustMultiplier: 0.4,
  },
  {
    name: 'aux-starboard',
    position: { x: 0.6, y: -0.75 },
    direction: { x: 0.2, y: -1 },
    thrustMultiplier: 0.4,
  },
];

export const DESTROYER_TEMPLATE: ShipTemplate = {
  id: 'destroyer',
  name: 'Destroyer',
  shape: DESTROYER_SHAPE,
  engineMounts: DESTROYER_ENGINES,
  defaultSize: 60,
  category: 'military',
  description: 'Heavy military vessel. Powerful engines and significant armament.',
};

// =============================================================================
// Liner - Passenger transport (20 vertices)
// =============================================================================

export const LINER_SHAPE: Shape = {
  id: 'liner-hull',
  name: 'Passenger Liner Hull',
  vertices: [
    // Rounded nose
    { x: 0, y: 1.0 },
    { x: 0.2, y: 0.95 },
    { x: 0.35, y: 0.8 },
    { x: 0.4, y: 0.6 },
    
    // Passenger section (smooth curves)
    { x: 0.45, y: 0.4 },
    { x: 0.5, y: 0.1 },
    { x: 0.5, y: -0.2 },
    { x: 0.45, y: -0.5 },
    
    // Engine section
    { x: 0.4, y: -0.7 },
    { x: 0.35, y: -0.9 },
    { x: 0.2, y: -1.0 },
    { x: -0.2, y: -1.0 },
    { x: -0.35, y: -0.9 },
    { x: -0.4, y: -0.7 },
    
    // Left passenger section (mirrored)
    { x: -0.45, y: -0.5 },
    { x: -0.5, y: -0.2 },
    { x: -0.5, y: 0.1 },
    { x: -0.45, y: 0.4 },
    { x: -0.4, y: 0.6 },
    { x: -0.35, y: 0.8 },
    { x: -0.2, y: 0.95 },
  ],
  boundingRadius: 1.0,
  centroid: { x: 0, y: -0.05 },
};

export const LINER_ENGINES: EngineMount[] = [
  {
    name: 'main',
    position: { x: 0, y: -0.95 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.8, // Slower, but smooth
  },
  {
    name: 'port',
    position: { x: -0.25, y: -0.9 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.6,
  },
  {
    name: 'starboard',
    position: { x: 0.25, y: -0.9 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.6,
  },
];

export const LINER_TEMPLATE: ShipTemplate = {
  id: 'liner',
  name: 'Passenger Liner',
  shape: LINER_SHAPE,
  engineMounts: LINER_ENGINES,
  defaultSize: 55,
  category: 'passenger',
  description: 'Luxury passenger transport. Smooth ride, adequate speed.',
};

// =============================================================================
// Export all NPC templates
// =============================================================================

export const NPC_SHIP_TEMPLATES: ShipTemplate[] = [
  FREIGHTER_TEMPLATE,
  CUTTER_TEMPLATE,
  CRUISER_TEMPLATE,
  DESTROYER_TEMPLATE,
  LINER_TEMPLATE,
];
