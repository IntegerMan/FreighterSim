import { defineStore } from 'pinia';
import { computed } from 'vue';
import type { CargoItem, CargoType } from '@/models';
import { useShipStore } from './shipStore';

/**
 * Generate a unique ID for cargo items
 */
function generateId(): string {
  return `cargo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Factory function to create a new cargo item
 */
export function createCargoItem(name: string, type: CargoType): CargoItem {
  return {
    id: generateId(),
    name,
    type,
  };
}

/**
 * Cargo store - provides computed access to ship's cargo bay
 * and mutation actions for cargo management
 */
export const useCargoStore = defineStore('cargo', () => {
  const shipStore = useShipStore();

  // ========== Getters ==========

  /**
   * All cargo items currently in the cargo bay
   */
  const items = computed(() => shipStore.cargoBay.items);

  /**
   * Cargo bay dimensions (width × depth)
   */
  const bayDimensions = computed(() => ({
    width: shipStore.cargoBay.width,
    depth: shipStore.cargoBay.depth,
  }));

  /**
   * Total slot capacity (width × depth)
   */
  const totalSlots = computed(() => 
    shipStore.cargoBay.width * shipStore.cargoBay.depth
  );

  /**
   * Number of slots currently occupied
   */
  const occupiedSlots = computed(() => shipStore.cargoBay.items.length);

  /**
   * Number of available (empty) slots
   */
  const availableSlots = computed(() => totalSlots.value - occupiedSlots.value);

  /**
   * Whether cargo bay is at full capacity
   */
  const isFull = computed(() => occupiedSlots.value >= totalSlots.value);

  /**
   * Whether cargo bay is completely empty
   */
  const isEmpty = computed(() => shipStore.cargoBay.items.length === 0);

  /**
   * Capacity usage as percentage (0-100)
   */
  const capacityPercent = computed(() => {
    if (totalSlots.value === 0) return 0;
    return (occupiedSlots.value / totalSlots.value) * 100;
  });

  /**
   * Cargo items grouped by type
   */
  const itemsByType = computed(() => {
    const grouped = new Map<CargoType, CargoItem[]>();
    for (const item of shipStore.cargoBay.items) {
      const existing = grouped.get(item.type) ?? [];
      existing.push(item);
      grouped.set(item.type, existing);
    }
    return grouped;
  });

  /**
   * Count of unique cargo types currently loaded
   */
  const uniqueTypeCount = computed(() => itemsByType.value.size);

  // ========== Actions ==========

  /**
   * Load a cargo item into the cargo bay
   * @param itemData - The cargo item data (without id)
   * @returns true if loaded successfully, false if bay is full
   */
  function loadCargo(itemData: Omit<CargoItem, 'id'>): boolean {
    if (isFull.value) {
      console.warn('[cargoStore] Cannot load cargo: bay is full');
      return false;
    }
    
    const item = createCargoItem(itemData.name, itemData.type);
    shipStore.cargoBay.items.push(item);
    return true;
  }

  /**
   * Unload (remove) a cargo item by ID
   * @param itemId - The ID of the cargo item to remove
   * @returns The removed item, or null if not found
   */
  function unloadCargo(itemId: string): CargoItem | null {
    const index = shipStore.cargoBay.items.findIndex(item => item.id === itemId);
    if (index === -1) {
      return null;
    }
    const [removed] = shipStore.cargoBay.items.splice(index, 1);
    return removed ?? null;
  }

  /**
   * Remove all cargo from the cargo bay
   */
  function clearCargo(): void {
    shipStore.cargoBay.items.length = 0;
  }

  // ========== Helper Functions ==========

  /**
   * Get all items of a specific type
   * @param type - The cargo type to filter by
   * @returns Array of matching cargo items
   */
  function getItemsOfType(type: CargoType): CargoItem[] {
    return shipStore.cargoBay.items.filter(item => item.type === type);
  }

  /**
   * Check if a specific item exists in cargo
   * @param itemId - The ID to check
   * @returns true if item exists
   */
  function hasItem(itemId: string): boolean {
    return shipStore.cargoBay.items.some(item => item.id === itemId);
  }

  /**
   * Get count of items matching a cargo type
   * @param type - The cargo type to count
   * @returns Number of items of that type
   */
  function getCountByType(type: CargoType): number {
    return shipStore.cargoBay.items.filter(item => item.type === type).length;
  }

  return {
    // Getters
    items,
    bayDimensions,
    totalSlots,
    occupiedSlots,
    availableSlots,
    isFull,
    isEmpty,
    capacityPercent,
    itemsByType,
    uniqueTypeCount,
    // Actions
    loadCargo,
    unloadCargo,
    clearCargo,
    // Helpers
    getItemsOfType,
    hasItem,
    getCountByType,
  };
});
