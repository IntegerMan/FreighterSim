import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StarSystem, Waypoint, Vector2, Station, DockingPort } from '@/models';
import { updatePlanetOrbit, getDockingRange, getAlignmentTolerance } from '@/models';
import type { GameTime } from '@/core/game-loop';
import { getStationTemplateById, getStationModule } from '@/data/shapes';

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
      const distance = Math.hypot(dx, dy);

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

  // =============================================================================
  // Docking Port System (T043-T046)
  // =============================================================================

  /**
   * Result of docking port availability check
   */
  interface DockingPortAvailability {
    /** Whether the port is available for docking */
    available: boolean;
    /** The docking port if available */
    port: DockingPort | null;
    /** World position of the port */
    portWorldPosition: Vector2 | null;
    /** Distance from ship to port */
    distance: number;
    /** Alignment angle difference in degrees */
    alignmentAngle: number;
    /** Whether ship is within range */
    inRange: boolean;
    /** Whether ship heading is aligned */
    headingAligned: boolean;
    /** Whether approach vector is correct */
    approachAligned: boolean;
    /** Reason if not available */
    reason: string | null;
  }

  /**
   * Get all docking ports for a station in world coordinates
   * @param station - The station to get ports for
   * @returns Array of docking ports with world positions
   */
  function getStationDockingPorts(station: Station): Array<{ port: DockingPort; worldPosition: Vector2; worldApproachVector: Vector2 }> {
    const templateId = station.templateId ?? station.type;
    const template = getStationTemplateById(templateId);
    if (!template) return [];

    const ports: Array<{ port: DockingPort; worldPosition: Vector2; worldApproachVector: Vector2 }> = [];
    const stationRotationRad = ((station.rotation ?? 0) * Math.PI) / 180;

    // Find docking modules in the template
    for (const modulePlacement of template.modules) {
      const module = getStationModule(modulePlacement.moduleType);
      if (!module?.dockingPorts) continue;

      const moduleRotationRad = (modulePlacement.rotation * Math.PI) / 180;
      const totalRotation = stationRotationRad + moduleRotationRad;

      for (const port of module.dockingPorts) {
        // Transform port position from module local → station local → world
        // First rotate by module rotation relative to station
        const moduleLocalX = port.position.x * Math.cos(moduleRotationRad) - port.position.y * Math.sin(moduleRotationRad);
        const moduleLocalY = port.position.x * Math.sin(moduleRotationRad) + port.position.y * Math.cos(moduleRotationRad);
        
        // Add module offset (already in station local coords)
        const stationLocalX = moduleLocalX * 40 + modulePlacement.position.x; // Module scale factor
        const stationLocalY = moduleLocalY * 40 + modulePlacement.position.y;
        
        // Rotate by station rotation and add station position
        const worldX = stationLocalX * Math.cos(stationRotationRad) - stationLocalY * Math.sin(stationRotationRad) + station.position.x;
        const worldY = stationLocalX * Math.sin(stationRotationRad) + stationLocalY * Math.cos(stationRotationRad) + station.position.y;

        // Transform approach vector
        const approachX = port.approachVector.x * Math.cos(totalRotation) - port.approachVector.y * Math.sin(totalRotation);
        const approachY = port.approachVector.x * Math.sin(totalRotation) + port.approachVector.y * Math.cos(totalRotation);

        ports.push({
          port,
          worldPosition: { x: worldX, y: worldY },
          worldApproachVector: { x: approachX, y: approachY },
        });
      }
    }

    return ports;
  }

  /**
   * T043: Check if a docking port is available for docking
   * @param station - The station to check
   * @param shipPosition - Current ship position
   * @param shipHeading - Current ship heading in degrees
   * @returns Availability information for the nearest suitable port
   */
  function checkDockingPortAvailability(
    station: Station,
    shipPosition: Vector2,
    shipHeading: number
  ): DockingPortAvailability {
    const ports = getStationDockingPorts(station);
    
    if (ports.length === 0) {
      return {
        available: false,
        port: null,
        portWorldPosition: null,
        distance: Infinity,
        alignmentAngle: 180,
        inRange: false,
        headingAligned: false,
        approachAligned: false,
        reason: 'Station has no docking ports',
      };
    }

    // Find the nearest port
    let nearestPort = ports[0];
    let nearestDistance = Infinity;

    for (const portData of ports) {
      const dx = portData.worldPosition.x - shipPosition.x;
      const dy = portData.worldPosition.y - shipPosition.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPort = portData;
      }
    }

    // nearestPort is guaranteed to be defined since ports.length > 0
    // TypeScript assertion since we checked ports.length > 0 at the start
    const port = nearestPort!;

    // Check range (T046)
    const dockingRange = getDockingRange(port.port);
    const inRange = nearestDistance <= dockingRange;

    // Check approach vector alignment (T044)
    const dx = port.worldPosition.x - shipPosition.x;
    const dy = port.worldPosition.y - shipPosition.y;
    const distToPort = Math.hypot(dx, dy);
    
    // Ship approach direction (normalized vector from ship to port)
    const shipApproachX = distToPort > 0 ? dx / distToPort : 0;
    const shipApproachY = distToPort > 0 ? dy / distToPort : 0;
    
    // Port approach vector (ship should approach FROM this direction, so ship faces opposite)
    // Dot product to check alignment
    const approachDot = shipApproachX * port.worldApproachVector.x + shipApproachY * port.worldApproachVector.y;
    const approachAligned = approachDot > 0.7; // ~45 degree tolerance for approach direction

    // Check heading alignment (T045)
    // Ship heading should be opposite to the approach vector (ship nose faces port)
    const shipHeadingRad = (shipHeading * Math.PI) / 180;
    // Ship facing direction (based on heading, 0° = up/north)
    const shipFacingX = Math.sin(shipHeadingRad);
    const shipFacingY = Math.cos(shipHeadingRad);
    
    // Ship should face INTO the port (opposite of approach vector)
    const requiredFacingX = -port.worldApproachVector.x;
    const requiredFacingY = -port.worldApproachVector.y;
    
    // Calculate angle difference
    const facingDot = shipFacingX * requiredFacingX + shipFacingY * requiredFacingY;
    const alignmentAngleRad = Math.acos(Math.min(1, Math.max(-1, facingDot)));
    const alignmentAngle = (alignmentAngleRad * 180) / Math.PI;
    
    const tolerance = getAlignmentTolerance(port.port);
    const headingAligned = alignmentAngle <= tolerance;

    // Determine availability
    const available = inRange && headingAligned && approachAligned;
    let reason: string | null = null;
    
    if (!inRange) {
      reason = `Out of range (${nearestDistance.toFixed(0)}/${dockingRange} units)`;
    } else if (!approachAligned) {
      reason = 'Approach from wrong direction';
    } else if (!headingAligned) {
      reason = `Heading misaligned (${alignmentAngle.toFixed(0)}° off, need <${tolerance}°)`;
    }

    return {
      available,
      port: port.port,
      portWorldPosition: port.worldPosition,
      distance: nearestDistance,
      alignmentAngle,
      inRange,
      headingAligned,
      approachAligned,
      reason,
    };
  }

  /**
   * T044: Validate approach vector alignment
   * Ships must approach the port from the correct direction
   */
  function validateApproachVector(
    shipPosition: Vector2,
    portPosition: Vector2,
    approachVector: Vector2
  ): { aligned: boolean; angle: number } {
    const dx = portPosition.x - shipPosition.x;
    const dy = portPosition.y - shipPosition.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist === 0) {
      return { aligned: true, angle: 0 };
    }
    
    // Normalize ship approach direction
    const shipApproachX = dx / dist;
    const shipApproachY = dy / dist;
    
    // Dot product with port approach vector
    const dot = shipApproachX * approachVector.x + shipApproachY * approachVector.y;
    const angle = Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);
    
    // Ship should be approaching FROM the approach vector direction (within ~45°)
    const aligned = dot > 0.7;
    
    return { aligned, angle };
  }

  /**
   * T045: Validate heading alignment with docking port
   * Ship heading must be within tolerance of required alignment
   */
  function validateHeadingAlignment(
    shipHeading: number,
    approachVector: Vector2,
    tolerance: number
  ): { aligned: boolean; angleDiff: number; requiredHeading: number } {
    // Required heading: ship faces opposite to approach vector
    // Convert approach vector to heading (0° = north)
    const approachHeading = Math.atan2(approachVector.x, approachVector.y) * (180 / Math.PI);
    const requiredHeading = (approachHeading + 180 + 360) % 360;
    
    // Calculate heading difference
    let angleDiff = Math.abs(shipHeading - requiredHeading);
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }
    
    const aligned = angleDiff <= tolerance;
    
    return { aligned, angleDiff, requiredHeading };
  }

  /**
   * T046: Check if ship is within docking range of a port
   */
  function checkDockingRange(
    shipPosition: Vector2,
    portPosition: Vector2,
    dockingRange: number
  ): { inRange: boolean; distance: number; percentage: number } {
    const dx = portPosition.x - shipPosition.x;
    const dy = portPosition.y - shipPosition.y;
    const distance = Math.hypot(dx, dy);
    
    return {
      inRange: distance <= dockingRange,
      distance,
      percentage: Math.min(100, (distance / dockingRange) * 100),
    };
  }

  /**
   * Get all available docking ports for a station with their status
   */
  function getAllDockingPortStatus(
    station: Station,
    shipPosition: Vector2,
    shipHeading: number
  ): Array<DockingPortAvailability & { portId: string }> {
    const ports = getStationDockingPorts(station);
    
    return ports.map(portData => {
      const dx = portData.worldPosition.x - shipPosition.x;
      const dy = portData.worldPosition.y - shipPosition.y;
      const distance = Math.hypot(dx, dy);
      
      const dockingRange = getDockingRange(portData.port);
      const inRange = distance <= dockingRange;
      
      // Check approach
      const distToPort = distance; // Already calculated above
      const shipApproachX = distToPort > 0 ? dx / distToPort : 0;
      const shipApproachY = distToPort > 0 ? dy / distToPort : 0;
      const approachDot = shipApproachX * portData.worldApproachVector.x + shipApproachY * portData.worldApproachVector.y;
      const approachAligned = approachDot > 0.7;
      
      // Check heading
      const shipHeadingRad = (shipHeading * Math.PI) / 180;
      const shipFacingX = Math.sin(shipHeadingRad);
      const shipFacingY = Math.cos(shipHeadingRad);
      const requiredFacingX = -portData.worldApproachVector.x;
      const requiredFacingY = -portData.worldApproachVector.y;
      const facingDot = shipFacingX * requiredFacingX + shipFacingY * requiredFacingY;
      const alignmentAngleRad = Math.acos(Math.min(1, Math.max(-1, facingDot)));
      const alignmentAngle = (alignmentAngleRad * 180) / Math.PI;
      const tolerance = getAlignmentTolerance(portData.port);
      const headingAligned = alignmentAngle <= tolerance;
      
      const available = inRange && headingAligned && approachAligned;
      let reason: string | null = null;
      if (!inRange) reason = 'Out of range';
      else if (!approachAligned) reason = 'Wrong approach';
      else if (!headingAligned) reason = 'Misaligned';
      
      return {
        portId: portData.port.id,
        available,
        port: portData.port,
        portWorldPosition: portData.worldPosition,
        distance,
        alignmentAngle,
        inRange,
        headingAligned,
        approachAligned,
        reason,
      };
    });
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
    // Docking port functions (T043-T046)
    getStationDockingPorts,
    checkDockingPortAvailability,
    validateApproachVector,
    validateHeadingAlignment,
    checkDockingRange,
    getAllDockingPortStatus,
  };
});
