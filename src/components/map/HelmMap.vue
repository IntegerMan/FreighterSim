<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useShipStore, useNavigationStore, useSensorStore, useSettingsStore, useShipCollision, type CollisionWarningLevel } from '@/stores';
import { useGameLoop } from '@/core/game-loop';
import {
  MAP_COLORS,
  worldToScreen,
  screenToWorld,
  drawGrid,
  drawShipIcon,
  drawCourseProjection,
  drawWaypoint,
  drawWaypointPath,
  renderShapeWithLOD,
  renderEngineMounts,
  getShapeScreenSize,
  renderStationWithLOD,
  northUpToCanvasArcRad,
  findModuleAtScreenPosition,
  STATION_VISUAL_MULTIPLIER,
  getVisualDockingRange,
  drawDockingPorts as drawDockingPortsShared,
  drawRunwayLightsForPort,
  getDockingRange,
  RUNWAY_LENGTH_FACTOR,
  type CameraState,
} from '@/core/rendering';
import { Starfield, createDefaultStarfieldConfig } from '@/core/starfield';
import { isPortNearby, shouldShowColoredLandingLights, computeRunwayCorners } from '@/core/rendering/dockingGuidance';
import { getShipTemplate, getStationTemplateById, getStationModule } from '@/data/shapes';
import type { Vector2, Station, Planet, JumpGate } from '@/models';
import { getThreatLevelColor } from '@/models';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const settingsStore = useSettingsStore();
const collision = useShipCollision();
const { subscribe } = useGameLoop();

// Starfield background
const starfield = ref<Starfield | null>(null);

// Initialize starfield when system is available
watch(
  () => navStore.currentSystem,
  (system) => {
    if (system) {
      const config = createDefaultStarfieldConfig(system.id);
      starfield.value = new Starfield(config);
    } else {
      starfield.value = null;
    }
  },
  { immediate: true }
);

// Canvas state - higher default zoom for helm, ship-centric
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const zoom = ref(1.8); // Higher default zoom for close navigation
const panOffset = ref<Vector2>({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref<Vector2>({ x: 0, y: 0 });

// Always follow ship in helm view
const cameraCenter = computed(() => ({
  x: shipStore.position.x + panOffset.value.x,
  y: shipStore.position.y + panOffset.value.y,
}));

const camera = computed<CameraState>(() => ({
  zoom: zoom.value,
  panOffset: panOffset.value,
  centerX: cameraCenter.value.x,
  centerY: cameraCenter.value.y,
  canvasWidth: canvasWidth.value,
  canvasHeight: canvasHeight.value,
}));

// Collision warning colors
const COLLISION_COLORS: Record<CollisionWarningLevel, string> = {
  none: 'transparent',
  caution: '#FFCC00',    // Yellow
  warning: '#FF6600',    // Orange
  danger: '#FF0000',     // Red
};

// Module tooltip state
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipContent = ref<{
  stationName: string;
  moduleName: string;
  moduleType: string;
  moduleStatus: string;
} | null>(null);

// Format module type for display
function formatModuleType(type: string): string {
  return type.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Get module status (could be extended with actual status data)
function getModuleStatus(_moduleType: string): string {
  // Could check against a station's module status if we track that
  return 'Operational';
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = MAP_COLORS.background;
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

  // Draw starfield background (before grid, behind everything)
  if (starfield.value) {
    starfield.value.render(ctx, camera.value);
  }

  // Draw grid
  drawGrid(ctx, camera.value);

  // Draw radar overlay if enabled
  if (settingsStore.showRadarOverlay) {
    drawRadarOverlay(ctx);
  }

  // Draw star (if visible)
  if (navStore.currentSystem?.star) {
    drawStar(ctx);
  }

  // Draw orbits
  for (const planet of (navStore.planets ?? [])) {
    drawOrbit(ctx, planet);
  }

  // Draw planets
  for (const planet of (navStore.planets ?? [])) {
    drawPlanet(ctx, planet);
  }

  // Determine the active docking port (for colored landing lights)
  // Prefer selected station, otherwise nearest slot. Use helper to centralize logic.
  let activePortId: string | null = null;
  const selectedStation = navStore.selectedStation;
  if (selectedStation) {
    const dockingStatus = navStore.checkDockingPortAvailability(
      selectedStation,
      shipStore.position,
      shipStore.heading
    );

    if (dockingStatus?.port && isPortNearby(dockingStatus, getDockingRange, RUNWAY_LENGTH_FACTOR)) {
      const nearestPort = navStore.findNearestDockingPort(shipStore.position, shipStore.heading);
      if (nearestPort?.port?.id === dockingStatus.port.id) {
        activePortId = dockingStatus.port.id;
      }
    }
  } else {
    const nearestPort = navStore.findNearestDockingPort(shipStore.position, shipStore.heading);
    if (nearestPort?.port && isPortNearby(nearestPort, getDockingRange, RUNWAY_LENGTH_FACTOR)) {
      activePortId = nearestPort.port.id;
    }
  }

  // Draw stations
  for (const station of (navStore.stations ?? [])) {
    drawStation(ctx, station, activePortId);
  }

  // Draw jump gates
  for (const gate of (navStore.jumpGates ?? [])) {
    drawJumpGate(ctx, gate);
  }

  // Draw course projection (helm-specific) - color changes with reverse
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const isReversing = shipStore.speed < 0 || shipStore.targetSpeed < 0;
  drawCourseProjection(ctx, shipScreenPos, shipStore.heading, shipStore.speed, camera.value, 20, isReversing);

  // Draw waypoint paths
  const waypoints = (navStore.waypoints ?? []);
  if (waypoints.length > 0) {
    // Line from ship to first waypoint
    const firstWaypointScreenPos = worldToScreen(waypoints[0]!.position, camera.value);
    drawWaypointPath(ctx, shipScreenPos, firstWaypointScreenPos);

    // Lines between waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const fromScreenPos = worldToScreen(waypoints[i]!.position, camera.value);
      const toScreenPos = worldToScreen(waypoints[i + 1]!.position, camera.value);
      drawWaypointPath(ctx, fromScreenPos, toScreenPos);
    }
  }

  // Draw waypoints
  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i]!;
    const screenPos = worldToScreen(waypoint.position, camera.value);
    drawWaypoint(ctx, screenPos, waypoint.name, i === 0);
  }

  // Draw tractor beam effect if active
  if (shipStore.isTractorBeamActive && shipStore.tractorBeam.targetPosition) {
    drawTractorBeam(ctx);
  }

  // Draw ship
  drawShip(ctx);

  // Update and draw collision warnings
  collision.updateCollisionWarnings();
  drawCollisionWarnings(ctx);

  // Draw docking approach guidance (T048)
  drawDockingApproachGuidance(ctx);

  // Check if waypoint reached
  navStore.checkWaypointReached(shipStore.position);
}

