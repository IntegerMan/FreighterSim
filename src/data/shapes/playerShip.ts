/**
 * Player Ship Shape Definition - Serenity/Firefly-inspired
 * 
 * A mid-bulk transport vessel with a distinctive insect-like silhouette.
 * Features three engine mounts: center main engine and two side nacelles.
 * 
 * @module data/shapes/playerShip
 */

import type { Shape, EngineMount, ShipTemplate } from '@/models';

/**
 * Serenity-inspired player ship shape
 * 20 vertices forming the distinctive insect-like silhouette
 * Coordinates in normalized space (-1 to 1)
 * Nose points toward +Y (heading 0°)
 */
export const PLAYER_SHIP_SHAPE: Shape = {
  id: 'firefly-hull',
  name: 'Firefly-class Hull',
  vertices: [
    // Nose section
    { x: 0, y: 1.0 },           // Tip of nose
    { x: 0.15, y: 0.85 },       // Right nose edge
    { x: 0.2, y: 0.6 },         // Right forward fuselage
    
    // Right nacelle wing
    { x: 0.35, y: 0.4 },        // Wing leading edge
    { x: 0.8, y: 0.2 },         // Wing tip outer
    { x: 0.9, y: 0.0 },         // Nacelle front
    { x: 0.85, y: -0.3 },       // Nacelle side
    { x: 0.7, y: -0.5 },        // Nacelle back
    { x: 0.5, y: -0.45 },       // Wing trailing edge
    
    // Rear fuselage
    { x: 0.25, y: -0.6 },       // Right rear
    { x: 0.2, y: -0.9 },        // Right engine mount area
    { x: 0, y: -1.0 },          // Center rear (main engine)
    { x: -0.2, y: -0.9 },       // Left engine mount area
    { x: -0.25, y: -0.6 },      // Left rear
    
    // Left nacelle wing (mirrored)
    { x: -0.5, y: -0.45 },      // Wing trailing edge
    { x: -0.7, y: -0.5 },       // Nacelle back
    { x: -0.85, y: -0.3 },      // Nacelle side
    { x: -0.9, y: 0.0 },        // Nacelle front
    { x: -0.8, y: 0.2 },        // Wing tip outer
    { x: -0.35, y: 0.4 },       // Wing leading edge
    
    // Left nose (mirrored)
    { x: -0.2, y: 0.6 },        // Left forward fuselage
    { x: -0.15, y: 0.85 },      // Left nose edge
  ],
  boundingRadius: 1.05, // Slightly larger than 1 to account for nacelles
  centroid: { x: 0, y: -0.1 }, // Slightly rear of center due to nacelles
};

/**
 * Engine mounts for the player ship
 * Three engines: main center, port nacelle, starboard nacelle
 */
export const PLAYER_SHIP_ENGINES: EngineMount[] = [
  {
    name: 'main',
    position: { x: 0, y: -0.95 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 1.0,
  },
  {
    name: 'port',
    position: { x: -0.7, y: -0.5 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.7,
  },
  {
    name: 'starboard',
    position: { x: 0.7, y: -0.5 },
    direction: { x: 0, y: -1 },
    thrustMultiplier: 0.7,
  },
];

/**
 * Complete player ship template
 */
export const PLAYER_SHIP_TEMPLATE: ShipTemplate = {
  id: 'firefly',
  name: 'Firefly-class Transport',
  shape: PLAYER_SHIP_SHAPE,
  engineMounts: PLAYER_SHIP_ENGINES,
  defaultSize: 40,
  category: 'player',
  description: 'A mid-bulk transport, standard radion-accelerator core. Versatile and reliable.',
};
