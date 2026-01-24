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

/** Grid cell size - modules are placed on this grid */
const GRID_CELL_SIZE = 1;

/** Module sizes in grid cells */
export const MODULE_GRID_SIZES: Record<string, { width: number; height: number }> = {
  'core': { width: 2, height: 2 },
  'corridor': { width: 1, height: 2 },
  'corridor-short': { width: 1, height: 1 },
  'cargo': { width: 2, height: 2 },
  'habitat': { width: 1, height: 2 },
  'refinery': { width: 2, height: 3 },
  'command': { width: 1, height: 2 },
  'solar-array': { width: 2, height: 1 },
  'antenna': { width: 1, height: 1 },
};

/** A module placement on the grid */
interface GridModule {
  type: string;
  gridX: number;  // Grid cell X (center of module)
  gridY: number;  // Grid cell Y (center of module)
  rotation: number; // 0, 90, 180, 270
}

/**
 * Convert grid-based layout to normalized module placements
 * 
 * @param modules - Array of modules with grid positions
 * @param gridExtent - The maximum extent of the grid (for normalization)
 * @returns Normalized module placements for StationTemplate
 */
export function gridToModulePlacements(
  modules: GridModule[],
  gridExtent: number
): StationModulePlacement[] {
  return modules.map(m => ({
    moduleType: m.type as StationModuleType,
    position: {
      x: (m.gridX * GRID_CELL_SIZE) / gridExtent,
      y: (m.gridY * GRID_CELL_SIZE) / gridExtent,
    },
    rotation: m.rotation,
  }));
}

// =============================================================================
// Pre-defined Station Layouts (Grid-based)
// =============================================================================

/**
 * Trading Hub Layout (Grid: 12x12, centered)
 * 
 * Grid visualization (each char = 1 cell):
 * 
 *           -6-5-4-3-2-1 0 1 2 3 4 5 6
 *        6:          [A]
 *        5:          [C]
 *        4:       [S][C][S]
 *        3:          [|]
 *        2:    [C][-]    [-][C]
 *        1:    [A]       [A]
 *        0: [S][-][CORE ][-][S]
 *       -1:    [G]       [G]
 *       -2:    [O][-]    [-][O]
 *       -3:          [|]
 *       -4:          [H]
 *       -5:          [H]
 *       -6:
 * 
 * Legend: CORE=core, C=command, H=habitat, G/O=cargo, S=solar, A=antenna, |/-=corridor
 */
export const TRADING_HUB_GRID: GridModule[] = [
  // Central core (2x2, centered at 0,0)
  { type: 'core', gridX: 0, gridY: 0, rotation: 0 },
  
  // NORTH: corridor (at 0,2) -> command (at 0,4)
  { type: 'corridor', gridX: 0, gridY: 2.5, rotation: 0 },
  { type: 'command', gridX: 0, gridY: 5, rotation: 0 },
  
  // SOUTH: corridor (at 0,-2) -> habitat (at 0,-4)
  { type: 'corridor', gridX: 0, gridY: -2.5, rotation: 180 },
  { type: 'habitat', gridX: 0, gridY: -5, rotation: 180 },
  
  // EAST: corridor (at 2,0) -> cargo (at 4,0)
  { type: 'corridor', gridX: 2.5, gridY: 0, rotation: 90 },
  { type: 'cargo', gridX: 5, gridY: 0, rotation: 90 },
  
  // WEST: corridor (at -2,0) -> cargo (at -4,0)
  { type: 'corridor', gridX: -2.5, gridY: 0, rotation: -90 },
  { type: 'cargo', gridX: -5, gridY: 0, rotation: -90 },
  
  // NE diagonal: solar array
  { type: 'corridor-short', gridX: 2, gridY: 2, rotation: 45 },
  { type: 'solar-array', gridX: 3.5, gridY: 3.5, rotation: 45 },
  
  // NW diagonal: solar array
  { type: 'corridor-short', gridX: -2, gridY: 2, rotation: -45 },
  { type: 'solar-array', gridX: -3.5, gridY: 3.5, rotation: -45 },
  
  // SE diagonal: antenna
  { type: 'corridor-short', gridX: 2, gridY: -2, rotation: 135 },
  { type: 'antenna', gridX: 3.5, gridY: -3.5, rotation: 135 },
  
  // SW diagonal: antenna
  { type: 'corridor-short', gridX: -2, gridY: -2, rotation: -135 },
  { type: 'antenna', gridX: -3.5, gridY: -3.5, rotation: -135 },
];

