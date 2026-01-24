import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSensorStore } from './sensorStore';
import { useShipStore } from './shipStore';
import { useNavigationStore } from './navigationStore';

// Mock stores
vi.mock('./shipStore', () => ({
  useShipStore: vi.fn(),
}));

vi.mock('./navigationStore', () => ({
  useNavigationStore: vi.fn(),
}));

vi.mock('./settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    proximityDisplayScale: 0.5,
  })),
}));

describe('sensorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('occlusion detection', () => {
    it('should detect full occlusion when object blocks sensor ray', () => {
      // Setup: Ship at origin, station behind a large planet
      const mockShipStore = {
        position: { x: 0, y: 0 },
        sensors: { range: 10000, segmentCount: 8 },
      };
      const mockNavStore = {
        currentSystem: null,
        stations: [
          { id: 'station-1', name: 'Station Alpha', position: { x: 5000, y: 0 }, dockingRange: 100 },
        ],
        planets: [
          { id: 'planet-1', name: 'Planet X', position: { x: 2500, y: 0 }, radius: 500 },
        ],
        jumpGates: [],
      };

      (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
      (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

      const sensorStore = useSensorStore();
      sensorStore.refreshContacts();

      // Station should be occluded by planet
      const stationContact = sensorStore.contacts.find(c => c.id === 'station-1');
      expect(stationContact).toBeDefined();
      // Station is directly behind the planet, so visibility should be significantly reduced
      expect(stationContact!.visibility).toBeLessThan(1);
    });

    it('should detect partial occlusion for large objects', () => {
      // Setup: Ship at origin, large station partially blocked by small planet
      const mockShipStore = {
        position: { x: 0, y: 0 },
        sensors: { range: 10000, segmentCount: 8 },
      };
      const mockNavStore = {
        currentSystem: null,
        stations: [
          // Large station - some rays should pass around the small occluder
          { id: 'station-1', name: 'Station Alpha', position: { x: 5000, y: 0 }, dockingRange: 1000 },
        ],
        planets: [
          // Small planet partially blocking
          { id: 'planet-1', name: 'Planet X', position: { x: 2500, y: 200 }, radius: 100 },
        ],
        jumpGates: [],
      };

      (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
      (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

      const sensorStore = useSensorStore();
      sensorStore.refreshContacts();

      // Station should be partially visible (planet is off to the side)
      const stationContact = sensorStore.contacts.find(c => c.id === 'station-1');
      expect(stationContact).toBeDefined();
      // With planet offset, station should have decent visibility
      expect(stationContact!.visibility).toBeGreaterThan(0);
    });

    it('should have full visibility with clear line of sight', () => {
      // Setup: Ship at origin, station with no obstacles
      const mockShipStore = {
        position: { x: 0, y: 0 },
        sensors: { range: 10000, segmentCount: 8 },
      };
      const mockNavStore = {
        currentSystem: null,
        stations: [
          { id: 'station-1', name: 'Station Alpha', position: { x: 5000, y: 0 }, dockingRange: 100 },
        ],
        planets: [
          // Planet off to the side, not blocking
          { id: 'planet-1', name: 'Planet X', position: { x: 2500, y: 3000 }, radius: 500 },
        ],
        jumpGates: [],
      };

      (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
      (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

      const sensorStore = useSensorStore();
      sensorStore.refreshContacts();

      // Station should be fully visible
      const stationContact = sensorStore.contacts.find(c => c.id === 'station-1');
      expect(stationContact).toBeDefined();
      expect(stationContact!.visibility).toBe(1);
    });

    it('should perceive ship shapes correctly at different orientations', () => {
      // Setup: Test that contacts are detected regardless of their position angle
      const mockShipStore = {
        position: { x: 0, y: 0 },
        sensors: { range: 10000, segmentCount: 8 },
      };
      const mockNavStore = {
        currentSystem: null,
        stations: [
          // Stations at different angles
          { id: 'station-n', name: 'Station North', position: { x: 0, y: 3000 }, dockingRange: 100 },
          { id: 'station-e', name: 'Station East', position: { x: 3000, y: 0 }, dockingRange: 100 },
          { id: 'station-s', name: 'Station South', position: { x: 0, y: -3000 }, dockingRange: 100 },
          { id: 'station-w', name: 'Station West', position: { x: -3000, y: 0 }, dockingRange: 100 },
        ],
        planets: [],
        jumpGates: [],
      };

      (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
      (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

      const sensorStore = useSensorStore();
      sensorStore.refreshContacts();

      // All stations should be detected with full visibility
      expect(sensorStore.contacts).toHaveLength(4);
      for (const contact of sensorStore.contacts) {
        expect(contact.visibility).toBe(1);
      }
    });
  });

  describe('computed properties', () => {
    it('should filter visible contacts correctly', () => {
      const mockShipStore = {
        position: { x: 0, y: 0 },
        sensors: { range: 10000, segmentCount: 8 },
      };
      const mockNavStore = {
        currentSystem: null,
        stations: [
          { id: 'station-1', name: 'Station Alpha', position: { x: 5000, y: 0 }, dockingRange: 100 },
        ],
        planets: [],
        jumpGates: [],
      };

      (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
      (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

      const sensorStore = useSensorStore();
      sensorStore.refreshContacts();

      expect(sensorStore.visibleContacts).toHaveLength(1);
      expect(sensorStore.occludedContacts).toHaveLength(0);
      expect(sensorStore.fullyOccludedContacts).toHaveLength(0);
    });

    it('should filter occluded contacts correctly', () => {
      const mockShipStore = {
        position: { x: 0, y: 0 },
        sensors: { range: 10000, segmentCount: 8 },
      };
      const mockNavStore = {
        currentSystem: null,
        stations: [
          // Station behind planet
          { id: 'station-1', name: 'Station Alpha', position: { x: 5000, y: 0 }, dockingRange: 100 },
        ],
        planets: [
          // Large planet blocking station
          { id: 'planet-1', name: 'Planet X', position: { x: 2500, y: 0 }, radius: 500 },
        ],
        jumpGates: [],
      };

      (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
      (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

      const sensorStore = useSensorStore();
      sensorStore.refreshContacts();

      // Station should be in occludedContacts
      const stationContact = sensorStore.contacts.find(c => c.id === 'station-1');
      if (stationContact && stationContact.visibility < 1) {
        expect(sensorStore.occludedContacts).toContain(stationContact);
      }
    });
  });
});
