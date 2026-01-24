import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

// Mock stores used by HelmMap
vi.mock('@/stores/shipStore', () => ({ useShipStore: vi.fn() }));
vi.mock('@/stores/navigationStore', () => ({ useNavigationStore: vi.fn() }));
vi.mock('@/stores/sensorStore', () => ({ useSensorStore: vi.fn() }));
vi.mock('@/stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('@/stores', async (importOriginal) => {
  const actual = await importOriginal();
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
vi.mock('@/core/rendering', () => ({
  MAP_COLORS: { background: '#000', fill: '#fff', dockingPort: '#0f0', dockingPortRange: '#0a0', dockingPortUnavailable: '#555', jumpGate: '#0ff', selected: '#ff0' },
  drawGrid: vi.fn(),
  worldToScreen: vi.fn((pos: any) => ({ x: pos.x, y: pos.y })),
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
  drawCourseProjection: vi.fn(),
  drawShipIcon: vi.fn(),
}));

import HelmMap from './HelmMap.vue';
import { useShipStore } from '@/stores/shipStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { getStationTemplateById, getStationModule } from '@/data/shapes';
import * as rendering from '@/core/rendering';

describe('HelmMap docking indicator', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('shows DOCKED text when ship is docked at the target station', async () => {
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

    // Mount component
    const wrapper = mount(HelmMap, {
      global: {
        plugins: [createPinia()],
      },
    });

    // The global test setup defines a mock canvas context returned by getContext
    const ctx = (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>)();

    // Wait a tick for mounted hooks and render to execute
    await wrapper.vm.$nextTick();

    // Assert that fillText was called with 'DOCKED'
    const calls = (ctx.fillText as unknown as jest.Mock).mock.calls;
    const calledWithDocked = calls.some((c: any[]) => c[0] === 'DOCKED');
    expect(calledWithDocked).toBe(true);
  });

  it('draws runway bounding box and label when nearLights is true', async () => {
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

    // Spy on drawDockingPorts to capture options passed (activePortId should be set when nearLights is true)
    const spy = vi.spyOn(rendering, 'drawDockingPorts');
    const lightsSpy = vi.spyOn(rendering, 'drawRunwayLightsForPort');

    const wrapper = mount(HelmMap, { global: { plugins: [createPinia()] } });
    const ctx = (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>)();

    await wrapper.vm.$nextTick();

    const calls = (ctx.fillText as unknown as jest.Mock).mock.calls;
    const hasRunwayLabel = calls.some((c: any[]) => c[0] === 'RUNWAY');

    expect(hasRunwayLabel).toBe(true);

    // Ensure drawDockingPorts was called and the nearest out-of-range but nearby port is treated as active
    expect(spy).toHaveBeenCalled();
    const options = (spy.mock.calls[0] as any[])[3];
    expect(options.activePortId).toBe('port-1');

    // The guidance overlay should draw colored landing lights for the active nearby runway
    expect(lightsSpy).toHaveBeenCalled();
    const modeArg = (lightsSpy.mock.calls.find((c: any[]) => c[6] != null) as any[])[6];
    expect(modeArg).toBe('colored');
  });

  it('sets active port when nearest in-range so colored landing lights can be shown', async () => {
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

    const spy = vi.spyOn(rendering, 'drawDockingPorts');

    const wrapper = mount(HelmMap, { global: { plugins: [createPinia()] } });

    await wrapper.vm.$nextTick();

    expect(spy).toHaveBeenCalled();
    const options = (spy.mock.calls[0] as any[])[3];
    expect(options.activePortId).toBe('port-1');
  });

  it('shows colored landing lights when runway preview is visible (distance <= 60*portRange)', async () => {
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

    const drawPortsSpy = vi.spyOn(rendering, 'drawDockingPorts');
    const lightsSpy = vi.spyOn(rendering, 'drawRunwayLightsForPort');

    const wrapper = mount(HelmMap, { global: { plugins: [createPinia()] } });

    await wrapper.vm.$nextTick();

    // Ensure drawDockingPorts was called with activePortId set to this nearby runway
    expect(drawPortsSpy).toHaveBeenCalled();
    const options = (drawPortsSpy.mock.calls[0] as any[])[3];
    expect(options.activePortId).toBe('port-2');

    // Guidance overlay should call drawRunwayLightsForPort with 'colored' mode
    expect(lightsSpy).toHaveBeenCalled();
    const coloredCall = lightsSpy.mock.calls.find((c: any[]) => c[6] === 'colored');
    expect(coloredCall).toBeTruthy();
  });
});
