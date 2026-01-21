import type { Vector2 } from './math';

/**
 * Types of space stations
 */
export type StationType = 'trading-hub' | 'mining-outpost' | 'fuel-depot' | 'shipyard' | 'research' | 'military';

/**
 * Services available at a station
 */
export type StationService = 'refuel' | 'repair' | 'trade' | 'missions' | 'upgrades' | 'storage';

/**
 * A space station in the star system
 */
export interface Station {
  id: string;
  name: string;
  type: StationType;
  position: Vector2;
  services: StationService[];
  dockingRange: number;
  description?: string;
  faction?: string;
}

/**
 * Create a station with default values
 */
export function createStation(config: {
  id: string;
  name: string;
  type: StationType;
  position: Vector2;
  services?: StationService[];
  dockingRange?: number;
  description?: string;
  faction?: string;
}): Station {
  const defaultServices = getDefaultServices(config.type);
  
  return {
    id: config.id,
    name: config.name,
    type: config.type,
    position: config.position,
    services: config.services ?? defaultServices,
    dockingRange: config.dockingRange ?? 50,
    description: config.description,
    faction: config.faction,
  };
}

/**
 * Get default services for a station type
 */
function getDefaultServices(type: StationType): StationService[] {
  switch (type) {
    case 'trading-hub':
      return ['refuel', 'trade', 'missions', 'storage'];
    case 'mining-outpost':
      return ['refuel', 'trade', 'storage'];
    case 'fuel-depot':
      return ['refuel', 'repair'];
    case 'shipyard':
      return ['refuel', 'repair', 'upgrades'];
    case 'research':
      return ['refuel', 'missions'];
    case 'military':
      return ['refuel', 'repair', 'missions'];
    default:
      return ['refuel'];
  }
}

/**
 * Get display name for station type
 */
export function getStationTypeName(type: StationType): string {
  switch (type) {
    case 'trading-hub': return 'Trading Hub';
    case 'mining-outpost': return 'Mining Outpost';
    case 'fuel-depot': return 'Fuel Depot';
    case 'shipyard': return 'Shipyard';
    case 'research': return 'Research Station';
    case 'military': return 'Military Station';
    default: return 'Station';
  }
}

/**
 * Get display name for a service
 */
export function getServiceName(service: StationService): string {
  switch (service) {
    case 'refuel': return 'Refueling';
    case 'repair': return 'Repairs';
    case 'trade': return 'Trading';
    case 'missions': return 'Missions';
    case 'upgrades': return 'Upgrades';
    case 'storage': return 'Storage';
    default: return service;
  }
}
