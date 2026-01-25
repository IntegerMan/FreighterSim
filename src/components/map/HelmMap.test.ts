import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

// Mock stores used by HelmMap
vi.mock('@/stores/shipStore', () => ({ useShipStore: vi.fn() }));
vi.mock('@/stores/navigationStore', () => ({ useNavigationStore: vi.fn() }));
vi.mock('@/stores/sensorStore', () => ({ useSensorStore: vi.fn() }));
vi.mock('@/stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('@/stores', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    useShipCollision: vi.fn(() => ({ updateCollisionWarnings: vi.fn(), warnings: { value: [] }, highestWarningLevel: { value: 'none' } })),
    useSettingsStore: vi.fn(() => ({ showRadarOverlay: false, toggleRadarOverlay: vi.fn() })),
  };
});

// Mock shape helpers
vi.mock('@/data/shapes', () => ({
  getStationTemplateById: vi.fn(),
  getStationModule: vi.fn(),
  getShipTemplate: vi.fn(() => null),
}));

// Stub heavy rendering functions to prevent full shape rendering during tests
vi.mock('@/core/rendering', () => {
  // Create a mock class for PixiRenderer
  class MockPixiRenderer {
    initialize = vi.fn().mockResolvedValue(undefined);
    getCanvas = vi.fn(() => document.createElement('canvas'));
    getLayer = vi.fn(() => ({ addChild: vi.fn() }));
    resize = vi.fn();
    destroy = vi.fn();
  }

  return {
    MAP_COLORS: { background: '#000', fill: '#fff', dockingPort: '#0f0', dockingPortRange: '#0a0', dockingPortUnavailable: '#555', jumpGate: '#0ff', selected: '#ff0' },
    drawGrid: vi.fn(),
    worldToScreen: vi.fn((pos: any) => ({ x: pos.x, y: pos.y })),
    screenToWorld: vi.fn((pos: any) => ({ x: pos.x, y: pos.y })),
    drawOrbit: vi.fn(),
    drawStation: vi.fn(),
    drawJumpGate: vi.fn(),
    drawDockingPorts: vi.fn(),
    drawRunwayLightsForPort: vi.fn(),
    drawRunwayLabel: vi.fn(),
    drawRunwayBoundingBox: vi.fn(),
    getDockingRange: vi.fn(() => 10),
    getVisualDockingRange: vi.fn((r: number) => r),
    RUNWAY_LENGTH_FACTOR: 60,
    STATION_VISUAL_MULTIPLIER: 1,
    renderStationWithLOD: vi.fn(),
    renderPixiShapeWithLOD: vi.fn(),
    findModuleAtScreenPosition: vi.fn(() => ({ hit: false })),
    drawCourseProjection: vi.fn(),
    drawShipIcon: vi.fn(),
    // PixiJS-related mocks
    PixiRenderer: MockPixiRenderer,
    detectCapabilities: vi.fn(() => ({ selected: 'WebGL2', fallbackReason: null })),
    meetsMinimumRequirements: vi.fn(() => true),
  };
});

import HelmMap from './HelmMap.vue';
import { useShipStore } from '@/stores/shipStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { getStationTemplateById, getStationModule } from '@/data/shapes';