/**
 * Mining Outpost Layout (Grid: 10x12)
 */
export const MINING_OUTPOST_GRID: GridModule[] = [
  // Central core
  { type: 'core', gridX: 0, gridY: 0, rotation: 0 },
  
  // NORTH: corridor -> refinery (large)
  { type: 'corridor', gridX: 0, gridY: 2.5, rotation: 0 },
  { type: 'refinery', gridX: 0, gridY: 5.5, rotation: 0 },
  
  // SOUTH: corridor -> habitat
  { type: 'corridor', gridX: 0, gridY: -2.5, rotation: 180 },
  { type: 'habitat', gridX: 0, gridY: -5, rotation: 180 },
  
  // EAST: corridor -> cargo
  { type: 'corridor', gridX: 2.5, gridY: 0, rotation: 90 },
  { type: 'cargo', gridX: 5, gridY: 0, rotation: 90 },
  
  // WEST: corridor -> cargo
  { type: 'corridor', gridX: -2.5, gridY: 0, rotation: -90 },
  { type: 'cargo', gridX: -5, gridY: 0, rotation: -90 },
  
  // Solar arrays on sides of refinery
  { type: 'solar-array', gridX: 3, gridY: 4, rotation: 0 },
  { type: 'solar-array', gridX: -3, gridY: 4, rotation: 0 },
];

/**
 * Fuel Depot Layout (Grid: 8x8, compact)
 */
export const FUEL_DEPOT_GRID: GridModule[] = [
  // Central core
  { type: 'core', gridX: 0, gridY: 0, rotation: 0 },
  
  // NORTH: short corridor -> cargo (fuel tank)
  { type: 'corridor-short', gridX: 0, gridY: 2, rotation: 0 },
  { type: 'cargo', gridX: 0, gridY: 4, rotation: 0 },
  
  // SOUTH: short corridor -> cargo (fuel tank)
  { type: 'corridor-short', gridX: 0, gridY: -2, rotation: 180 },
  { type: 'cargo', gridX: 0, gridY: -4, rotation: 180 },
  
  // EAST: short corridor -> solar
  { type: 'corridor-short', gridX: 2, gridY: 0, rotation: 90 },
  { type: 'solar-array', gridX: 4, gridY: 0, rotation: 90 },
  
  // WEST: short corridor -> solar
  { type: 'corridor-short', gridX: -2, gridY: 0, rotation: -90 },
  { type: 'solar-array', gridX: -4, gridY: 0, rotation: -90 },
];

// =============================================================================
// Build Station Templates from Grid Layouts
// =============================================================================

/** Grid extent for each station type (determines final scale) */
const GRID_EXTENTS = {
  'trading-hub': 8,
  'mining-outpost': 8,
  'fuel-depot': 6,
};

export function buildTradingHubFromGrid(): StationModulePlacement[] {
  return gridToModulePlacements(TRADING_HUB_GRID, GRID_EXTENTS['trading-hub']);
}

export function buildMiningOutpostFromGrid(): StationModulePlacement[] {
  return gridToModulePlacements(MINING_OUTPOST_GRID, GRID_EXTENTS['mining-outpost']);
}

export function buildFuelDepotFromGrid(): StationModulePlacement[] {
  return gridToModulePlacements(FUEL_DEPOT_GRID, GRID_EXTENTS['fuel-depot']);
}
