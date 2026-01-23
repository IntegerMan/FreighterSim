import type { CargoItem } from './CargoItem';

/**
 * Cargo bay ship subsystem - defines capacity and contains cargo items
 * Follows ship composition pattern from ADR-0008
 */
export interface CargoBay {
  /** Number of slots across the bay (columns) */
  width: number;
  
  /** Number of slots deep in the bay (rows) */
  depth: number;
  
  /** Collection of cargo items currently loaded */
  items: CargoItem[];
}

/**
 * Default cargo bay configuration for new ships
 */
export const DEFAULT_CARGO_BAY: CargoBay = {
  width: 4,
  depth: 6,
  items: [],
};
