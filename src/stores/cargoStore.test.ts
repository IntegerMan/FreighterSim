import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCargoStore, createCargoItem } from './cargoStore';

describe('cargoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should start with empty cargo', () => {
      const store = useCargoStore();
      expect(store.items).toEqual([]);
      expect(store.isEmpty).toBe(true);
    });

    it('should have default bay dimensions', () => {
      const store = useCargoStore();
      expect(store.bayDimensions).toEqual({ width: 4, depth: 6 });
    });

    it('should calculate total slots correctly', () => {
      const store = useCargoStore();
      expect(store.totalSlots).toBe(24); // 4 * 6
    });

    it('should show all slots as available when empty', () => {
      const store = useCargoStore();
      expect(store.availableSlots).toBe(24);
      expect(store.occupiedSlots).toBe(0);
    });

    it('should not be full when empty', () => {
      const store = useCargoStore();
      expect(store.isFull).toBe(false);
    });

    it('should have 0% capacity when empty', () => {
      const store = useCargoStore();
      expect(store.capacityPercent).toBe(0);
    });
  });

  describe('loadCargo', () => {
    it('should add cargo item to bay', () => {
      const store = useCargoStore();
      const result = store.loadCargo({ name: 'Dilithium Crystals', type: 'mineral' });
      
      expect(result).toBe(true);
      expect(store.items.length).toBe(1);
      expect(store.items[0]!.name).toBe('Dilithium Crystals');
      expect(store.items[0]!.type).toBe('mineral');
    });

    it('should generate unique ID for each item', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Item 1', type: 'supply' });
      store.loadCargo({ name: 'Item 2', type: 'supply' });
      
      expect(store.items[0]!.id).not.toBe(store.items[1]!.id);
    });

    it('should update occupied slots', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Test Cargo', type: 'equipment' });
      
      expect(store.occupiedSlots).toBe(1);
      expect(store.availableSlots).toBe(23);
    });

    it('should update capacity percent', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Test Cargo', type: 'equipment' });
      
      expect(store.capacityPercent).toBeCloseTo(4.167, 2); // 1/24 * 100
    });

    it('should prevent loading when full', () => {
      const store = useCargoStore();
      
      // Fill the cargo bay
      for (let i = 0; i < 24; i++) {
        store.loadCargo({ name: `Item ${i}`, type: 'supply' });
      }
      
      expect(store.isFull).toBe(true);
      
      // Try to add one more
      const result = store.loadCargo({ name: 'One More', type: 'supply' });
      
      expect(result).toBe(false);
      expect(store.items.length).toBe(24);
    });

    it('should set isFull when capacity reached', () => {
      const store = useCargoStore();
      
      for (let i = 0; i < 24; i++) {
        store.loadCargo({ name: `Item ${i}`, type: 'supply' });
      }
      
      expect(store.isFull).toBe(true);
      expect(store.capacityPercent).toBe(100);
    });
  });

  describe('unloadCargo', () => {
    it('should remove cargo by ID', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Test Item', type: 'mineral' });
      const itemId = store.items[0]!.id;
      
      const removed = store.unloadCargo(itemId);
      
      expect(removed).not.toBeNull();
      expect(removed?.name).toBe('Test Item');
      expect(store.items.length).toBe(0);
    });

    it('should return null for non-existent ID', () => {
      const store = useCargoStore();
      const result = store.unloadCargo('non-existent-id');
      expect(result).toBeNull();
    });

    it('should update slots after unloading', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Item 1', type: 'supply' });
      store.loadCargo({ name: 'Item 2', type: 'supply' });
      
      const itemId = store.items[0]!.id;
      store.unloadCargo(itemId);
      
      expect(store.occupiedSlots).toBe(1);
      expect(store.availableSlots).toBe(23);
    });
  });

  describe('clearCargo', () => {
    it('should remove all cargo', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Item 1', type: 'supply' });
      store.loadCargo({ name: 'Item 2', type: 'mineral' });
      store.loadCargo({ name: 'Item 3', type: 'hazmat' });
      
      store.clearCargo();
      
      expect(store.items.length).toBe(0);
      expect(store.isEmpty).toBe(true);
    });
  });

  describe('getItemsOfType', () => {
    it('should filter by cargo type', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Mineral 1', type: 'mineral' });
      store.loadCargo({ name: 'Supply 1', type: 'supply' });
      store.loadCargo({ name: 'Mineral 2', type: 'mineral' });
      
      const minerals = store.getItemsOfType('mineral');
      
      expect(minerals.length).toBe(2);
      expect(minerals.every(m => m.type === 'mineral')).toBe(true);
    });

    it('should return empty array for missing type', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Supply 1', type: 'supply' });
      
      const hazmat = store.getItemsOfType('hazmat');
      
      expect(hazmat).toEqual([]);
    });
  });

  describe('hasItem', () => {
    it('should return true for existing item', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Test Item', type: 'equipment' });
      const itemId = store.items[0]!.id;
      
      expect(store.hasItem(itemId)).toBe(true);
    });

    it('should return false for non-existent item', () => {
      const store = useCargoStore();
      expect(store.hasItem('fake-id')).toBe(false);
    });
  });

  describe('getCountByType', () => {
    it('should count items of a type', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Mineral 1', type: 'mineral' });
      store.loadCargo({ name: 'Mineral 2', type: 'mineral' });
      store.loadCargo({ name: 'Supply 1', type: 'supply' });
      
      expect(store.getCountByType('mineral')).toBe(2);
      expect(store.getCountByType('supply')).toBe(1);
      expect(store.getCountByType('hazmat')).toBe(0);
    });
  });

  describe('itemsByType', () => {
    it('should group items by type', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Mineral 1', type: 'mineral' });
      store.loadCargo({ name: 'Supply 1', type: 'supply' });
      store.loadCargo({ name: 'Mineral 2', type: 'mineral' });
      
      const grouped = store.itemsByType;
      
      expect(grouped.get('mineral')?.length).toBe(2);
      expect(grouped.get('supply')?.length).toBe(1);
      expect(grouped.has('hazmat')).toBe(false);
    });
  });

  describe('uniqueTypeCount', () => {
    it('should count unique cargo types', () => {
      const store = useCargoStore();
      store.loadCargo({ name: 'Mineral 1', type: 'mineral' });
      store.loadCargo({ name: 'Mineral 2', type: 'mineral' });
      store.loadCargo({ name: 'Supply 1', type: 'supply' });
      store.loadCargo({ name: 'Hazmat 1', type: 'hazmat' });
      
      expect(store.uniqueTypeCount).toBe(3);
    });

    it('should be 0 when empty', () => {
      const store = useCargoStore();
      expect(store.uniqueTypeCount).toBe(0);
    });
  });
});

describe('createCargoItem', () => {
  it('should create cargo item with generated ID', () => {
    const item = createCargoItem('Test Item', 'mineral');
    
    expect(item.id).toMatch(/^cargo-/);
    expect(item.name).toBe('Test Item');
    expect(item.type).toBe('mineral');
  });

  it('should generate unique IDs', () => {
    const item1 = createCargoItem('Item 1', 'supply');
    const item2 = createCargoItem('Item 2', 'supply');
    
    expect(item1.id).not.toBe(item2.id);
  });
});
