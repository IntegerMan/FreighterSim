/**
 * Grid-Based Station Layout System
 * 
 * Stations are designed on a virtual grid where:
 * - Each cell represents one unit of space
 * - Modules occupy specific grid cells
 * - Modules connect at cell boundaries (no gaps, no overlaps)
 * - Grid coordinates are integers for easy snapping
 * 
 * The grid is centered at (0,0) and extends in all directions.
 * Final positions are normalized by dividing by grid extent.
 * 
 * @module data/shapes/stationGrid
 */

import type { StationModulePlacement, StationModuleType } from '@/models';

/** A module placement in normalized coordinates */
interface GridModule {
  type: string;
  x: number;  // Normalized position X (-1 to 1 range)
  y: number;  // Normalized position Y (-1 to 1 range)
  rotation: number; // degrees
}

/**
 * Convert layout to module placements
 */
export function gridToModulePlacements(
  modules: GridModule[]
): StationModulePlacement[] {
  return modules.map(m => ({
    moduleType: m.type as StationModuleType,
    position: { x: m.x, y: m.y },
    rotation: m.rotation,
  }));
}

// =============================================================================
// Pre-defined Station Layouts (Normalized coordinates)
// =============================================================================

// Spacing constants for connected modules
const CORE_EDGE = 0.12;      // Distance from core center to its edge
const CORRIDOR_LEN = 0.1;    // Corridor length
const MODULE_OFFSET = 0.24;  // Distance from core to outer module center

/**
 * Trading Hub Layout
 * 
 * Structure:
 *       [CMD]
 *         |
 *   [C]-[CORE]-[C]
 *         |
 *       [HAB]
 * 
 * Plus solar arrays and antennas at diagonals
 */
export const TRADING_HUB_GRID: GridModule[] = [
  // Central core
  { type: 'core', x: 0, y: 0, rotation: 0 },
  
  // NORTH arm: corridor + command
  { type: 'corridor', x: 0, y: CORE_EDGE + CORRIDOR_LEN/2, rotation: 0 },
  { type: 'command', x: 0, y: MODULE_OFFSET + 0.08, rotation: 0 },
  
  // SOUTH arm: corridor + habitat (with docking port facing outward)
  { type: 'corridor', x: 0, y: -(CORE_EDGE + CORRIDOR_LEN/2), rotation: 180 },
  { type: 'habitat', x: 0, y: -(MODULE_OFFSET + 0.08), rotation: 180 },
  
  // EAST arm: corridor + cargo (with docking port facing outward)
  { type: 'corridor', x: CORE_EDGE + CORRIDOR_LEN/2, y: 0, rotation: 90 },
  { type: 'cargo', x: MODULE_OFFSET + 0.1, y: 0, rotation: 90 },
  
  // WEST arm: corridor + cargo (with docking port facing outward)
  { type: 'corridor', x: -(CORE_EDGE + CORRIDOR_LEN/2), y: 0, rotation: -90 },
  { type: 'cargo', x: -(MODULE_OFFSET + 0.1), y: 0, rotation: -90 },
  
  // NE diagonal: solar array
  { type: 'solar-array', x: 0.2, y: 0.2, rotation: 45 },
  
  // NW diagonal: solar array
  { type: 'solar-array', x: -0.2, y: 0.2, rotation: -45 },
  
  // SE diagonal: antenna
  { type: 'antenna', x: 0.18, y: -0.18, rotation: 135 },
  
  // SW diagonal: antenna
  { type: 'antenna', x: -0.18, y: -0.18, rotation: -135 },
];

/**
 * Mining Outpost Layout
 * 
 * Structure:
 *     [REFINERY]
 *         |
 *   [C]-[CORE]-[C]
 *         |
 *       [HAB]
 */
export const MINING_OUTPOST_GRID: GridModule[] = [
  // Central core
  { type: 'core', x: 0, y: 0, rotation: 0 },
  
  // NORTH: corridor -> refinery (with docking port)
  { type: 'corridor', x: 0, y: CORE_EDGE + CORRIDOR_LEN/2, rotation: 0 },
  { type: 'refinery', x: 0, y: MODULE_OFFSET + 0.12, rotation: 0 },
  
  // SOUTH: corridor -> habitat
  { type: 'corridor', x: 0, y: -(CORE_EDGE + CORRIDOR_LEN/2), rotation: 180 },
  { type: 'habitat', x: 0, y: -(MODULE_OFFSET + 0.08), rotation: 180 },
  
  // EAST: corridor -> cargo (with docking port)
  { type: 'corridor', x: CORE_EDGE + CORRIDOR_LEN/2, y: 0, rotation: 90 },
  { type: 'cargo', x: MODULE_OFFSET + 0.1, y: 0, rotation: 90 },
  
  // WEST: corridor -> cargo
  { type: 'corridor', x: -(CORE_EDGE + CORRIDOR_LEN/2), y: 0, rotation: -90 },
  { type: 'cargo', x: -(MODULE_OFFSET + 0.1), y: 0, rotation: -90 },
  
  // Solar arrays flanking refinery
  { type: 'solar-array', x: 0.22, y: MODULE_OFFSET, rotation: 0 },
  { type: 'solar-array', x: -0.22, y: MODULE_OFFSET, rotation: 0 },
];

/**
 * Fuel Depot Layout (compact)
 * 
 * Structure:
 *       [CARGO]
 *         |
 *   [S]-[CORE]-[S]
 *         |
 *       [CARGO]
 */
export const FUEL_DEPOT_GRID: GridModule[] = [
  // Central core
  { type: 'core', x: 0, y: 0, rotation: 0 },
  
  // NORTH: short corridor -> cargo (fuel tank, with docking port)
  { type: 'corridor-short', x: 0, y: CORE_EDGE + 0.04, rotation: 0 },
  { type: 'cargo', x: 0, y: MODULE_OFFSET, rotation: 0 },
  
  // SOUTH: short corridor -> cargo (fuel tank, with docking port)
  { type: 'corridor-short', x: 0, y: -(CORE_EDGE + 0.04), rotation: 180 },
  { type: 'cargo', x: 0, y: -MODULE_OFFSET, rotation: 180 },
  
  // EAST: solar array (directly attached)
  { type: 'solar-array', x: CORE_EDGE + 0.08, y: 0, rotation: 90 },
  
  // WEST: solar array (directly attached)
  { type: 'solar-array', x: -(CORE_EDGE + 0.08), y: 0, rotation: -90 },
];

// =============================================================================
// Build Station Templates from Grid Layouts
// =============================================================================

export function buildTradingHubFromGrid(): StationModulePlacement[] {
  return gridToModulePlacements(TRADING_HUB_GRID);
}

export function buildMiningOutpostFromGrid(): StationModulePlacement[] {
  return gridToModulePlacements(MINING_OUTPOST_GRID);
}

export function buildFuelDepotFromGrid(): StationModulePlacement[] {
  return gridToModulePlacements(FUEL_DEPOT_GRID);
}
