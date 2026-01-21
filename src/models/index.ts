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
export { createContact, updateContactRelative, getContactSymbol, formatBearing, formatDistance } from './Contact';

export type { Ship, SystemStatus } from './Ship';
export { createShip, DEFAULT_SHIP } from './Ship';
