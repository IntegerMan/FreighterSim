import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/stores/shipStore', () => ({ useShipStore: vi.fn() }));
vi.mock('@/stores/navigationStore', () => ({ useNavigationStore: vi.fn() }));
vi.mock('@/stores/sensorStore', () => ({ useSensorStore: vi.fn() }));
vi.mock('@/stores', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSensorStore: vi.fn(() => ({ stationContacts: [], radarSegments: [], contacts: [], sensorRange: 100, selectContact: vi.fn() })),
  };
});

import HelmView from './HelmView.vue';
import { useShipStore } from '@/stores/shipStore';
import { useNavigationStore } from '@/stores/navigationStore';

describe('HelmView docking behavior with runway lights', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('enables dock when nearLights and speed <= 5', async () => {
    const mockShipStore: any = {
      position: { x: 0, y: 0 },
      isDocked: false,
      speed: 4,
      heading: 0,
      targetSpeed: 0,
      engines: { maxSpeed: 100 },
      isTractorBeamActive: false,
      setTargetSpeed: vi.fn(),
      setTargetHeading: vi.fn(),
      dock: vi.fn(),
      engageTractorBeam: vi.fn(),
    };

    const mockNavStore: any = {
      selectedStation: null,
      findNearestDockingPort: vi.fn(() => ({
        port: { id: 'port-1' },
        portWorldPosition: { x: 100, y: 0 },
        distance: 120,
        station: { id: 'station-1', name: 'Station Alpha' },
        inRange: false,
        nearLights: true,
        available: false,
      })),
      planets: [],
      stations: [],
    };

    (useShipStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockShipStore);
    (useNavigationStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavStore);

    const wrapper = mount(HelmView, {
      global: { plugins: [createPinia()] },
    });

    await wrapper.vm.$nextTick();

    // Find the dock button and ensure it's enabled
    const dockButton = wrapper.findAll('button').find(b => b.text().includes('DOCK'));
    expect(dockButton).toBeTruthy();
    if (dockButton) {
      expect(dockButton.attributes('disabled')).toBeUndefined();
    }
  });
});