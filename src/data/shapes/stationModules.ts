/**
 * Station Module Shape Definitions
 * 
 * Modular building blocks for station composition:
 * - Core: Central hub of the station
 * - Docking Ring: Circular module with docking ports
 * - Habitat: Living quarters module
 * - Cargo: Storage module
 * - Solar Array: Power generation
 * - Antenna: Communications array
 * - Refinery: Ore processing
 * - Command: Station control center
 * 
 * @module data/shapes/stationModules
 */

import type { Shape, DockingPort } from '@/models';
import type { StationModule, StationModuleType } from '@/models';

// =============================================================================
// Core Module - Central hub
// =============================================================================

export const CORE_SHAPE: Shape = {
  id: 'station-core',
  name: 'Station Core',
  vertices: [
    // Octagonal shape
    { x: 0.4, y: 1.0 },
    { x: 1.0, y: 0.4 },
    { x: 1.0, y: -0.4 },
    { x: 0.4, y: -1.0 },
    { x: -0.4, y: -1.0 },
    { x: -1.0, y: -0.4 },
    { x: -1.0, y: 0.4 },
    { x: -0.4, y: 1.0 },
  ],
  boundingRadius: 1.05,
  centroid: { x: 0, y: 0 },
};

export const CORE_MODULE: StationModule = {
  type: 'core',
  shape: CORE_SHAPE,
  connectionPoints: [
    { x: 0, y: 1.0 },   // Top
    { x: 1.0, y: 0 },   // Right
    { x: 0, y: -1.0 },  // Bottom
    { x: -1.0, y: 0 },  // Left
  ],
};

// =============================================================================
// Docking Ring Module
// =============================================================================

export const DOCKING_RING_SHAPE: Shape = {
  id: 'docking-ring',
  name: 'Docking Ring',
  vertices: [
    // Ring shape (12-sided for roundness)
    { x: 0.5, y: 1.0 },
    { x: 0.87, y: 0.87 },
    { x: 1.0, y: 0.5 },
    { x: 1.0, y: -0.5 },
    { x: 0.87, y: -0.87 },
    { x: 0.5, y: -1.0 },
    { x: -0.5, y: -1.0 },
    { x: -0.87, y: -0.87 },
    { x: -1.0, y: -0.5 },
    { x: -1.0, y: 0.5 },
    { x: -0.87, y: 0.87 },
    { x: -0.5, y: 1.0 },
  ],
  boundingRadius: 1.1,
  centroid: { x: 0, y: 0 },
};

const DOCKING_RING_PORTS: DockingPort[] = [
  {
    id: 'dock-top',
    position: { x: 0, y: 1.0 },
    approachVector: { x: 0, y: 1 },
    size: 'medium',
    alignmentTolerance: 15,
    dockingRange: 30,
  },
  {
    id: 'dock-right',
    position: { x: 1.0, y: 0 },
    approachVector: { x: 1, y: 0 },
    size: 'medium',
    alignmentTolerance: 15,
    dockingRange: 30,
  },
  {
    id: 'dock-bottom',
    position: { x: 0, y: -1.0 },
    approachVector: { x: 0, y: -1 },
    size: 'medium',
    alignmentTolerance: 15,
    dockingRange: 30,
  },
  {
    id: 'dock-left',
    position: { x: -1.0, y: 0 },
    approachVector: { x: -1, y: 0 },
    size: 'medium',
    alignmentTolerance: 15,
    dockingRange: 30,
  },
];

export const DOCKING_RING_MODULE: StationModule = {
  type: 'docking-ring',
  shape: DOCKING_RING_SHAPE,
  connectionPoints: [
    { x: 0, y: 0 }, // Center connection to core
  ],
  dockingPorts: DOCKING_RING_PORTS,
};

// =============================================================================
// Habitat Module - Living quarters
// =============================================================================

export const HABITAT_SHAPE: Shape = {
  id: 'habitat',
  name: 'Habitat Module',
  vertices: [
    // Cylindrical-ish shape
    { x: -0.3, y: 1.0 },
    { x: 0.3, y: 1.0 },
    { x: 0.5, y: 0.8 },
    { x: 0.6, y: 0.4 },
    { x: 0.6, y: -0.4 },
    { x: 0.5, y: -0.8 },
    { x: 0.3, y: -1.0 },
    { x: -0.3, y: -1.0 },
    { x: -0.5, y: -0.8 },
    { x: -0.6, y: -0.4 },
    { x: -0.6, y: 0.4 },
    { x: -0.5, y: 0.8 },
  ],
  boundingRadius: 1.0,
  centroid: { x: 0, y: 0 },
};

export const HABITAT_MODULE: StationModule = {
  type: 'habitat',
  shape: HABITAT_SHAPE,
  connectionPoints: [
    { x: 0, y: 1.0 },   // Top
    { x: 0, y: -1.0 },  // Bottom
  ],
};

// =============================================================================
// Cargo Module - Storage
// =============================================================================

export const CARGO_SHAPE: Shape = {
  id: 'cargo',
  name: 'Cargo Module',
  vertices: [
    // Boxy storage container
    { x: -0.8, y: 0.8 },
    { x: 0.8, y: 0.8 },
    { x: 0.9, y: 0.6 },
    { x: 0.9, y: -0.6 },
    { x: 0.8, y: -0.8 },
    { x: -0.8, y: -0.8 },
    { x: -0.9, y: -0.6 },
    { x: -0.9, y: 0.6 },
  ],
  boundingRadius: 1.0,
  centroid: { x: 0, y: 0 },
};

