// Core types
export type { Vector2 } from './math';
export * from './math';

// Shape system (2D polygon rendering and collision)
export type { Shape, EngineMount, ShipTemplate, ShipCategory, CollisionResult, BoundingBox } from './Shape';
export type { DockingPort, DockingPortSize } from './DockingPort';
export { DEFAULT_ALIGNMENT_TOLERANCE, DEFAULT_DOCKING_RANGE, getAlignmentTolerance, getDockingRange } from './DockingPort';
export type { StationModule, StationModuleType, StationModulePlacement, StationTemplate } from './StationModule';
export { DEFAULT_STATION_ROTATION, getDefaultRotation } from './StationModule';

// Game entities
export type { Planet, PlanetType } from './Planet';
export { createPlanet, updatePlanetOrbit } from './Planet';

export type { Station, StationType, StationService } from './Station';
export { createStation, getStationTypeName, getServiceName } from './Station';

export type { StarSystem, Star, JumpGate } from './StarSystem';
export { createStarSystem } from './StarSystem';

export type { Contact, ContactType } from './Contact';
export { createContact, updateContactRelative, getContactSymbol, formatBearing, formatDistance, DEFAULT_CONTACT_RADIUS } from './Contact';

export type { Ship, SystemStatus, ShipEngines, ShipSensors } from './Ship';
export { createShip, DEFAULT_SHIP, DEFAULT_ENGINES, DEFAULT_SENSORS } from './Ship';

export type { Waypoint } from './Waypoint';

export type { CargoItem, CargoType } from './CargoItem';
export { CARGO_TYPE_COLORS } from './CargoItem';

export type { CargoBay } from './CargoBay';
export { DEFAULT_CARGO_BAY } from './CargoBay';


export type {
  ParticleGridConfig,
  ParticleCell,
  ParticleGrid,
  ParticleEmitter,
  ThreatLevel,
  RadarSegment
} from './Particle';
export {
  DEFAULT_PARTICLE_CONFIG,
  THREAT_THRESHOLDS,
  createCellKey,
  parseCellKey,
  worldToGridCoord,
  gridToWorldCoord,
  getThreatLevelFromDistance,
  getThreatLevelColor,
  isAngleInSegment
} from './Particle';

// Starfield types
export type {
  Star as BackgroundStar,
  StarfieldLayerConfig,
  StarfieldConfig,
  StarfieldLayer
} from './Starfield';
