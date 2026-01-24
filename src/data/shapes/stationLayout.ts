/**
 * Connection-Based Station Layout System
 * 
 * Modules are positioned by connecting their edges together.
 * This makes gaps and overlaps IMPOSSIBLE by design.
 * 
 * Each module has connection points at its edges (north, south, east, west).
 * When two modules connect, their connection points are placed at the same location.
 * 
 * @module data/shapes/stationLayout
 */

import type { StationModulePlacement, StationModuleType } from '@/models';

// =============================================================================
// Module Connection Definitions
// =============================================================================

/** Direction for connection points */
type Direction = 'north' | 'south' | 'east' | 'west';

/** Connection point on a module edge */
interface ConnectionPoint {
  /** Direction this point faces (outward) */
  direction: Direction;
  /** Offset from module center to this connection point (in module's local normalized coords) */
  offset: number;
}

/** Module type with its size and connection points */
interface ModuleSpec {
  /** Half-width of module (from center to edge) */
  halfWidth: number;
  /** Half-height of module (from center to edge) */
  halfHeight: number;
  /** Available connection points */
  connections: Record<string, ConnectionPoint>;
}

/**
 * Module scale factor - must match MODULE_SCALE_FACTOR in shapeRenderer.ts
 * This converts module shape coordinates (-1 to 1) to station coordinates
 */
const MODULE_SCALE = 0.12;

/**
 * Module specifications - defines size and connection points for each module type.
 * 
 * IMPORTANT: halfWidth/halfHeight represent the module's TOTAL extent divided by 2,
 * measured from the geometric center (0,0), NOT from the centroid.
 * 
 * For shapes with off-center centroids (like command), we still use the distance
 * from (0,0) to the edge because that's how the connection points are defined.
 */
const MODULE_SPECS: Record<string, ModuleSpec> = {
  // Core: octagonal, vertices at ±1 on each axis  
  'core': {
    halfWidth: MODULE_SCALE,
    halfHeight: MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
      'south': { direction: 'south', offset: 0 },
      'east': { direction: 'east', offset: 0 },
      'west': { direction: 'west', offset: 0 },
    },
  },
  // Corridor: thin rectangle, vertices x=±0.3, y=±1
  // Corridor is tall and thin - has connections on all 4 sides for flexibility
  'corridor': {
    halfWidth: 0.3 * MODULE_SCALE,
    halfHeight: MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
      'south': { direction: 'south', offset: 0 },
      'east': { direction: 'east', offset: 0 },
      'west': { direction: 'west', offset: 0 },
    },
  },
  // Short corridor: half height
  'corridor-short': {
    halfWidth: 0.3 * MODULE_SCALE,
    halfHeight: 0.5 * MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
      'south': { direction: 'south', offset: 0 },
      'east': { direction: 'east', offset: 0 },
      'west': { direction: 'west', offset: 0 },
    },
  },
  // Cargo: boxy, x=±0.9, y=±0.8
  'cargo': {
    halfWidth: 0.9 * MODULE_SCALE,
    halfHeight: 0.8 * MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
      'south': { direction: 'south', offset: 0 },
      'east': { direction: 'east', offset: 0 },
      'west': { direction: 'west', offset: 0 },
    },
  },
  // Habitat: cylindrical, x=±0.6, y=±1
  'habitat': {
    halfWidth: 0.6 * MODULE_SCALE,
    halfHeight: MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
      'south': { direction: 'south', offset: 0 },
    },
  },
  // Refinery: large industrial, x=±1, y=±1
  'refinery': {
    halfWidth: MODULE_SCALE,
    halfHeight: MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
      'south': { direction: 'south', offset: 0 },
    },
  },
  // Command: dome shape, x=±0.5, y from -0.5 to +1 (centered at 0, not centroid)
  // Connection point at y=-0.5
  'command': {
    halfWidth: 0.5 * MODULE_SCALE,
    halfHeight: 0.5 * MODULE_SCALE,  // South edge at y=-0.5
    connections: {
      'south': { direction: 'south', offset: 0 },
    },
  },
  // Solar array: x=±1, y from -0.8 to +0.2 (connection at y=+0.2)
  'solar-array': {
    halfWidth: MODULE_SCALE,
    halfHeight: 0.5 * MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },  // Connect via top (y=0.2)
    },
  },
  // Antenna: x=±0.8, y from -1 to 0 (connection at y=0)
  'antenna': {
    halfWidth: 0.8 * MODULE_SCALE,
    halfHeight: 0.5 * MODULE_SCALE,
    connections: {
      'north': { direction: 'north', offset: 0 },
    },
  },
};