export const CARGO_MODULE: StationModule = {
  type: 'cargo',
  shape: CARGO_SHAPE,
  connectionPoints: [
    { x: 0, y: 0.8 },   // Top
    { x: 0, y: -0.8 },  // Bottom
  ],
};

// =============================================================================
// Solar Array Module - Power generation
// =============================================================================

export const SOLAR_ARRAY_SHAPE: Shape = {
  id: 'solar-array',
  name: 'Solar Array',
  vertices: [
    // Long rectangular panel with mounting
    { x: -0.15, y: 0.2 },
    { x: 0.15, y: 0.2 },
    { x: 0.15, y: 0.0 },
    { x: 1.0, y: 0.0 },
    { x: 1.0, y: -0.6 },
    { x: 0.15, y: -0.6 },
    { x: 0.15, y: -0.8 },
    { x: -0.15, y: -0.8 },
    { x: -0.15, y: -0.6 },
    { x: -1.0, y: -0.6 },
    { x: -1.0, y: 0.0 },
    { x: -0.15, y: 0.0 },
  ],
  boundingRadius: 1.1,
  centroid: { x: 0, y: -0.3 },
};

export const SOLAR_ARRAY_MODULE: StationModule = {
  type: 'solar-array',
  shape: SOLAR_ARRAY_SHAPE,
  connectionPoints: [
    { x: 0, y: 0.2 }, // Mounting point
  ],
};

// =============================================================================
// Antenna Module - Communications
// =============================================================================

export const ANTENNA_SHAPE: Shape = {
  id: 'antenna',
  name: 'Communications Antenna',
  vertices: [
    // Dish shape with support
    { x: -0.1, y: 0.0 },
    { x: 0.1, y: 0.0 },
    { x: 0.1, y: -0.3 },
    { x: 0.6, y: -0.5 },
    { x: 0.8, y: -0.9 },
    { x: 0.6, y: -1.0 },
    { x: 0, y: -0.7 },
    { x: -0.6, y: -1.0 },
    { x: -0.8, y: -0.9 },
    { x: -0.6, y: -0.5 },
    { x: -0.1, y: -0.3 },
  ],
  boundingRadius: 0.9,
  centroid: { x: 0, y: -0.5 },
};

export const ANTENNA_MODULE: StationModule = {
  type: 'antenna',
  shape: ANTENNA_SHAPE,
  connectionPoints: [
    { x: 0, y: 0 }, // Base mount
  ],
};

// =============================================================================
// Refinery Module - Ore processing
// =============================================================================

export const REFINERY_SHAPE: Shape = {
  id: 'refinery',
  name: 'Refinery Module',
  vertices: [
    // Industrial shape with processing tanks
    { x: -0.4, y: 1.0 },
    { x: 0.4, y: 1.0 },
    { x: 0.6, y: 0.8 },
    { x: 0.8, y: 0.4 },
    { x: 0.8, y: 0.0 },
    { x: 1.0, y: -0.2 },
    { x: 1.0, y: -0.8 },
    { x: 0.6, y: -1.0 },
    { x: -0.6, y: -1.0 },
    { x: -1.0, y: -0.8 },
    { x: -1.0, y: -0.2 },
    { x: -0.8, y: 0.0 },
    { x: -0.8, y: 0.4 },
    { x: -0.6, y: 0.8 },
  ],
  boundingRadius: 1.1,
  centroid: { x: 0, y: -0.1 },
};

export const REFINERY_MODULE: StationModule = {
  type: 'refinery',
  shape: REFINERY_SHAPE,
  connectionPoints: [
    { x: 0, y: 1.0 },   // Input
    { x: 0, y: -1.0 },  // Output
  ],
};

// =============================================================================
// Command Module - Station control
// =============================================================================

export const COMMAND_SHAPE: Shape = {
  id: 'command',
  name: 'Command Module',
  vertices: [
    // Elevated command center with viewports
    { x: 0, y: 1.0 },
    { x: 0.3, y: 0.8 },
    { x: 0.5, y: 0.4 },
    { x: 0.5, y: 0.0 },
    { x: 0.4, y: -0.3 },
    { x: 0.3, y: -0.5 },
    { x: -0.3, y: -0.5 },
    { x: -0.4, y: -0.3 },
    { x: -0.5, y: 0.0 },
    { x: -0.5, y: 0.4 },
    { x: -0.3, y: 0.8 },
  ],
  boundingRadius: 0.85,
  centroid: { x: 0, y: 0.2 },
};

export const COMMAND_MODULE: StationModule = {
  type: 'command',
  shape: COMMAND_SHAPE,
  connectionPoints: [
    { x: 0, y: -0.5 }, // Base connection
  ],
};

// =============================================================================
// Module Registry
// =============================================================================

export const STATION_MODULES: Record<StationModuleType, StationModule> = {
  'core': CORE_MODULE,
  'docking-ring': DOCKING_RING_MODULE,
  'habitat': HABITAT_MODULE,
  'cargo': CARGO_MODULE,
  'solar-array': SOLAR_ARRAY_MODULE,
  'antenna': ANTENNA_MODULE,
  'refinery': REFINERY_MODULE,
  'command': COMMAND_MODULE,
};

/**
 * Get a station module by type
 */
export function getStationModule(type: StationModuleType): StationModule {
  return STATION_MODULES[type];
}
