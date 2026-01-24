import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StarSystem, Waypoint, Vector2, Station, DockingPort } from '@/models';
import { updatePlanetOrbit, getAlignmentTolerance } from '@/models';
import { SHIP_DOCKING_BUFFER, getStationDockingPorts as getStationDockingPortsShared, getDockingRange, RUNWAY_LENGTH_FACTOR, RUNWAY_WIDTH } from '@/core/rendering';
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
    /** Whether approach vector is correct (always true - no longer enforced) */
    approachAligned: boolean;
    /** Required heading for ship to dock (ship will rotate to this during docking) */
    requiredHeading?: number;
    /** Whether the ship is within the approach runway lights corridor */
    nearLights?: boolean;
    /** Reason if not available */
    reason: string | null;
  }

  /**
   * Get all docking ports for a station in world coordinates.
   * Uses the shared utility from dockingUtils for consistent filtering and position calculation.
   * @param station - The station to get ports for
   * @returns Array of docking ports with world positions
   */
  function getStationDockingPorts(station: Station): Array<{ port: DockingPort; worldPosition: Vector2; worldApproachVector: Vector2 }> {
    // Use the shared utility which handles filtering and position calculation
    return getStationDockingPortsShared(station).map(({ port, worldPosition, worldApproachVector }) => ({
      port,
      worldPosition,
      worldApproachVector,
    }));
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

    // Find the nearest port that faces OUTWARD from the station
    // Filter out ports where the approach vector points toward station center
    let nearestPort: typeof ports[0] | null = null;
    let nearestDistance = Infinity;

    for (const portData of ports) {
      // Check if this port faces outward (approach vector points away from station center)
      // Port world position relative to station center
      const portRelativeX = portData.worldPosition.x - station.position.x;
      const portRelativeY = portData.worldPosition.y - station.position.y;
      
      // Dot product of port position and approach vector
      // Positive = approach vector points outward from station center
      const outwardDot = portRelativeX * portData.worldApproachVector.x + 
                        portRelativeY * portData.worldApproachVector.y;
      
      // Skip ports that face inward (would require going through station to dock)
      if (outwardDot < 0) continue;
      
      const dx = portData.worldPosition.x - shipPosition.x;
      const dy = portData.worldPosition.y - shipPosition.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPort = portData;
      }
    }

    // Fallback: if no outward-facing ports found, use the closest port anyway
    if (!nearestPort) {
      for (const portData of ports) {
        const dx = portData.worldPosition.x - shipPosition.x;
        const dy = portData.worldPosition.y - shipPosition.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPort = portData;
        }
      }
    }

    // nearestPort is guaranteed to be defined since ports.length > 0
    // TypeScript assertion since we checked ports.length > 0 at the start
    const port = nearestPort!;

    // Check range (T046) - include ship buffer for more forgiving docking
    const dockingRange = getDockingRange(port.port) + SHIP_DOCKING_BUFFER;
    const inRange = nearestDistance <= dockingRange;

    // Calculate required heading for ship's docking port to face station port
    // Ship should face INTO the port (opposite of station's approach vector)
    const requiredFacingX = -port.worldApproachVector.x;
    const requiredFacingY = -port.worldApproachVector.y;
    const requiredHeadingRad = Math.atan2(requiredFacingX, requiredFacingY);
    const requiredHeading = ((requiredHeadingRad * 180) / Math.PI + 360) % 360;

    // Check current heading alignment (T045)
    const shipHeadingRad = (shipHeading * Math.PI) / 180;
    const shipFacingX = Math.sin(shipHeadingRad);
    const shipFacingY = Math.cos(shipHeadingRad);
    
    // Calculate angle difference
    const facingDot = shipFacingX * requiredFacingX + shipFacingY * requiredFacingY;
    const alignmentAngleRad = Math.acos(Math.min(1, Math.max(-1, facingDot)));
    const alignmentAngle = (alignmentAngleRad * 180) / Math.PI;
    
    const tolerance = getAlignmentTolerance(port.port);
    const headingAligned = alignmentAngle <= tolerance;

    // Define runway parameters (same as visual runway) and compute a bounding box
    const baseDockingRange = getDockingRange(port.port);
    // Make runway slightly longer and wider to better cover lights visually
    const runwayLength = baseDockingRange * RUNWAY_LENGTH_FACTOR; // extended for approach
    const runwayWidth = RUNWAY_WIDTH; // world units (wider)

    // Vector from port to ship
    const relX = shipPosition.x - port.worldPosition.x;
    const relY = shipPosition.y - port.worldPosition.y;

    // Project ship vector onto approach vector (approach vector is normalized)
    const projDist = relX * port.worldApproachVector.x + relY * port.worldApproachVector.y;

    // Perpendicular distance from approach centerline
    const perpX = relX - projDist * port.worldApproachVector.x;
    const perpY = relY - projDist * port.worldApproachVector.y;
    const perpDist = Math.hypot(perpX, perpY);

    // Ship is near lights if it is in front of the port along the approach vector, within the runway length,
    // and close enough to the approach corridor width
    const nearLights = projDist > 0 && projDist <= runwayLength && perpDist <= runwayWidth;

    // Compute axis-aligned bounding box for runway corridor so UI code can highlight it
    // Four corners (in world coords) of the runway corridor rectangle
    const p1 = { x: port.worldPosition.x + port.worldApproachVector.x * 0 + (-port.worldApproachVector.y) * runwayWidth, y: port.worldPosition.y + port.worldApproachVector.y * 0 + (port.worldApproachVector.x) * runwayWidth };
    const p2 = { x: port.worldPosition.x + port.worldApproachVector.x * runwayLength + (-port.worldApproachVector.y) * runwayWidth, y: port.worldPosition.y + port.worldApproachVector.y * runwayLength + (port.worldApproachVector.x) * runwayWidth };
    const p3 = { x: port.worldPosition.x + port.worldApproachVector.x * runwayLength - (-port.worldApproachVector.y) * runwayWidth, y: port.worldPosition.y + port.worldApproachVector.y * runwayLength - (port.worldApproachVector.x) * runwayWidth };
    const p4 = { x: port.worldPosition.x + port.worldApproachVector.x * 0 - (-port.worldApproachVector.y) * runwayWidth, y: port.worldPosition.y + port.worldApproachVector.y * 0 - (port.worldApproachVector.x) * runwayWidth };

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    // Docking availability remains based on tight in-range check only to avoid moving visuals
    const available = inRange; // <-- REVERTED: do NOT change availability here
    let reason: string | null = null;
    if (!inRange) reason = 'Out of range';

    return {
      available,
      port: port.port,
      portWorldPosition: port.worldPosition,
      distance: nearestDistance,
      alignmentAngle,
      inRange,
      headingAligned,
      approachAligned: true, // Always true now - no approach requirement
      requiredHeading, // New: heading ship needs to rotate to for docking
      nearLights,
      runwayRect: { minX, minY, maxX, maxY },
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
   * Find the nearest available docking port across ALL stations
   * This allows docking without manually selecting a station first
   * @param shipPosition - Current ship position
   * @param shipHeading - Current ship heading in degrees
   * @returns The nearest port availability info, or null if no ports found
   */
  function findNearestDockingPort(
    shipPosition: Vector2,
    shipHeading: number
  ): (DockingPortAvailability & { station: Station }) | null {
    let nearestResult: (DockingPortAvailability & { station: Station }) | null = null;
    let nearestDistance = Infinity;

    for (const station of stations.value) {
      const status = checkDockingPortAvailability(station, shipPosition, shipHeading);
      
      if (status.port && status.distance < nearestDistance) {
        nearestDistance = status.distance;
        nearestResult = {
          ...status,
          station,
        };
      }
    }

    return nearestResult;
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
      
      // Include ship buffer for more forgiving docking
      const dockingRange = getDockingRange(portData.port) + SHIP_DOCKING_BUFFER;
      const inRange = distance <= dockingRange;
      
      // Calculate required heading for docking
      const requiredFacingX = -portData.worldApproachVector.x;
      const requiredFacingY = -portData.worldApproachVector.y;
      const requiredHeadingRad = Math.atan2(requiredFacingX, requiredFacingY);
      const requiredHeading = ((requiredHeadingRad * 180) / Math.PI + 360) % 360;
      
      // Check current heading alignment
      const shipHeadingRad = (shipHeading * Math.PI) / 180;
      const shipFacingX = Math.sin(shipHeadingRad);
      const shipFacingY = Math.cos(shipHeadingRad);
      const facingDot = shipFacingX * requiredFacingX + shipFacingY * requiredFacingY;
      const alignmentAngleRad = Math.acos(Math.min(1, Math.max(-1, facingDot)));
      const alignmentAngle = (alignmentAngleRad * 180) / Math.PI;
      const tolerance = getAlignmentTolerance(portData.port);
      const headingAligned = alignmentAngle <= tolerance;
      
      // Near-lights detection + runway rect (mirrors checkDockingPortAvailability)
      const baseDockingRange = getDockingRange(portData.port);
      // Slightly extended runway to match visual guidance area
      const runwayLength = baseDockingRange * RUNWAY_LENGTH_FACTOR;
      const runwayWidth = RUNWAY_WIDTH;

      const relX = shipPosition.x - portData.worldPosition.x;
      const relY = shipPosition.y - portData.worldPosition.y;
      const projDist = relX * portData.worldApproachVector.x + relY * portData.worldApproachVector.y;
      const perpX = relX - projDist * portData.worldApproachVector.x;
      const perpY = relY - projDist * portData.worldApproachVector.y;
      const perpDist = Math.hypot(perpX, perpY);
      const nearLights = projDist > 0 && projDist <= runwayLength && perpDist <= runwayWidth;

      // Compute runway bbox corners
      const p1 = { x: portData.worldPosition.x + portData.worldApproachVector.x * 0 + (-portData.worldApproachVector.y) * runwayWidth, y: portData.worldPosition.y + portData.worldApproachVector.y * 0 + (portData.worldApproachVector.x) * runwayWidth };
      const p2 = { x: portData.worldPosition.x + portData.worldApproachVector.x * runwayLength + (-portData.worldApproachVector.y) * runwayWidth, y: portData.worldPosition.y + portData.worldApproachVector.y * runwayLength + (portData.worldApproachVector.x) * runwayWidth };
      const p3 = { x: portData.worldPosition.x + portData.worldApproachVector.x * runwayLength - (-portData.worldApproachVector.y) * runwayWidth, y: portData.worldPosition.y + portData.worldApproachVector.y * runwayLength - (portData.worldApproachVector.x) * runwayWidth };
      const p4 = { x: portData.worldPosition.x + portData.worldApproachVector.x * 0 - (-portData.worldApproachVector.y) * runwayWidth, y: portData.worldPosition.y + portData.worldApproachVector.y * 0 - (portData.worldApproachVector.x) * runwayWidth };

      const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
      const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
      const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
      const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

      // Available only when inRange (do not toggle availability here)
      const available = inRange;
      let reason: string | null = null;
      if (!inRange) reason = 'Out of range';
      
      return {
        portId: portData.port.id,
        available,
        port: portData.port,
        portWorldPosition: portData.worldPosition,
        distance,
        alignmentAngle,
        inRange,
        headingAligned,
        approachAligned: true, // No longer enforced
        requiredHeading,
        reason,
        nearLights,
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
    findNearestDockingPort,
    validateApproachVector,
    validateHeadingAlignment,
    checkDockingRange,
    getAllDockingPortStatus,
  };
});
