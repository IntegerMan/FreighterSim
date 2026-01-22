import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StarSystem, Waypoint, Vector2 } from '@/models';
import { updatePlanetOrbit } from '@/models';
import type { GameTime } from '@/core/game-loop';

// Distance threshold for waypoint reached detection (world units)
const WAYPOINT_REACHED_DISTANCE = 50;

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

  // Waypoint navigation
  const waypoints = ref<Waypoint[]>([]);
  const waypointCounter = ref(0);

  // Autopilot
  const autopilotEnabled = ref(false);

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

  const currentWaypoint = computed(() => {
    return waypoints.value.length > 0 ? waypoints.value[0] : null;
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

  // Waypoint management
  function addWaypoint(position: Vector2) {
    waypointCounter.value++;
    const waypoint: Waypoint = {
      id: `waypoint-${Date.now()}-${waypointCounter.value}`,
      position: { ...position },
      name: `Waypoint ${waypointCounter.value}`,
    };
    waypoints.value.push(waypoint);
  }

  function removeWaypoint(id: string) {
    const index = waypoints.value.findIndex(w => w.id === id);
    if (index !== -1) {
      waypoints.value.splice(index, 1);
    }
  }

  function clearWaypoints() {
    waypoints.value = [];
    waypointCounter.value = 0;
    // Note: Don't disable autopilot here - if user sets a new course, autopilot should follow it
  }

  function checkWaypointReached(shipPosition: Vector2) {
    if (currentWaypoint.value) {
      const dx = currentWaypoint.value.position.x - shipPosition.x;
      const dy = currentWaypoint.value.position.y - shipPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= WAYPOINT_REACHED_DISTANCE) {
        // Remove the reached waypoint
        removeWaypoint(currentWaypoint.value.id);
      }
    }
  }

  function getHeadingToWaypoint(shipPosition: Vector2, waypointPosition: Vector2): number {
    const dx = waypointPosition.x - shipPosition.x;
    const dy = waypointPosition.y - shipPosition.y;

    // Use standard 0=North (Up), 90=East (Right) system
    // Math.atan2(dx, dy) starts from 0 at North and goes clockwise
    const angleRad = Math.atan2(dx, dy);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Normalize to 0-360
    return (angleDeg + 360) % 360;
  }

  // Autopilot
  function toggleAutopilot() {
    autopilotEnabled.value = !autopilotEnabled.value;
  }

  function disableAutopilot() {
    autopilotEnabled.value = false;
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
    clearWaypoints();
  }

  return {
    // State
    currentSystem,
    selectedObjectId,
    selectedObjectType,
    mapZoom,
    mapCenterX,
    mapCenterY,
    waypoints,
    autopilotEnabled,
    // Computed
    systemName,
    stations,
    planets,
    jumpGates,
    selectedStation,
    selectedPlanet,
    currentWaypoint,
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
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    checkWaypointReached,
    getHeadingToWaypoint,
    toggleAutopilot,
    disableAutopilot,
    update,
    reset,
  };
});
