// Main Starfield renderer
export { Starfield } from './Starfield';

// Configuration utilities
export {
  DEFAULT_LAYER_CONFIGS,
  DEFAULT_CELL_SIZE,
  createDefaultStarfieldConfig,
} from './starfieldConfig';

// Star generation utilities (for advanced use cases)
export {
  mulberry32,
  hashString,
  generateStarsForCell,
  starToScreen,
  getVisibleCells,
} from './StarGenerator';