// =============================================================================
// Station Graph Definition
// =============================================================================

/** A module instance in the station */
interface ModuleNode {
  id: string;
  type: StationModuleType;
}

/** A connection between two modules */
interface ModuleEdge {
  /** Source module ID */
  from: string;
  /** Connection point on source module */
  fromPoint: string;
  /** Target module ID */
  to: string;
  /** Connection point on target module */
  toPoint: string;
}

/** Station defined as a graph of connected modules */
interface StationGraph {
  /** Root module (placed at origin) */
  root: string;
  /** All modules in the station */
  modules: ModuleNode[];
  /** Connections between modules */
  edges: ModuleEdge[];
}

// =============================================================================
// Layout Calculation
// =============================================================================

/** Get the edge position for a connection point */
function getConnectionPosition(
  spec: ModuleSpec,
  pointId: string,
  moduleX: number,
  moduleY: number,
  moduleRotation: number
): { x: number; y: number; direction: Direction } {
  const point = spec.connections[pointId];
  if (!point) {
    console.warn(`Connection point ${pointId} not found`);
    return { x: moduleX, y: moduleY, direction: 'north' };
  }

  // Calculate unrotated edge position
  let edgeX = 0;
  let edgeY = 0;
  
  switch (point.direction) {
    case 'north':
      edgeX = point.offset;
      edgeY = spec.halfHeight;
      break;
    case 'south':
      edgeX = point.offset;
      edgeY = -spec.halfHeight;
      break;
    case 'east':
      edgeX = spec.halfWidth;
      edgeY = point.offset;
      break;
    case 'west':
      edgeX = -spec.halfWidth;
      edgeY = point.offset;
      break;
  }

  // Apply module rotation
  const rad = (moduleRotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const rotatedX = edgeX * cos - edgeY * sin;
  const rotatedY = edgeX * sin + edgeY * cos;

  // Get rotated direction
  const directions: Direction[] = ['north', 'east', 'south', 'west'];
  const dirIndex = directions.indexOf(point.direction);
  const rotatedDirIndex = (dirIndex + Math.round(moduleRotation / 90)) % 4;
  const rotatedDirection = directions[(rotatedDirIndex + 4) % 4] ?? 'north';

  return {
    x: moduleX + rotatedX,
    y: moduleY + rotatedY,
    direction: rotatedDirection,
  };
}

/** Get the opposite direction */
function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}

/** Calculate rotation needed to align connection points */
function calculateAlignmentRotation(
  fromDirection: Direction,
  toPointDirection: Direction
): number {
  // The 'to' module needs to be rotated so its connection point faces opposite to 'from'
  const targetDirection = oppositeDirection(fromDirection);
  
  const directions: Direction[] = ['north', 'east', 'south', 'west'];
  const fromIndex = directions.indexOf(toPointDirection);
  const toIndex = directions.indexOf(targetDirection);
  
  return ((toIndex - fromIndex) * 90 + 360) % 360;
}

