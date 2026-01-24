/**
 * Station Builder System
 * 
 * A builder-style approach for constructing stations from modular parts:
 * 1. Start with a central hub module
 * 2. Attach corridor arms at defined connection points
 * 3. Attach feature modules (cargo, habitat, etc.) to corridor ends
 * 
 * Each module type defines its connection points - positions where
 * other modules can attach. This ensures orderly, structured stations.
 * 
 * @module data/shapes/stationBuilder
 */

import type { Vector2 } from '@/models';

type Vector2D = Vector2;

// =============================================================================
// Connection Point System
// =============================================================================

/** Direction a connection point faces */
export type ConnectionDirection = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';

/** A point where another module can attach */
export interface ConnectionPoint {
  id: string;
  position: Vector2D;        // Relative to module center
  direction: ConnectionDirection;
  /** What can connect here: 'corridor' for arms, 'terminal' for end modules, 'any' */
  accepts: 'corridor' | 'terminal' | 'any';
}

/** A placed module in the station */
export interface PlacedModule {
  moduleType: string;
  position: Vector2D;        // Absolute position in station space
  rotation: number;          // Degrees
  connectionPoints: ConnectionPoint[];  // Available connections (updated after placement)
}

/** Module definition with its connection points */
export interface ModuleDefinition {
  type: string;
  /** Size multiplier for rendering */
  size: number;
  /** Connection points in local space */
  connectionPoints: ConnectionPoint[];
}

// =============================================================================
// Module Definitions
// =============================================================================

/** Direction angles for rotation */
const DIRECTION_ANGLES: Record<ConnectionDirection, number> = {
  north: 0,
  northeast: 45,
  east: 90,
  southeast: 135,
  south: 180,
  southwest: 225,
  west: 270,
  northwest: 315,
};

/** Opposite directions for connecting modules */
const OPPOSITE_DIRECTION: Record<ConnectionDirection, ConnectionDirection> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  northeast: 'southwest',
  southwest: 'northeast',
  northwest: 'southeast',
  southeast: 'northwest',
};

/** Central hub - starting point with 8 connection points */
export const HUB_MODULE: ModuleDefinition = {
  type: 'core',
  size: 1,
  connectionPoints: [
    { id: 'n', position: { x: 0, y: 0.25 }, direction: 'north', accepts: 'any' },
    { id: 's', position: { x: 0, y: -0.25 }, direction: 'south', accepts: 'any' },
    { id: 'e', position: { x: 0.25, y: 0 }, direction: 'east', accepts: 'any' },
    { id: 'w', position: { x: -0.25, y: 0 }, direction: 'west', accepts: 'any' },
    { id: 'ne', position: { x: 0.18, y: 0.18 }, direction: 'northeast', accepts: 'corridor' },
    { id: 'nw', position: { x: -0.18, y: 0.18 }, direction: 'northwest', accepts: 'corridor' },
    { id: 'se', position: { x: 0.18, y: -0.18 }, direction: 'southeast', accepts: 'corridor' },
    { id: 'sw', position: { x: -0.18, y: -0.18 }, direction: 'southwest', accepts: 'corridor' },
  ],
};

/** Corridor arm - connects hub to terminal modules */
export const CORRIDOR_MODULE: ModuleDefinition = {
  type: 'corridor',
  size: 0.6,
  connectionPoints: [
    { id: 'in', position: { x: 0, y: -0.15 }, direction: 'south', accepts: 'any' },  // Connects to hub
    { id: 'out', position: { x: 0, y: 0.15 }, direction: 'north', accepts: 'terminal' }, // Connects to terminal
  ],
};

/** Short corridor for tighter builds */
export const SHORT_CORRIDOR_MODULE: ModuleDefinition = {
  type: 'corridor-short',
  size: 0.4,
  connectionPoints: [
    { id: 'in', position: { x: 0, y: -0.1 }, direction: 'south', accepts: 'any' },
    { id: 'out', position: { x: 0, y: 0.1 }, direction: 'north', accepts: 'terminal' },
  ],
};

/** T-junction corridor with 3 connection points */
export const T_JUNCTION_MODULE: ModuleDefinition = {
  type: 'corridor-t',
  size: 0.5,
  connectionPoints: [
    { id: 'in', position: { x: 0, y: -0.08 }, direction: 'south', accepts: 'any' },
    { id: 'left', position: { x: -0.08, y: 0 }, direction: 'west', accepts: 'terminal' },
    { id: 'right', position: { x: 0.08, y: 0 }, direction: 'east', accepts: 'terminal' },
  ],
};

// Terminal modules - attach to corridor ends
export const CARGO_MODULE: ModuleDefinition = {
  type: 'cargo',
  size: 0.7,
  connectionPoints: [
    { id: 'attach', position: { x: 0, y: -0.15 }, direction: 'south', accepts: 'corridor' },
  ],
};

