/**
 * Station Template Definitions
 * 
 * Complete station configurations using modular composition:
 * - Trading Hub: Commercial center with multiple docking facilities
 * - Mining Outpost: Industrial facility for ore processing
 * 
 * @module data/shapes/stations
 */

import type { StationTemplate } from '@/models';

// =============================================================================
// Trading Hub - Commercial center
// =============================================================================

/**
 * Trading Hub station template
 * Central core with docking ring and commercial facilities
 */
export const TRADING_HUB_TEMPLATE: StationTemplate = {
  id: 'trading-hub',
  name: 'Trading Hub',
  type: 'trading-hub',
  modules: [
    // Central core
    { moduleType: 'core', position: { x: 0, y: 0 }, rotation: 0 },
    
    // Docking ring around core
    { moduleType: 'docking-ring', position: { x: 0, y: 0 }, rotation: 0 },
    
    // Command module on top
    { moduleType: 'command', position: { x: 0, y: 80 }, rotation: 0 },
    
    // Cargo modules on sides
    { moduleType: 'cargo', position: { x: 100, y: 0 }, rotation: 90 },
    { moduleType: 'cargo', position: { x: -100, y: 0 }, rotation: -90 },
    
    // Habitat below
    { moduleType: 'habitat', position: { x: 0, y: -80 }, rotation: 180 },
    
    // Solar arrays for power
    { moduleType: 'solar-array', position: { x: 60, y: 60 }, rotation: 45 },
    { moduleType: 'solar-array', position: { x: -60, y: 60 }, rotation: -45 },
    
    // Communications
    { moduleType: 'antenna', position: { x: 0, y: 120 }, rotation: 0 },
  ],
  defaultRotation: 0,
};

// =============================================================================
// Mining Outpost - Industrial facility
// =============================================================================

/**
 * Mining Outpost station template
 * Industrial facility focused on ore processing
 */
export const MINING_OUTPOST_TEMPLATE: StationTemplate = {
  id: 'mining-outpost',
  name: 'Mining Outpost',
  type: 'mining-outpost',
  modules: [
    // Central core
    { moduleType: 'core', position: { x: 0, y: 0 }, rotation: 0 },
    
    // Refinery module (main feature)
    { moduleType: 'refinery', position: { x: 0, y: 100 }, rotation: 0 },
    
    // Docking ring for freighters
    { moduleType: 'docking-ring', position: { x: 0, y: 0 }, rotation: 45 },
    
    // Cargo storage
    { moduleType: 'cargo', position: { x: 80, y: -60 }, rotation: 0 },
    { moduleType: 'cargo', position: { x: -80, y: -60 }, rotation: 0 },
    
    // Minimal habitat
    { moduleType: 'habitat', position: { x: 0, y: -100 }, rotation: 180 },
    
    // Large solar array for power-hungry refinery
    { moduleType: 'solar-array', position: { x: 120, y: 0 }, rotation: 90 },
    { moduleType: 'solar-array', position: { x: -120, y: 0 }, rotation: -90 },
    
    // Communications
    { moduleType: 'antenna', position: { x: 80, y: 100 }, rotation: 30 },
  ],
  defaultRotation: 0,
};

// =============================================================================
// Fuel Depot - Refueling station
// =============================================================================

/**
 * Fuel Depot station template
 * Small station focused on refueling services
 */
export const FUEL_DEPOT_TEMPLATE: StationTemplate = {
  id: 'fuel-depot',
  name: 'Fuel Depot',
  type: 'fuel-depot',
  modules: [
    // Central core
    { moduleType: 'core', position: { x: 0, y: 0 }, rotation: 0 },
    
    // Docking ring
    { moduleType: 'docking-ring', position: { x: 0, y: 0 }, rotation: 0 },
    
    // Fuel storage (cargo modules)
    { moduleType: 'cargo', position: { x: 0, y: 80 }, rotation: 0 },
    { moduleType: 'cargo', position: { x: 0, y: -80 }, rotation: 180 },
    
    // Solar arrays
    { moduleType: 'solar-array', position: { x: 80, y: 0 }, rotation: 90 },
    { moduleType: 'solar-array', position: { x: -80, y: 0 }, rotation: -90 },
  ],
  defaultRotation: 0,
};

// =============================================================================
// Export all station templates
// =============================================================================

export const STATION_TEMPLATES: StationTemplate[] = [
  TRADING_HUB_TEMPLATE,
  MINING_OUTPOST_TEMPLATE,
  FUEL_DEPOT_TEMPLATE,
];

/**
 * Get a station template by ID
 */
export function getStationTemplate(id: string): StationTemplate | undefined {
  return STATION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get a station template by type
 */
export function getStationTemplateByType(type: string): StationTemplate | undefined {
  return STATION_TEMPLATES.find(t => t.type === type);
}