/** Helper to place a connected module */
function placeConnectedModule(
  graph: StationGraph,
  placements: Map<string, StationModulePlacement>,
  fromId: string,
  fromPoint: string,
  toId: string,
  toPoint: string,
  isReversed: boolean
): StationModulePlacement | null {
  const fromPlacement = placements.get(fromId);
  if (!fromPlacement) return null;

  const fromModule = graph.modules.find(m => m.id === fromId);
  const toModule = graph.modules.find(m => m.id === toId);
  if (!fromModule || !toModule) return null;

  const fromSpec = MODULE_SPECS[fromModule.type];
  const toSpec = MODULE_SPECS[toModule.type];
  if (!fromSpec || !toSpec) return null;

  // Get the connection point on the placed module
  const connPointId = isReversed ? toPoint : fromPoint;
  const conn = getConnectionPosition(
    fromSpec,
    connPointId,
    fromPlacement.position.x,
    fromPlacement.position.y,
    fromPlacement.rotation
  );

  // Calculate rotation for the module being placed
  const placingPointId = isReversed ? fromPoint : toPoint;
  const targetRotation = calculateAlignmentRotation(
    conn.direction,
    toSpec.connections[placingPointId]?.direction ?? 'south'
  );

  // Get the target connection point offset from module center (at origin with target rotation)
  const targetConn = getConnectionPosition(toSpec, placingPointId, 0, 0, targetRotation);

  // Position the module so its edge TOUCHES the 'from' module's edge at the connection point.
  // 
  // The connection point is ON the edge of both modules. If we simply place module center
  // at (conn - targetConn), the module body extends from that point TOWARD the 'from' module,
  // causing overlap.
  //
  // Instead, we want the module to be placed so its edge is AT conn, with the body extending
  // AWAY from the 'from' module. This means doubling the offset.
  //
  // If conn = (0.12, 0) and targetConn = (0.12, 0):
  //   Naive: center = (0, 0), edge at (0.12, 0), body extends to (-0.12, 0) - OVERLAPS
  //   Correct: center = conn + (conn - targetConn) = 2*conn - targetConn... no that's wrong too
  //
  // Actually: targetConn is the offset from CENTER to EDGE. To place the EDGE at conn,
  // with body extending away: center = conn + direction_away * body_extent
  //
  // Simpler: position = conn - targetConn puts the edge at conn. But the body extends
  // from (conn - 2*targetConn) to conn. We need body from conn to (conn + abs(targetConn)*2)
  // So: position = conn + targetConn (not minus!)
  // Wait no... let me think again.
  //
  // targetConn = offset from center to connection point
  // If center at P, then connection point at P + targetConn = conn
  // So P = conn - targetConn
  //
  // But this means if targetConn = (+0.12, 0), the connection is to the RIGHT of center.
  // Center at conn - targetConn = (0, 0), and connection at (0.12, 0). 
  // The OPPOSITE edge is at center - targetConn direction = (0, 0) + (-0.12, 0) = (-0.12, 0).
  // 
  // For modules to TOUCH without overlap, we want:
  // - 'from' module's connection edge at conn
  // Position the module so its connection point meets the 'from' connection point.
  // conn = world position of 'from' module's connection edge
  // targetConn = offset from 'to' module center to its connection edge
  // center = conn - targetConn places the connection edges at the same point
  
  return {
    moduleType: toModule.type,
    position: { x: conn.x - targetConn.x, y: conn.y - targetConn.y },
    rotation: targetRotation,
  };
}

/**
 * Build station layout from a connection graph.
 * 
 * This algorithm:
 * 1. Places the root module at origin
 * 2. For each connection, calculates the position of the connected module
 *    such that the two connection points meet exactly
 * 3. Propagates outward through the graph using BFS
 */