export const HABITAT_MODULE: ModuleDefinition = {
  type: 'habitat',
  size: 0.8,
  connectionPoints: [
    { id: 'attach', position: { x: 0, y: -0.15 }, direction: 'south', accepts: 'corridor' },
  ],
};

export const REFINERY_MODULE: ModuleDefinition = {
  type: 'refinery',
  size: 0.9,
  connectionPoints: [
    { id: 'attach', position: { x: 0, y: -0.18 }, direction: 'south', accepts: 'corridor' },
  ],
};

export const COMMAND_MODULE: ModuleDefinition = {
  type: 'command',
  size: 0.6,
  connectionPoints: [
    { id: 'attach', position: { x: 0, y: -0.12 }, direction: 'south', accepts: 'corridor' },
  ],
};

export const SOLAR_ARRAY_MODULE: ModuleDefinition = {
  type: 'solar-array',
  size: 0.5,
  connectionPoints: [
    { id: 'attach', position: { x: 0, y: -0.1 }, direction: 'south', accepts: 'corridor' },
  ],
};

export const ANTENNA_MODULE: ModuleDefinition = {
  type: 'antenna',
  size: 0.3,
  connectionPoints: [
    { id: 'attach', position: { x: 0, y: -0.08 }, direction: 'south', accepts: 'corridor' },
  ],
};

export const DOCKING_RING_MODULE: ModuleDefinition = {
  type: 'docking-ring',
  size: 1.2,
  connectionPoints: [
    // Docking ring wraps around hub, no outward connections
  ],
};

// =============================================================================
// Station Builder
// =============================================================================

/**
 * Rotates a point around the origin by the given angle in degrees
 */
