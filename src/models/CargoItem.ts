/**
 * Cargo type categories for classification and visual styling
 */
export type CargoType = 'mineral' | 'supply' | 'hazmat' | 'equipment' | 'luxury';

/**
 * A single cargo item occupying one slot in the cargo bay
 */
export interface CargoItem {
  /** Unique identifier for this cargo instance */
  id: string;
  
  /** Display name of the cargo (e.g., "Dilithium Crystals") */
  name: string;
  
  /** Category classification for filtering and display */
  type: CargoType;
}

/**
 * Color mapping for cargo types (LCARS design system)
 */
export const CARGO_TYPE_COLORS: Record<CargoType, string> = {
  mineral: '#f1df6f',   // gold/yellow
  supply: '#ffffff',    // white
  hazmat: '#cc4444',    // danger/red
  equipment: '#cc99cc', // purple
  luxury: '#99cc99',    // success/green
};