export function buildStationFromGraph(graph: StationGraph): StationModulePlacement[] {
  const placements = new Map<string, StationModulePlacement>();
  const visited = new Set<string>();
  const queue: string[] = [];

  // Find and place root module at origin
  const rootModule = graph.modules.find(m => m.id === graph.root);
  if (!rootModule) {
    console.error('Root module not found in graph');
    return [];
  }

  placements.set(graph.root, {
    moduleType: rootModule.type,
    position: { x: 0, y: 0 },
    rotation: 0,
  });
  visited.add(graph.root);
  queue.push(graph.root);

  // BFS through connections
  while (queue.length > 0) {
    const currentId = queue.shift()!;

    // Find all unvisited edges from this module
    for (const edge of graph.edges) {
      // Check outgoing edge (from -> to)
      if (edge.from === currentId && !visited.has(edge.to)) {
        const placement = placeConnectedModule(
          graph, placements, currentId, edge.fromPoint, edge.to, edge.toPoint, false
        );
        if (placement) {
          placements.set(edge.to, placement);
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
      // Check incoming edge (to -> from, reversed)
      if (edge.to === currentId && !visited.has(edge.from)) {
        const placement = placeConnectedModule(
          graph, placements, currentId, edge.toPoint, edge.from, edge.fromPoint, true
        );
        if (placement) {
          placements.set(edge.from, placement);
          visited.add(edge.from);
          queue.push(edge.from);
        }
      }
    }
  }

  return Array.from(placements.values());
}

// =============================================================================
// Pre-defined Station Graphs
// =============================================================================

/**
 * Trading Hub - Large commercial station
 * 
 * Structure:
 *              [COMMAND]
 *                  |
 *              [CORRIDOR]
 *                  |
 *   [CARGO]--[CORRIDOR]--[CORE]--[CORRIDOR]--[CARGO]
 *                  |
 *              [CORRIDOR]
 *                  |
 *              [HABITAT]
 */
export const TRADING_HUB_GRAPH: StationGraph = {
  root: 'core',
  modules: [
    { id: 'core', type: 'core' },
    // North arm
    { id: 'corridor-n', type: 'corridor' },
    { id: 'command', type: 'command' },
    // South arm
    { id: 'corridor-s', type: 'corridor' },
    { id: 'habitat', type: 'habitat' },
    // East arm
    { id: 'corridor-e', type: 'corridor' },
    { id: 'cargo-e', type: 'cargo' },
    // West arm
    { id: 'corridor-w', type: 'corridor' },
    { id: 'cargo-w', type: 'cargo' },
  ],
  edges: [
    // Core connections - corridors connect their INNER edge to core
    { from: 'core', fromPoint: 'north', to: 'corridor-n', toPoint: 'south' },
    { from: 'core', fromPoint: 'south', to: 'corridor-s', toPoint: 'north' },
    // East/West corridors: corridor's west edge connects to core's east (corridor extends right)
    // Corridor's east edge connects to core's west (corridor extends left)
    { from: 'core', fromPoint: 'east', to: 'corridor-e', toPoint: 'west' },
    { from: 'core', fromPoint: 'west', to: 'corridor-w', toPoint: 'east' },
    // Arm terminations - outer modules connect to corridor's OUTER edge
    { from: 'corridor-n', fromPoint: 'north', to: 'command', toPoint: 'south' },
    { from: 'corridor-s', fromPoint: 'south', to: 'habitat', toPoint: 'north' },
    // Cargo connects via south to corridor's east (outward end when corridor extends right/left)
    { from: 'corridor-e', fromPoint: 'east', to: 'cargo-e', toPoint: 'west' },
    { from: 'corridor-w', fromPoint: 'west', to: 'cargo-w', toPoint: 'east' },
  ],
};

/**
 * Mining Outpost - Industrial facility
 */
export const MINING_OUTPOST_GRAPH: StationGraph = {
  root: 'core',
  modules: [
    { id: 'core', type: 'core' },
    // North arm - refinery
    { id: 'corridor-n', type: 'corridor' },
    { id: 'refinery', type: 'refinery' },
    // South arm - habitat
    { id: 'corridor-s', type: 'corridor' },
    { id: 'habitat', type: 'habitat' },
    // East arm - cargo
    { id: 'corridor-e', type: 'corridor' },
    { id: 'cargo-e', type: 'cargo' },
    // West arm - cargo
    { id: 'corridor-w', type: 'corridor' },
    { id: 'cargo-w', type: 'cargo' },
  ],
  edges: [
    { from: 'core', fromPoint: 'north', to: 'corridor-n', toPoint: 'south' },
    { from: 'core', fromPoint: 'south', to: 'corridor-s', toPoint: 'north' },
    { from: 'core', fromPoint: 'east', to: 'corridor-e', toPoint: 'west' },
    { from: 'core', fromPoint: 'west', to: 'corridor-w', toPoint: 'east' },
    { from: 'corridor-n', fromPoint: 'north', to: 'refinery', toPoint: 'south' },
    { from: 'corridor-s', fromPoint: 'south', to: 'habitat', toPoint: 'north' },
    { from: 'corridor-e', fromPoint: 'east', to: 'cargo-e', toPoint: 'west' },
    { from: 'corridor-w', fromPoint: 'west', to: 'cargo-w', toPoint: 'east' },
  ],
};

/**
 * Fuel Depot - Compact refueling station
 */
export const FUEL_DEPOT_GRAPH: StationGraph = {
  root: 'core',
  modules: [
    { id: 'core', type: 'core' },
    // North - fuel tank
    { id: 'corridor-n', type: 'corridor-short' },
    { id: 'tank-n', type: 'cargo' },
    // South - fuel tank
    { id: 'corridor-s', type: 'corridor-short' },
    { id: 'tank-s', type: 'cargo' },
    // East - solar
    { id: 'solar-e', type: 'solar-array' },
    // West - solar
    { id: 'solar-w', type: 'solar-array' },
  ],
  edges: [
    { from: 'core', fromPoint: 'north', to: 'corridor-n', toPoint: 'south' },
    { from: 'core', fromPoint: 'south', to: 'corridor-s', toPoint: 'north' },
    { from: 'core', fromPoint: 'east', to: 'solar-e', toPoint: 'north' },
    { from: 'core', fromPoint: 'west', to: 'solar-w', toPoint: 'north' },
    { from: 'corridor-n', fromPoint: 'north', to: 'tank-n', toPoint: 'south' },
    { from: 'corridor-s', fromPoint: 'south', to: 'tank-s', toPoint: 'north' },
  ],
};

// =============================================================================
// Builder Functions
// =============================================================================

/**
 * Calculate the bounding radius of a station based on its module placements.
 * This accounts for each module's position and size.
 */
export function calculateStationBoundingRadius(modules: StationModulePlacement[]): number {
  let maxRadius = 0;
  
  for (const placement of modules) {
    const spec = MODULE_SPECS[placement.moduleType];
    if (!spec) continue;
    
    // Distance from station center to module center
    const distToCenter = Math.hypot(placement.position.x, placement.position.y);
    
    // Add the module's own radius (use the larger of width/height)
    const moduleRadius = Math.max(spec.halfWidth, spec.halfHeight);
    
    // Total extent from station center
    const totalExtent = distToCenter + moduleRadius;
    maxRadius = Math.max(maxRadius, totalExtent);
  }
  
  // Add a small margin
  return maxRadius * 1.1;
}

export function buildTradingHub(): StationModulePlacement[] {
  return buildStationFromGraph(TRADING_HUB_GRAPH);
}

export function buildMiningOutpost(): StationModulePlacement[] {
  return buildStationFromGraph(MINING_OUTPOST_GRAPH);
}

export function buildFuelDepot(): StationModulePlacement[] {
  return buildStationFromGraph(FUEL_DEPOT_GRAPH);
}

/** Get bounding radius for trading hub */
export function getTradingHubBoundingRadius(): number {
  return calculateStationBoundingRadius(buildTradingHub());
}

/** Get bounding radius for mining outpost */
export function getMiningOutpostBoundingRadius(): number {
  return calculateStationBoundingRadius(buildMiningOutpost());
}

/** Get bounding radius for fuel depot */
export function getFuelDepotBoundingRadius(): number {
  return calculateStationBoundingRadius(buildFuelDepot());
}
