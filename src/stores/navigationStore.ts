import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StarSystem } from '@/models';
import { updatePlanetOrbit } from '@/models';
import type { GameTime } from '@/core/game-loop';

/**
 * Navigation store - manages the current star system and celestial objects
 */
export const useNavigationStore = defineStore('navigation', () => {
  // Current system
  const currentSystem = ref<StarSystem | null>(null);

  // Selection state
  const selectedObjectId = ref<string | null>(null);
  const selectedObjectType = ref<'station' | 'planet' | 'jump-gate' | null>(null);

  // Map view state
  const mapZoom = ref(1);
  const mapCenterX = ref(0);
  const mapCenterY = ref(0);

  // Computed
  const systemName = computed(() => currentSystem.value?.name ?? 'Unknown System');
  
  const stations = computed(() => currentSystem.value?.stations ?? []);
  const planets = computed(() => currentSystem.value?.planets ?? []);
  const jumpGates = computed(() => currentSystem.value?.jumpGates ?? []);

  const selectedStation = computed(() => {
    if (selectedObjectType.value !== 'station' || !selectedObjectId.value) return null;
    return stations.value.find(s => s.id === selectedObjectId.value) ?? null;
  });

  const selectedPlanet = computed(() => {
    if (selectedObjectType.value !== 'planet' || !selectedObjectId.value) return null;
    return planets.value.find(p => p.id === selectedObjectId.value) ?? null;
  });

  // Actions
  function loadSystem(system: StarSystem) {
    currentSystem.value = system;
    clearSelection();
    resetMapView();
  }

  function selectStation(stationId: string) {
    selectedObjectId.value = stationId;
    selectedObjectType.value = 'station';
  }

  function selectPlanet(planetId: string) {
    selectedObjectId.value = planetId;
    selectedObjectType.value = 'planet';
  }

  function selectJumpGate(gateId: string) {
    selectedObjectId.value = gateId;
    selectedObjectType.value = 'jump-gate';
  }

  function clearSelection() {
    selectedObjectId.value = null;
    selectedObjectType.value = null;
  }

  function setMapZoom(zoom: number) {
    mapZoom.value = Math.max(0.1, Math.min(5, zoom));
  }

  function adjustMapZoom(delta: number) {
    setMapZoom(mapZoom.value + delta);
  }

  function setMapCenter(x: number, y: number) {
    mapCenterX.value = x;
    mapCenterY.value = y;
  }

  function resetMapView() {
    mapZoom.value = 1;
    mapCenterX.value = 0;
    mapCenterY.value = 0;
  }

  function update(gameTime: GameTime) {
    if (!currentSystem.value || gameTime.paused) return;

    // Update planet orbits
    currentSystem.value.planets = currentSystem.value.planets.map(planet => 
      updatePlanetOrbit(planet, gameTime.deltaTime)
    );
  }

  function reset() {
    currentSystem.value = null;
    clearSelection();
    resetMapView();
  }

  return {
    // State
    currentSystem,
    selectedObjectId,
    selectedObjectType,
    mapZoom,
    mapCenterX,
    mapCenterY,
    // Computed
    systemName,
    stations,
    planets,
    jumpGates,
    selectedStation,
    selectedPlanet,
    // Actions
    loadSystem,
    selectStation,
    selectPlanet,
    selectJumpGate,
    clearSelection,
    setMapZoom,
    adjustMapZoom,
    setMapCenter,
    resetMapView,
    update,
    reset,
  };
});
