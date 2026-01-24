/**
 * Shape Data Exports
 * 
 * Central export point for all shape definitions.
 * 
 * @module data/shapes
 */

// Player ship
export {
  PLAYER_SHIP_SHAPE,
  PLAYER_SHIP_ENGINES,
  PLAYER_SHIP_TEMPLATE,
} from './playerShip';

// NPC ships
export {
  FREIGHTER_SHAPE,
  FREIGHTER_ENGINES,
  FREIGHTER_TEMPLATE,
  CUTTER_SHAPE,
  CUTTER_ENGINES,
  CUTTER_TEMPLATE,
  CRUISER_SHAPE,
  CRUISER_ENGINES,
  CRUISER_TEMPLATE,
  DESTROYER_SHAPE,
  DESTROYER_ENGINES,
  DESTROYER_TEMPLATE,
  LINER_SHAPE,
  LINER_ENGINES,
  LINER_TEMPLATE,
  NPC_SHIP_TEMPLATES,
} from './npcShips';

// Station modules
export {
  CORE_SHAPE,
  CORE_MODULE,
  DOCKING_RING_SHAPE,
  DOCKING_RING_MODULE,
  HABITAT_SHAPE,
  HABITAT_MODULE,
  CARGO_SHAPE,
  CARGO_MODULE,
  SOLAR_ARRAY_SHAPE,
  SOLAR_ARRAY_MODULE,
  ANTENNA_SHAPE,
  ANTENNA_MODULE,
  REFINERY_SHAPE,
  REFINERY_MODULE,
  COMMAND_SHAPE,
  COMMAND_MODULE,
  CORRIDOR_SHAPE,
  CORRIDOR_MODULE,
  SHORT_CORRIDOR_SHAPE,
  SHORT_CORRIDOR_MODULE,
  STATION_MODULES,
  getStationModule,
} from './stationModules';

// Station templates
export {
  TRADING_HUB_TEMPLATE,
  MINING_OUTPOST_TEMPLATE,
  FUEL_DEPOT_TEMPLATE,
  STATION_TEMPLATES,
  getStationTemplate,
  getStationTemplateByType,
} from './stations';

// Station layout system (connection-based)
export {
  buildStationFromGraph,
  buildTradingHub,
  buildMiningOutpost,
  buildFuelDepot,
  calculateStationBoundingRadius,
  getTradingHubBoundingRadius,
  getMiningOutpostBoundingRadius,
  getFuelDepotBoundingRadius,
  TRADING_HUB_GRAPH,
  MINING_OUTPOST_GRAPH,
  FUEL_DEPOT_GRAPH,
} from './stationLayout';

// Registries
export {
  SHIP_REGISTRY,
  getShipTemplate,
  getAllShipTemplates,
  getShipTemplatesByCategory,
} from './shipRegistry.ts';

export {
  STATION_REGISTRY,
  getStationTemplateById,
  getAllStationTemplates,
  getStationTemplatesByType,
} from './stationRegistry.ts';