function rotatePoint(point: Vector2D, angleDegrees: number): Vector2D {
  const rad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

/**
 * Gets the rotation angle needed to align a module's connection point
 * with a target direction
 */
function getRotationForDirection(
  moduleConnectionDir: ConnectionDirection,
  targetDir: ConnectionDirection
): number {
  const moduleAngle = DIRECTION_ANGLES[moduleConnectionDir];
  const targetAngle = DIRECTION_ANGLES[OPPOSITE_DIRECTION[targetDir]];
  return (targetAngle - moduleAngle + 360) % 360;
}

/**
 * Station Builder class - fluent interface for building stations
 */
export class StationBuilder {
  private modules: PlacedModule[] = [];
  private readonly usedConnections: Set<string> = new Set();

  /**
   * Start building with a central hub
   */
  startWithHub(): this {
    this.modules = [];
    this.usedConnections.clear();
    
    this.modules.push({
      moduleType: HUB_MODULE.type,
      position: { x: 0, y: 0 },
      rotation: 0,
      connectionPoints: [...HUB_MODULE.connectionPoints],
    });
    
    return this;
  }

  /**
   * Add a docking ring around the hub (special case - overlays hub)
   */
  addDockingRing(): this {
    this.modules.push({
      moduleType: DOCKING_RING_MODULE.type,
      position: { x: 0, y: 0 },
      rotation: 0,
      connectionPoints: [],
    });
    return this;
  }

  /**
   * Attach a corridor arm to the hub in a specific direction
   */
  addArm(direction: ConnectionDirection, corridorType: 'standard' | 'short' = 'standard'): this {
    const hub = this.modules[0];
    if (hub?.moduleType !== 'core') {
      console.warn('Must start with hub before adding arms');
      return this;
    }

    const connPoint = hub.connectionPoints.find(cp => cp.direction === direction);
    if (!connPoint) {
      console.warn(`No connection point in direction: ${direction}`);
      return this;
    }

    const connKey = `hub-${connPoint.id}`;
    if (this.usedConnections.has(connKey)) {
      console.warn(`Connection point already used: ${connKey}`);
      return this;
    }

    const corridorDef = corridorType === 'short' ? SHORT_CORRIDOR_MODULE : CORRIDOR_MODULE;
    const rotation = getRotationForDirection('south', direction);
    
    // Calculate corridor position - connect 'in' point to hub connection point
    const inPoint = corridorDef.connectionPoints.find(cp => cp.id === 'in')!;
    const rotatedInPoint = rotatePoint(inPoint.position, rotation);
    
    const corridorPos: Vector2D = {
      x: connPoint.position.x - rotatedInPoint.x,
      y: connPoint.position.y - rotatedInPoint.y,
    };

    // Calculate where the 'out' point ends up
    const outPoint = corridorDef.connectionPoints.find(cp => cp.id === 'out')!;
    const rotatedOutPoint = rotatePoint(outPoint.position, rotation);
    const outWorldPos: Vector2D = {
      x: corridorPos.x + rotatedOutPoint.x,
      y: corridorPos.y + rotatedOutPoint.y,
    };

    this.modules.push({
      moduleType: corridorDef.type,
      position: corridorPos,
      rotation,
      connectionPoints: [{
        ...outPoint,
        id: `arm-${direction}-out`,
        position: outWorldPos,
        direction: direction, // Outward direction
      }],
    });

    this.usedConnections.add(connKey);
    return this;
  }

  /**
   * Attach a terminal module to an arm end
   */
  attachToArm(armDirection: ConnectionDirection, moduleDef: ModuleDefinition): this {
    // Find the corridor in that direction
    const armId = `arm-${armDirection}-out`;
    const corridor = this.modules.find(m => 
      m.connectionPoints.some(cp => cp.id === armId)
    );

    if (!corridor) {
      console.warn(`No arm found in direction: ${armDirection}`);
      return this;
    }

    const connPoint = corridor.connectionPoints.find(cp => cp.id === armId);
    if (!connPoint) return this;

    if (this.usedConnections.has(armId)) {
      console.warn(`Arm endpoint already used: ${armId}`);
      return this;
    }

    // Get the module's attachment point
    const attachPoint = moduleDef.connectionPoints.find(cp => cp.id === 'attach');
    if (!attachPoint) {
      // Module has no attachment point, place it directly
      this.modules.push({
        moduleType: moduleDef.type,
        position: connPoint.position,
        rotation: DIRECTION_ANGLES[armDirection],
        connectionPoints: [],
      });
      this.usedConnections.add(armId);
      return this;
    }

    // Calculate rotation to align attachment point with arm direction
    const rotation = getRotationForDirection(attachPoint.direction, armDirection);
    const rotatedAttach = rotatePoint(attachPoint.position, rotation);

    const modulePos: Vector2D = {
      x: connPoint.position.x - rotatedAttach.x,
      y: connPoint.position.y - rotatedAttach.y,
    };

    this.modules.push({
      moduleType: moduleDef.type,
      position: modulePos,
      rotation,
      connectionPoints: [],
    });

    this.usedConnections.add(armId);
    return this;
  }

  /**
   * Build the final station module list for StationTemplate format
   */
  build(): Array<{ moduleType: string; position: Vector2D; rotation: number }> {
    return this.modules.map(m => ({
      moduleType: m.moduleType,
      position: { ...m.position },
      rotation: m.rotation,
    }));
  }
}

// =============================================================================
// Pre-built Station Configurations
// =============================================================================

/**
 * Build a Trading Hub station
 * Cross pattern with cargo and habitat arms
 */
export function buildTradingHub() {
  return new StationBuilder()
    .startWithHub()
    .addDockingRing()
    // Main arms in cardinal directions
    .addArm('north')
    .addArm('south')
    .addArm('east')
    .addArm('west')
    // Diagonal arms
    .addArm('northeast', 'short')
    .addArm('northwest', 'short')
    .addArm('southeast', 'short')
    .addArm('southwest', 'short')
    // Attach modules to main arms
    .attachToArm('north', COMMAND_MODULE)
    .attachToArm('south', HABITAT_MODULE)
    .attachToArm('east', CARGO_MODULE)
    .attachToArm('west', CARGO_MODULE)
    // Attach to diagonal arms
    .attachToArm('northeast', SOLAR_ARRAY_MODULE)
    .attachToArm('northwest', SOLAR_ARRAY_MODULE)
    .attachToArm('southeast', ANTENNA_MODULE)
    .attachToArm('southwest', ANTENNA_MODULE)
    .build();
}

/**
 * Build a Mining Outpost station
 * Industrial layout with refinery focus
 */
export function buildMiningOutpost() {
  return new StationBuilder()
    .startWithHub()
    .addDockingRing()
    // Main arms
    .addArm('north')
    .addArm('south')
    .addArm('east')
    .addArm('west')
    // Diagonal arms for solar power
    .addArm('northeast', 'short')
    .addArm('northwest', 'short')
    // Attach modules
    .attachToArm('north', REFINERY_MODULE)
    .attachToArm('south', HABITAT_MODULE)
    .attachToArm('east', CARGO_MODULE)
    .attachToArm('west', CARGO_MODULE)
    .attachToArm('northeast', SOLAR_ARRAY_MODULE)
    .attachToArm('northwest', SOLAR_ARRAY_MODULE)
    .build();
}

/**
 * Build a Fuel Depot station
 * Compact layout focused on storage
 */
export function buildFuelDepot() {
  return new StationBuilder()
    .startWithHub()
    .addDockingRing()
    // Four main arms with cargo (fuel tanks)
    .addArm('north')
    .addArm('south')
    .addArm('east')
    .addArm('west')
    // Attach fuel storage
    .attachToArm('north', CARGO_MODULE)
    .attachToArm('south', CARGO_MODULE)
    .attachToArm('east', SOLAR_ARRAY_MODULE)
    .attachToArm('west', SOLAR_ARRAY_MODULE)
    .build();
}