describe('HelmMap docking indicator', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('mounts successfully when ship is docked at a station', async () => {
    // Prepare mock ship store (docked at station-1)
    const mockShipStore = {
      position: { x: 0, y: 0 },
      heading: 0,
      speed: 0,
      isDocked: true,
      dockedAtId: 'station-1',
      templateId: 'firefly',
      size: 40,
      tractorBeam: { active: false },
    } as unknown as ReturnType<typeof useShipStore>;

    // Prepare mock navigation store with a nearest docking port
    const mockNavStore = {
      findNearestDockingPort: vi.fn(() => ({
        port: { id: 'port-1' },
        portWorldPosition: { x: 100, y: 0 },
        distance: 0,
        station: { id: 'station-1', name: 'Station Alpha', templateId: 'trading-hub', rotation: 0 },
        inRange: true,
      })),
      selectedStation: null,
      stations: [ { id: 'station-1', name: 'Station Alpha', templateId: 'trading-hub', rotation: 0, position: { x: 100, y: 0 }, dockingRange: 200 } ],
      planets: [],
      checkWaypointReached: vi.fn(),
      getStationDockingPorts: vi.fn(() => [
        { port: { id: 'port-1', approachVector: { x: 0, y: -1 } }, worldPosition: { x: 100, y: 0 }, worldApproachVector: { x: 0, y: -1 } },
      ]),
    } as any;

    const mockTemplate = {
      modules: [ { moduleType: 'core', rotation: 0 } ],
      boundingRadius: 20,
    } as any;

    const mockModule = {
      dockingPorts: [ { id: 'port-1', approachVector: { x: 0, y: -1 } } ],
    } as any;

    (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
    (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);
    (getStationTemplateById as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockTemplate);
    (getStationModule as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockModule);

    // Mount component - verify it renders without throwing
    const wrapper = mount(HelmMap, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Wait for async render
    await wrapper.vm.$nextTick();

    // Verify the component mounted successfully
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.helm-map').exists()).toBe(true);
  });

  it('mounts successfully when ship is near a station with nearLights', async () => {
    const mockShipStore = {
      position: { x: 0, y: 0 },
      heading: 0,
      speed: 2,
      isDocked: false,
      templateId: 'firefly',
      size: 40,
      tractorBeam: { active: false },
    } as any;

    const mockNavStore = {
      findNearestDockingPort: vi.fn(() => ({
        port: { id: 'port-1' },
        portWorldPosition: { x: 100, y: 0 },
        distance: 50,
        station: { id: 'station-1', name: 'Station Alpha', templateId: 'trading-hub', rotation: 0 },
        inRange: false,
        nearLights: true,
      })),
      selectedStation: null,
      stations: [ { id: 'station-1', name: 'Station Alpha', templateId: 'trading-hub', rotation: 0, position: { x: 100, y: 0 }, dockingRange: 200 } ],
      planets: [],
      checkWaypointReached: vi.fn(),
      getStationDockingPorts: vi.fn(() => [
        { port: { id: 'port-1', approachVector: { x: 0, y: -1 } }, worldPosition: { x: 100, y: 0 }, worldApproachVector: { x: 0, y: -1 } },
      ]),
    } as any;

    const mockTemplate = {
      modules: [ { moduleType: 'core', rotation: 0 } ],
      boundingRadius: 20,
    } as any;

    const mockModule = {
      dockingPorts: [ { id: 'port-1', approachVector: { x: 0, y: -1 } } ],
    } as any;

    (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
    (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);
    (getStationTemplateById as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockTemplate);
    (getStationModule as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockModule);

    const wrapper = mount(HelmMap, { global: { plugins: [createPinia()] } });

    await wrapper.vm.$nextTick();

    // Verify the component renders successfully
    expect(wrapper.exists()).toBe(true);
  });

  it('mounts successfully when nearest port is in-range', async () => {
    const mockShipStore = {
      position: { x: 0, y: 0 },
      heading: 0,
      speed: 2,
      isDocked: false,
      templateId: 'firefly',
      size: 40,
      tractorBeam: { active: false },
    } as any;

    const mockNavStore = {
      findNearestDockingPort: vi.fn(() => ({
        port: { id: 'port-1' },
        portWorldPosition: { x: 100, y: 0 },
        distance: 10,
        station: { id: 'station-1', name: 'Station Alpha', templateId: 'trading-hub', rotation: 0 },
        inRange: true,
        nearLights: true,
      })),
      selectedStation: null,
      stations: [ { id: 'station-1', name: 'Station Alpha', templateId: 'trading-hub', rotation: 0, position: { x: 100, y: 0 }, dockingRange: 200 } ],
      planets: [],
      checkWaypointReached: vi.fn(),
      getStationDockingPorts: vi.fn(() => [
        { port: { id: 'port-1', approachVector: { x: 0, y: -1 } }, worldPosition: { x: 100, y: 0 }, worldApproachVector: { x: 0, y: -1 } },
      ]),
    } as any;

    const mockTemplate = {
      modules: [ { moduleType: 'core', rotation: 0 } ],
      boundingRadius: 20,
    } as any;

    const mockModule = {
      dockingPorts: [ { id: 'port-1', approachVector: { x: 0, y: -1 } } ],
    } as any;

    (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
    (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);
    (getStationTemplateById as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockTemplate);
    (getStationModule as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockModule);

    const wrapper = mount(HelmMap, { global: { plugins: [createPinia()] } });

    await wrapper.vm.$nextTick();

    // Verify component renders without crashing
    expect(wrapper.exists()).toBe(true);
  });

  it('mounts successfully when within runway preview distance', async () => {
    const mockShipStore = {
      position: { x: 0, y: 0 },
      heading: 0,
      speed: 2,
      isDocked: false,
      templateId: 'firefly',
      size: 40,
      tractorBeam: { active: false },
    } as any;

    // Set a distance less than the preview threshold (60 * portRange)
    const mockNavStore = {
      findNearestDockingPort: vi.fn(() => ({
        port: { id: 'port-2' },
        portWorldPosition: { x: 200, y: 0 },
        distance: 400, // assume portRange ~ 10 => 60*10 = 600, 400 < 600 => preview visible
        station: { id: 'station-2', name: 'Station Beta', templateId: 'trading-hub', rotation: 0 },
        inRange: false,
        nearLights: false,
      })),
      selectedStation: null,
      stations: [ { id: 'station-2', name: 'Station Beta', templateId: 'trading-hub', rotation: 0, position: { x: 200, y: 0 }, dockingRange: 200 } ],
      planets: [],
      checkWaypointReached: vi.fn(),
      getStationDockingPorts: vi.fn(() => [
        { port: { id: 'port-2', approachVector: { x: 0, y: -1 } }, worldPosition: { x: 200, y: 0 }, worldApproachVector: { x: 0, y: -1 } },
      ]),
    } as any;

    const mockTemplate = {
      modules: [ { moduleType: 'core', rotation: 0 } ],
      boundingRadius: 20,
    } as any;

    const mockModule = {
      dockingPorts: [ { id: 'port-2', approachVector: { x: 0, y: -1 } } ],
    } as any;

    (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
    (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);
    (getStationTemplateById as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockTemplate);
    (getStationModule as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockModule);

    const wrapper = mount(HelmMap, { global: { plugins: [createPinia()] } });

    await wrapper.vm.$nextTick();

    // Verify the component renders and no errors occur
    expect(wrapper.exists()).toBe(true);
  });
});