function drawRadarOverlay(ctx: CanvasRenderingContext2D) {
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const displayRange = sensorStore.proximityDisplayRange;
  const screenRange = displayRange * zoom.value;

  for (const segment of sensorStore.radarSegments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    // Convert from North-Up (0°=N) to canvas arc (0°=E) per ADR-0011
    const startRad = northUpToCanvasArcRad(segment.startAngle);
    const endRad = northUpToCanvasArcRad(segment.endAngle);
    const distanceRatio = Math.min(segment.nearestContact.distance / displayRange, 1);
    const segmentRadius = screenRange * distanceRatio;

    ctx.fillStyle = getThreatLevelColor(segment.threatLevel);
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(shipScreenPos.x, shipScreenPos.y);
    ctx.arc(shipScreenPos.x, shipScreenPos.y, segmentRadius, startRad, endRad);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw faint range circle at proximity display range
  ctx.strokeStyle = 'rgba(153, 102, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(shipScreenPos.x, shipScreenPos.y, screenRange, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D) {
  const star = navStore.currentSystem!.star;
  const screenPos = worldToScreen({ x: 0, y: 0 }, camera.value);
  const screenRadius = star.radius * zoom.value;

  // Only draw if visible
  if (screenPos.x + screenRadius < 0 || screenPos.x - screenRadius > canvasWidth.value ||
      screenPos.y + screenRadius < 0 || screenPos.y - screenRadius > canvasHeight.value) {
    return;
  }

  // Glow effect
  const gradient = ctx.createRadialGradient(
    screenPos.x, screenPos.y, 0,
    screenPos.x, screenPos.y, screenRadius * 2
  );
  gradient.addColorStop(0, star.color);
  gradient.addColorStop(0.5, `${star.color}44`);
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = star.color;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrbit(ctx: CanvasRenderingContext2D, planet: Planet) {
  const screenPos = worldToScreen({ x: 0, y: 0 }, camera.value);
  const screenRadius = planet.orbitRadius * zoom.value;

  ctx.strokeStyle = MAP_COLORS.orbit;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlanet(ctx: CanvasRenderingContext2D, planet: Planet) {
  const screenPos = worldToScreen(planet.position, camera.value);
  const screenRadius = Math.max(planet.radius * zoom.value, 12);
  const isSelected = navStore.selectedObjectId === planet.id;

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = MAP_COLORS.selected;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, screenRadius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Planet body
  ctx.fillStyle = planet.color;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = MAP_COLORS.planet;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(planet.name, screenPos.x, screenPos.y + screenRadius + 14);
}

function drawStation(ctx: CanvasRenderingContext2D, station: Station, activePortId: string | null = null) {
  const screenPos = worldToScreen(station.position, camera.value);
  const isSelected = navStore.selectedObjectId === station.id;
  const cameraVec = { x: cameraCenter.value.x, y: cameraCenter.value.y };
  const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };

  // Get station template for shape rendering
  const templateId = station.templateId ?? station.type;
  const template = getStationTemplateById(templateId);
  
  // Calculate station render size using shared constant
  const stationScale = station.dockingRange * STATION_VISUAL_MULTIPLIER;
  const stationRotation = station.rotation ?? 0;

  if (template) {
    // Selection highlight
    if (isSelected) {
      const selectionRadius = (template.boundingRadius ?? 1) * stationScale * zoom.value + 6;
      ctx.strokeStyle = MAP_COLORS.selected;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, selectionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render station shape with LOD
    renderStationWithLOD(
      ctx,
      template,
      station.position,
      stationRotation,
      stationScale,
      cameraVec,
      screenCenter,
      zoom.value,
      MAP_COLORS.station,   // fillColor
      '#CC9900',            // strokeColor (darker gold outline)
      8                     // minSize for LOD fallback
    );
  } else {
    // Fallback to simple diamond if template not found
    const size = 10;
    
    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = MAP_COLORS.selected;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Station icon (diamond shape)
    ctx.fillStyle = MAP_COLORS.station;
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y - size);
    ctx.lineTo(screenPos.x + size, screenPos.y);
    ctx.lineTo(screenPos.x, screenPos.y + size);
    ctx.lineTo(screenPos.x - size, screenPos.y);
    ctx.closePath();
    ctx.fill();
  }

  // Docking port indicators - show circles around each port (helm needs this for navigation)
  if (template) {
    const screenSize = (template.boundingRadius ?? 1) * stationScale * zoom.value;
    if (screenSize > 20) {
      drawDockingPortsShared(ctx, station, camera.value, { 
        isSelected, 
        activePortId,
        drawRunwayLights: true,
      });
    }
  }

  // Label
  ctx.fillStyle = MAP_COLORS.station;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  const labelOffset = template?.boundingRadius ? template.boundingRadius * stationScale * zoom.value + 14 : 24;
  ctx.fillText(station.name, screenPos.x, screenPos.y + labelOffset);
}

/**
 * T048: Draw docking approach guidance overlay
 * Shows approach guide lines and alignment indicators when near a station
 * Works for both selected station AND nearest station when no selection
 */
function drawDockingApproachGuidance(ctx: CanvasRenderingContext2D) {
  // Try to find a docking port to show guidance for:
  // 1. If a station is selected, use it
  // 2. Otherwise, find the nearest docking port automatically
  let dockingStatus;
  let targetStation;
  
  const selectedStation = navStore.selectedStation;
  if (selectedStation) {
    dockingStatus = navStore.checkDockingPortAvailability(
      selectedStation,
      shipStore.position,
      shipStore.heading
    );
    targetStation = selectedStation;
  } else {
    // Use findNearestDockingPort to get the closest port across all stations
    const nearestPort = navStore.findNearestDockingPort(shipStore.position, shipStore.heading);
    if (nearestPort) {
      dockingStatus = nearestPort;
      targetStation = nearestPort.station;
    }
  }

  if (!dockingStatus?.port || !dockingStatus?.portWorldPosition || !targetStation) return;

  // Show guidance from a much larger distance (60x docking range)
  const portRange = getDockingRange(dockingStatus.port);
  if (dockingStatus.distance > portRange * 60) return;

  const portScreenPos = worldToScreen(dockingStatus.portWorldPosition, camera.value);

  // Get station template to calculate approach vector in world space
  const templateId = targetStation.templateId ?? targetStation.type;
  const template = getStationTemplateById(templateId);
  if (!template) return;

  // Find the docking port's world approach vector
  const stationRotationRad = ((targetStation.rotation ?? 0) * Math.PI) / 180;
  let worldApproachVector = { x: 0, y: 0 };

  for (const modulePlacement of template.modules) {
    const module = getStationModule(modulePlacement.moduleType);
    if (!module?.dockingPorts) continue;

    const moduleRotationRad = (modulePlacement.rotation * Math.PI) / 180;
    const totalRotation = stationRotationRad + moduleRotationRad;

    for (const port of module.dockingPorts) {
      if (port.id === dockingStatus.port.id) {
        worldApproachVector = {
          x: port.approachVector.x * Math.cos(totalRotation) - port.approachVector.y * Math.sin(totalRotation),
          y: port.approachVector.x * Math.sin(totalRotation) + port.approachVector.y * Math.cos(totalRotation),
        };
        break;
      }
    }
  }

  // Draw docking range circle around port (with ship buffer)
  const visualRange = getVisualDockingRange(portRange);
  const screenRange = visualRange * zoom.value;
  ctx.strokeStyle = dockingStatus.inRange ? MAP_COLORS.dockingPort : MAP_COLORS.dockingPortUnavailable;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(portScreenPos.x, portScreenPos.y, screenRange, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw runway bounding box so player can see the approach corridor
  // These are calculated to match the visual runway lights (runwayLength and runwayWidth)
  // Make the runway slightly longer and wider to match gameplay detection
  const runwayLength = portRange * 10; // Extended runway for better visibility
  const runwayWidth = 25; // Width between light pairs in world units (wider)

  // Rectangle corners in world space
  const startWorld = { x: dockingStatus.portWorldPosition.x, y: dockingStatus.portWorldPosition.y };
  const endWorld = { x: dockingStatus.portWorldPosition.x + worldApproachVector.x * runwayLength, y: dockingStatus.portWorldPosition.y + worldApproachVector.y * runwayLength };

  const corners = computeRunwayCorners(dockingStatus.portWorldPosition, worldApproachVector, runwayLength, runwayWidth);
  const p1s = worldToScreen(corners.p1, camera.value);
  const p2s = worldToScreen(corners.p2, camera.value);
  const p3s = worldToScreen(corners.p3, camera.value);
  const p4s = worldToScreen(corners.p4, camera.value);

  // Fill the runway rectangle faintly, and stroke with stronger color when ship is within the corridor
  ctx.fillStyle = dockingStatus.nearLights ? 'rgba(0, 255, 153, 0.12)' : 'rgba(0, 255, 153, 0.04)';
  ctx.beginPath();
  ctx.moveTo(p1s.x, p1s.y);
  ctx.lineTo(p2s.x, p2s.y);
  ctx.lineTo(p3s.x, p3s.y);
  ctx.lineTo(p4s.x, p4s.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = dockingStatus.nearLights ? 'rgba(0, 255, 153, 0.6)' : 'rgba(0, 255, 153, 0.25)';
  ctx.lineWidth = dockingStatus.nearLights ? 2 : 1;
  ctx.stroke();

  // Draw RUNWAY label when the ship is within the corridor so it's obvious
  if (dockingStatus.nearLights) {
    const labelScreen = worldToScreen({ x: (startWorld.x + endWorld.x) / 2, y: (startWorld.y + endWorld.y) / 2 }, camera.value);
    ctx.fillStyle = 'rgba(0, 255, 153, 0.9)';
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RUNWAY', labelScreen.x, labelScreen.y - 8);
  }

  // Draw runway lights along the approach corridor
  // Use shared drawing helper so white and colored lights line up exactly.
  const nearestPortForGuidance = navStore.findNearestDockingPort(shipStore.position, shipStore.heading);
  // Always draw runway lights in guidance overlay to match placement; choose colored mode
  // for the active runway when the player is nearby.
  const showColoredLandingLights = shouldShowColoredLandingLights(nearestPortForGuidance, dockingStatus, getDockingRange);

  if (showColoredLandingLights) {
    drawRunwayLightsForPort(ctx, dockingStatus.portWorldPosition, worldApproachVector, portRange, camera.value, Date.now() / 1000, 'colored');
  } else {
    // Draw white marker lights for inactive/remote runways (keeps placement consistent)
    drawRunwayLightsForPort(ctx, dockingStatus.portWorldPosition, worldApproachVector, portRange, camera.value, Date.now() / 1000, 'white');
  }

  // Draw center approach line (fainter, behind runway lights)
  const guideLineLength = runwayLength * zoom.value;
  const approachStartX = portScreenPos.x + worldApproachVector.x * guideLineLength;
  const approachStartY = portScreenPos.y - worldApproachVector.y * guideLineLength; // Flip Y

  ctx.strokeStyle = 'rgba(0, 255, 128, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 10]);
  ctx.beginPath();
  ctx.moveTo(approachStartX, approachStartY);
  ctx.lineTo(portScreenPos.x, portScreenPos.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw port marker (larger and brighter when in range)
  const portMarkerSize = dockingStatus.inRange ? 10 : 6;
  ctx.fillStyle = dockingStatus.inRange ? MAP_COLORS.dockingPort : MAP_COLORS.dockingPortRange;
  ctx.beginPath();
  ctx.arc(portScreenPos.x, portScreenPos.y, portMarkerSize, 0, Math.PI * 2);
  ctx.fill();

  // Draw status text
  if (shipStore.isDocked && shipStore.dockedAtId === targetStation.id) {
    ctx.fillStyle = MAP_COLORS.dockingPort;
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DOCKED', portScreenPos.x, portScreenPos.y - screenRange - 10);
  } else if (dockingStatus.reason) {
    ctx.fillStyle = MAP_COLORS.dockingPortUnavailable;
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dockingStatus.reason.toUpperCase(), portScreenPos.x, portScreenPos.y - screenRange - 10);
  } else if (dockingStatus.inRange) {
    ctx.fillStyle = MAP_COLORS.dockingPort;
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DOCKING AVAILABLE', portScreenPos.x, portScreenPos.y - screenRange - 10);
  }
}

function drawJumpGate(ctx: CanvasRenderingContext2D, gate: JumpGate) {
  const screenPos = worldToScreen(gate.position, camera.value);
  const size = 12;
  const isSelected = navStore.selectedObjectId === gate.id;

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = MAP_COLORS.selected;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, size + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hexagon shape
  ctx.fillStyle = MAP_COLORS.jumpGate;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const x = screenPos.x + size * Math.cos(angle);
    const y = screenPos.y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.fillStyle = MAP_COLORS.jumpGate;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(gate.name, screenPos.x, screenPos.y + size + 14);
}

function drawShip(ctx: CanvasRenderingContext2D) {
  const screenPos = worldToScreen(shipStore.position, camera.value);

  // Get ship template for shape rendering
  const template = getShipTemplate(shipStore.templateId);
  
  if (template) {
    const cameraVec = { x: cameraCenter.value.x, y: cameraCenter.value.y };
    const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };
    
    // Render ship shape with LOD (falls back to point when zoomed out)
    renderShapeWithLOD(
      ctx,
      template.shape,
      shipStore.position,
      shipStore.heading,
      shipStore.size,
      cameraVec,
      screenCenter,
      zoom.value,
      MAP_COLORS.ship,       // fillColor
      MAP_COLORS.shipHeading, // strokeColor
      1,                     // lineWidth
      6                      // minSize for LOD fallback
    );

    // Show engine mounts when zoomed in enough
    const screenSize = getShapeScreenSize(template.shape, shipStore.size, zoom.value);
    if (screenSize > 30 && template.engineMounts.length > 0) {
      renderEngineMounts(
        ctx,
        template.engineMounts,
        shipStore.position,
        shipStore.heading,
        shipStore.size,
        cameraVec,
        screenCenter,
        zoom.value,
        '#FF6600'
      );
    }
  } else {
    // Fallback to simple icon if template not found
    drawShipIcon(ctx, screenPos, shipStore.heading, 8, MAP_COLORS.ship);
  }
}

/**
 * Draw tractor beam effect from station docking port to ship
 * Creates an animated beam pulling the ship toward docking position
 */
function drawTractorBeam(ctx: CanvasRenderingContext2D) {
  const targetPos = shipStore.tractorBeam.targetPosition;
  const stationId = shipStore.tractorBeam.stationId;
  const portId = shipStore.tractorBeam.portId;
  if (!targetPos || !stationId || !portId) return;

  // Find the station and its nearest docking port
  const station = navStore.stations.find(s => s.id === stationId);
  if (!station) return;

  // Get the docking port world position (the beam should emanate FROM the port)
  const ports = navStore.getStationDockingPorts(station);
  if (ports.length === 0) return;

  // Find the specific port by ID (this is the port we're docking at)
  const targetPort = ports.find(p => p.port.id === portId);
  if (!targetPort) return;

  const portScreenPos = worldToScreen(targetPort.worldPosition, camera.value);
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const targetScreenPos = worldToScreen(targetPos, camera.value);

  // Calculate beam properties (from port to ship)
  const dx = shipScreenPos.x - portScreenPos.x;
  const dy = shipScreenPos.y - portScreenPos.y;
  const distance = Math.hypot(dx, dy);
  
  if (distance < 1) return; // Already at target

  // Animated beam effect using time
  const time = Date.now() * 0.003; // Slow animation
  const pulsePhase = Math.sin(time * 2);
  
  // Draw multiple beam lines for tractor beam effect (FROM station TO ship)
  ctx.save();
  
  // Outer glow
  ctx.strokeStyle = `rgba(153, 102, 255, ${0.2 + pulsePhase * 0.1})`;
  ctx.lineWidth = 12;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(portScreenPos.x, portScreenPos.y);
  ctx.lineTo(shipScreenPos.x, shipScreenPos.y);
  ctx.stroke();
  
  // Middle beam
  ctx.strokeStyle = `rgba(153, 102, 255, ${0.4 + pulsePhase * 0.2})`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(portScreenPos.x, portScreenPos.y);
  ctx.lineTo(shipScreenPos.x, shipScreenPos.y);
  ctx.stroke();
  
  // Core beam (animated dashes moving from port toward ship - pulling the ship in)
  const dashOffset = time * 50; // Animate dash movement
  ctx.strokeStyle = `rgba(200, 150, 255, ${0.8 + pulsePhase * 0.2})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 15]);
  ctx.lineDashOffset = dashOffset; // Positive to move from port toward ship (pulling)
  ctx.beginPath();
  ctx.moveTo(portScreenPos.x, portScreenPos.y);
  ctx.lineTo(shipScreenPos.x, shipScreenPos.y);
  ctx.stroke();
  
  // Draw target position indicator (docking point)
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = `rgba(0, 255, 153, ${0.6 + pulsePhase * 0.2})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(targetScreenPos.x, targetScreenPos.y, 15 + pulsePhase * 3, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner target dot
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(0, 255, 153, ${0.8 + pulsePhase * 0.2})`;
  ctx.beginPath();
  ctx.arc(targetScreenPos.x, targetScreenPos.y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw collision warnings around the ship
 */
function drawCollisionWarnings(ctx: CanvasRenderingContext2D) {
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const warningLevel = collision.highestWarningLevel.value;
  
  // Don't draw if no warnings
  if (warningLevel === 'none') return;
  
  // Draw warning ring around ship
  const ringColor = COLLISION_COLORS[warningLevel];
  const ringRadius = Math.max(shipStore.size * zoom.value, 20) + 8;
  const pulseIntensity = warningLevel === 'danger' ? 0.8 : (warningLevel === 'warning' ? 0.5 : 0.3);
  
  // Pulsing effect
  const pulsePhase = (Date.now() % 1000) / 1000;
  const pulseAlpha = 0.3 + pulseIntensity * Math.sin(pulsePhase * Math.PI * 2);
  
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = warningLevel === 'danger' ? 3 : 2;
  ctx.globalAlpha = pulseAlpha;
  ctx.beginPath();
  ctx.arc(shipScreenPos.x, shipScreenPos.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Draw contact points for danger-level warnings
  for (const warning of collision.warnings.value) {
    if (warning.level === 'danger' && warning.collisionPoint) {
      drawCollisionContactPoint(ctx, warning.collisionPoint, warning.normal);
    }
  }
}

/**
 * Draw a collision contact point indicator
 */
function drawCollisionContactPoint(
  ctx: CanvasRenderingContext2D,
  contactPoint: Vector2,
  normal?: Vector2
) {
  const screenPos = worldToScreen(contactPoint, camera.value);
  
  // Draw X marker at contact point
  const size = 6;
  ctx.strokeStyle = COLLISION_COLORS.danger;
  ctx.lineWidth = 2;
  
  // X shape
  ctx.beginPath();
  ctx.moveTo(screenPos.x - size, screenPos.y - size);
  ctx.lineTo(screenPos.x + size, screenPos.y + size);
  ctx.moveTo(screenPos.x + size, screenPos.y - size);
  ctx.lineTo(screenPos.x - size, screenPos.y + size);
  ctx.stroke();
  
  // Draw normal direction arrow if available
  if (normal) {
    const arrowLength = 20;
    const endPos = {
      x: screenPos.x + normal.x * arrowLength,
      y: screenPos.y - normal.y * arrowLength, // Screen Y is inverted
    };
    
    ctx.strokeStyle = COLLISION_COLORS.warning;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();
    
    // Arrow head
    const headSize = 4;
    const angle = Math.atan2(-normal.y, normal.x);
    ctx.beginPath();
    ctx.moveTo(endPos.x, endPos.y);
    ctx.lineTo(
      endPos.x - headSize * Math.cos(angle - Math.PI / 6),
      endPos.y - headSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endPos.x, endPos.y);
    ctx.lineTo(
      endPos.x - headSize * Math.cos(angle + Math.PI / 6),
      endPos.y - headSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
}

// Event handlers
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.max(0.2, Math.min(3, zoom.value + zoomDelta));
}

function handleMouseDown(event: MouseEvent) {
  if (event.button === 0) { // Left click
    const rect = canvasRef.value!.getBoundingClientRect();
    const clickPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    // Check for object selection
    const worldPos = screenToWorld(clickPos, camera.value);
    const clickRadius = 20 / zoom.value;

    // Check stations
    for (const station of navStore.stations) {
      const dx = station.position.x - worldPos.x;
      const dy = station.position.y - worldPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        navStore.selectStation(station.id);
        sensorStore.selectContact(station.id);
        return;
      }
    }

    // Check planets
    for (const planet of navStore.planets) {
      const dx = planet.position.x - worldPos.x;
      const dy = planet.position.y - worldPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius + planet.radius) {
        navStore.selectPlanet(planet.id);
        sensorStore.selectContact(planet.id);
        return;
      }
    }

    // Check jump gates
    for (const gate of navStore.jumpGates) {
      const dx = gate.position.x - worldPos.x;
      const dy = gate.position.y - worldPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        navStore.selectJumpGate(gate.id);
        sensorStore.selectContact(gate.id);
        return;
      }
    }

    // No object clicked - steer toward clicked position
    const targetHeading = navStore.getHeadingToWaypoint(shipStore.position, worldPos);
    navStore.disableAutopilot();
    shipStore.setTargetHeading(targetHeading);
    navStore.clearSelection();
    sensorStore.clearSelection();
  } else if (event.button === 2) { // Right click - start panning
    isDragging.value = true;
    dragStart.value = { x: event.clientX, y: event.clientY };
  }
}

function handleMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    const dx = (event.clientX - dragStart.value.x) / zoom.value;
    const dy = (event.clientY - dragStart.value.y) / zoom.value;
    panOffset.value = {
      x: panOffset.value.x - dx,
      y: panOffset.value.y + dy,
    };
    dragStart.value = { x: event.clientX, y: event.clientY };
  } else {
    // Check for module hover
    handleModuleHover(event);
  }
}

function handleModuleHover(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const screenPoint = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  const cameraVec = { x: cameraCenter.value.x, y: cameraCenter.value.y };
  const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };

  // Get station scale function using shared constant (matches drawStation)
  const getStationScale = (station: Station) => station.dockingRange * STATION_VISUAL_MULTIPLIER;

  const result = findModuleAtScreenPosition(
    screenPoint,
    navStore.stations,
    getStationTemplateById,
    cameraVec,
    screenCenter,
    zoom.value,
    getStationScale
  );

  if (result.hit && result.station && result.moduleType) {
    tooltipContent.value = {
      stationName: result.station.name,
      moduleName: formatModuleType(result.moduleType),
      moduleType: result.moduleType,
      moduleStatus: getModuleStatus(result.moduleType),
    };
    tooltipX.value = event.clientX + 15;
    tooltipY.value = event.clientY + 15;
    tooltipVisible.value = true;
  } else {
    tooltipVisible.value = false;
    tooltipContent.value = null;
  }
}

function handleMouseLeave() {
  handleMouseUp();
  tooltipVisible.value = false;
  tooltipContent.value = null;
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleContextMenu(event: MouseEvent) {
  event.preventDefault();
}

function handleResize() {
  if (containerRef.value) {
    canvasWidth.value = containerRef.value.clientWidth;
    canvasHeight.value = containerRef.value.clientHeight;
  }
}

// Center on ship (reset pan)
function centerOnShip() {
  panOffset.value = { x: 0, y: 0 };
}

// Expose for parent components
defineExpose({ centerOnShip, zoom });

// Lifecycle
onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
  
  // Subscribe to game loop for rendering
  const unsubscribe = subscribe(() => {
    render();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    unsubscribe();
  });

  // Initial render
  render();
});
</script>

<template>
  <div
    ref="containerRef"
    class="helm-map"
  >
    <canvas
      ref="canvasRef"
      class="helm-map__canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @contextmenu="handleContextMenu"
    />
    <div class="helm-map__overlay">
      <div class="helm-map__info">
        <span class="helm-map__system-name">{{ navStore.systemName }}</span>
        <span class="helm-map__zoom">{{ (zoom * 100).toFixed(0) }}%</span>
      </div>
      <!-- Collision warning indicator -->
      <div 
        v-if="collision.highestWarningLevel.value !== 'none'"
        class="helm-map__collision-warning"
        :class="`helm-map__collision-warning--${collision.highestWarningLevel.value}`"
      >
        <span class="helm-map__collision-warning-icon">⚠</span>
        <span class="helm-map__collision-warning-text">
          {{ collision.highestWarningLevel.value.toUpperCase() }}
        </span>
        <span
          v-if="collision.warnings.value[0]"
          class="helm-map__collision-warning-object"
        >
          {{ collision.warnings.value[0].objectName }}
        </span>
      </div>
    </div>
    <div class="helm-map__controls">
      <button 
        class="helm-map__toggle"
        :class="{ 'helm-map__toggle--active': settingsStore.showRadarOverlay }"
        title="Toggle Radar Overlay"
        @click="settingsStore.toggleRadarOverlay()"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          width="20"
          height="20"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <circle
            cx="12"
            cy="12"
            r="6"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          />
          <circle
            cx="12"
            cy="12"
            r="2"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          />
          <line
            x1="12"
            y1="2"
            x2="12"
            y2="8"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </button>
    </div>
    <!-- Module tooltip -->
    <div
      v-if="tooltipVisible && tooltipContent"
      class="helm-map__tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="helm-map__tooltip-station">
        {{ tooltipContent.stationName }}
      </div>
      <div class="helm-map__tooltip-module">
        {{ tooltipContent.moduleName }}
      </div>
      <div class="helm-map__tooltip-type">
        {{ tooltipContent.moduleType.toUpperCase() }}
      </div>
      <div class="helm-map__tooltip-status">
        {{ tooltipContent.moduleStatus }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.helm-map {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: $color-black;
  overflow: hidden;

  canvas {
    display: block;
    cursor: crosshair;

    &:active {
      cursor: grabbing;
    }
  }

  &__overlay {
    position: absolute;
    top: $space-sm;
    left: $space-sm;
    pointer-events: none;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__system-name {
    font-family: $font-display;
    font-size: $font-size-sm;
    color: $color-gold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__zoom {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
  }

  &__controls {
    position: absolute;
    top: $space-sm;
    right: $space-sm;
    display: flex;
    gap: $space-xs;
  }

  &__toggle {
    width: 32px;
    height: 32px;
    padding: 4px;
    border: 1px solid $color-purple-dim;
    border-radius: $radius-sm;
    background-color: rgba($color-black, 0.8);
    color: $color-purple-dim;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: $color-purple;
      color: $color-purple;
      background-color: rgba($color-purple, 0.1);
    }

    &--active {
      border-color: $color-purple;
      color: $color-purple;
      background-color: rgba($color-purple, 0.2);
    }
  }

  &__collision-warning {
    position: absolute;
    top: $space-lg + $space-md;
    left: $space-sm;
    display: flex;
    align-items: center;
    gap: $space-xs;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
    font-family: $font-mono;
    font-size: $font-size-sm;
    animation: pulse-warning 1s infinite;

    &--caution {
      background-color: rgba(#FFCC00, 0.2);
      border: 1px solid #FFCC00;
      color: #FFCC00;
    }

    &--warning {
      background-color: rgba(#FF6600, 0.2);
      border: 1px solid #FF6600;
      color: #FF6600;
    }

    &--danger {
      background-color: rgba(#FF0000, 0.3);
      border: 2px solid #FF0000;
      color: #FF0000;
      animation: pulse-danger 0.5s infinite;
    }
  }

  &__collision-warning-icon {
    font-size: $font-size-md;
  }

  &__collision-warning-text {
    font-weight: bold;
  }

  &__collision-warning-object {
    opacity: 0.8;
    font-size: $font-size-xs;
  }

  &__tooltip {
    position: fixed;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.95);
    border: 1px solid $color-gold;
    border-radius: $radius-sm;
    padding: $space-xs $space-sm;
    pointer-events: none;
    max-width: 250px;
    font-family: $font-mono;
    font-size: 11px;
    line-height: 1.4;
  }

  &__tooltip-station {
    color: $color-gold;
    font-weight: bold;
    margin-bottom: 2px;
  }

  &__tooltip-module {
    color: $color-white;
    margin-bottom: 2px;
  }

  &__tooltip-type {
    color: $color-gray;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  &__tooltip-status {
    color: $color-success;
    font-size: 10px;
  }
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes pulse-danger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
