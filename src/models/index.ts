// Core types
export type { Vector2 } from './math';
export * from './math';

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
