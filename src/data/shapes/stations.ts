/**
 * Station Template Definitions
 * 
 * Stations are built using a grid-based layout system:
 * - Modules snap to grid cells
 * - No gaps or overlaps
 * - Clear visual structure
 * 
 * Docking ports are on OUTER modules (cargo, habitat, refinery).
 * 
 * @module data/shapes/stations
 */

import type { StationTemplate } from '@/models';
import {
  buildTradingHubFromGrid,
  buildMiningOutpostFromGrid,
  buildFuelDepotFromGrid,
} from './stationGrid';

// =============================================================================
// Trading Hub - Large commercial station
// =============================================================================

export const TRADING_HUB_TEMPLATE: StationTemplate = {
  id: 'trading-hub',
  name: 'Trading Hub',
  type: 'trading-hub',
  boundingRadius: 1,
  modules: buildTradingHubFromGrid(),
  defaultRotation: 0,
};

// =============================================================================
// Mining Outpost - Industrial facility
// =============================================================================

export const MINING_OUTPOST_TEMPLATE: StationTemplate = {
  id: 'mining-outpost',
  name: 'Mining Outpost',
  type: 'mining-outpost',
  boundingRadius: 1,
  modules: buildMiningOutpostFromGrid(),
  defaultRotation: 0,
};

// =============================================================================
// Fuel Depot - Compact refueling station
// =============================================================================

export const FUEL_DEPOT_TEMPLATE: StationTemplate = {
  id: 'fuel-depot',
  name: 'Fuel Depot',
  type: 'fuel-depot',
  boundingRadius: 1,
  modules: buildFuelDepotFromGrid(),
  defaultRotation: 0,
};

// =============================================================================
// Exports
// =============================================================================

export const STATION_TEMPLATES: StationTemplate[] = [
  TRADING_HUB_TEMPLATE,
  MINING_OUTPOST_TEMPLATE,
  FUEL_DEPOT_TEMPLATE,
];

export function getStationTemplate(id: string): StationTemplate | undefined {
  return STATION_TEMPLATES.find(t => t.id === id);
}

export function getStationTemplateByType(type: string): StationTemplate | undefined {
  return STATION_TEMPLATES.find(t => t.type === type);
}
