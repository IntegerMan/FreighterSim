/**
 * Cargo Store API Contract
 * 
 * Feature: Cargo Screen (SKY-4)
 * This file defines the public API for the cargoStore Pinia store.
 * 
 * @module stores/cargoStore
 */

import type { CargoItem, CargoType, CargoBay } from '@/models';

/**
 * Cargo store state interface
 * Note: Actual cargo items are stored in shipStore.cargoBay.items
 * This store provides computed access and mutation actions
 */
export interface CargoStoreState {
  // No direct state - cargo lives in shipStore
}

/**
 * Cargo store getters interface
 */
export interface CargoStoreGetters {
  /**
   * All cargo items currently in the cargo bay
   */
  readonly items: CargoItem[];

  /**
   * Cargo bay dimensions (width × depth)
   */
  readonly bayDimensions: { width: number; depth: number };

  /**
   * Total slot capacity (width × depth)
   */
  readonly totalSlots: number;

  /**
   * Number of slots currently occupied
   */
  readonly occupiedSlots: number;

  /**
   * Number of available (empty) slots
   */
  readonly availableSlots: number;

  /**
   * Whether cargo bay is at full capacity
   */
  readonly isFull: boolean;

  /**
   * Whether cargo bay is completely empty
   */
  readonly isEmpty: boolean;

  /**
   * Capacity usage as percentage (0-100)
   */
  readonly capacityPercent: number;

  /**
   * Cargo items grouped by type
   */
  readonly itemsByType: Map<CargoType, CargoItem[]>;

  /**
   * Count of unique cargo types currently loaded
   */
  readonly uniqueTypeCount: number;
}

/**
 * Cargo store actions interface
 */
export interface CargoStoreActions {
  /**
   * Load a cargo item into the cargo bay
   * @param item - The cargo item to load
   * @returns true if loaded successfully, false if bay is full
   */
  loadCargo(item: Omit<CargoItem, 'id'>): boolean;

  /**
   * Unload (remove) a cargo item by ID
   * @param itemId - The ID of the cargo item to remove
   * @returns The removed item, or null if not found
   */
  unloadCargo(itemId: string): CargoItem | null;

  /**
   * Remove all cargo from the cargo bay
   */
  clearCargo(): void;

  /**
   * Get all items of a specific type
   * @param type - The cargo type to filter by
   * @returns Array of matching cargo items
   */
  getItemsOfType(type: CargoType): CargoItem[];

  /**
   * Check if a specific item exists in cargo
   * @param itemId - The ID to check
   * @returns true if item exists
   */
  hasItem(itemId: string): boolean;

  /**
   * Get count of items matching a cargo type
   * @param type - The cargo type to count
   * @returns Number of items of that type
   */
  getCountByType(type: CargoType): number;
}

/**
 * Complete cargo store interface
 */
export interface CargoStore extends CargoStoreState, CargoStoreGetters, CargoStoreActions {}

/**
 * Hook to access the cargo store
 * @returns CargoStore instance
 */
export declare function useCargoStore(): CargoStore;

/**
 * Cargo item factory function signature
 * @param name - Display name for the cargo
 * @param type - Cargo type classification
 * @returns A new CargoItem with generated ID
 */
export declare function createCargoItem(name: string, type: CargoType): CargoItem;

/**
 * Default cargo bay configuration
 * Used when initializing new ships
 */
export declare const DEFAULT_CARGO_BAY: CargoBay;
