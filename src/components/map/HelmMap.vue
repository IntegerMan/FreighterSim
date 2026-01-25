<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { Container, Graphics } from 'pixi.js';
import { useShipStore, useNavigationStore, useSensorStore, useSettingsStore, useShipCollision, type CollisionWarningLevel } from '@/stores';
import { useRendererStore } from '@/stores/rendererStore';
import { useGameLoop } from '@/core/game-loop';
import {
  MAP_COLORS,
  worldToScreen,
  screenToWorld,
  renderPixiShapeWithLOD,
  findModuleAtScreenPosition,
  STATION_VISUAL_MULTIPLIER,
  getVisualDockingRange,
  getDockingRange,
  RUNWAY_LENGTH_FACTOR,
  type CameraState,
} from '@/core/rendering';
import {
  PixiRenderer,
  detectCapabilities,
  meetsMinimumRequirements,
} from '@/core/rendering';
import { createDefaultStarfieldConfig, generateStarsForCell, getVisibleCells, starToScreen } from '@/core/starfield';
import { isPortNearby, shouldShowColoredLandingLights, computeRunwayCorners } from '@/core/rendering/dockingGuidance';
import { getShipTemplate, getStationTemplateById, getStationModule } from '@/data/shapes';
import type { Vector2, Station } from '@/models';
import { getThreatLevelColor, northUpToCanvasRad } from '@/models';
import type { StarfieldConfig } from '@/models/Starfield';

const containerRef = ref<HTMLDivElement | null>(null);

const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const settingsStore = useSettingsStore();
const rendererStore = useRendererStore();
const collision = useShipCollision();
const { subscribe } = useGameLoop();

// Starfield config
const starfieldConfig = ref<StarfieldConfig | null>(null);
const rendererReady = ref(false);
let loopUnsubscribe: (() => void) | null = null;

watch(
  () => navStore.currentSystem,
  (system) => {
    starfieldConfig.value = system ? createDefaultStarfieldConfig(system.id) : null;
  },
  { immediate: true }
);

// Canvas state - higher default zoom for helm, ship-centric
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const zoom = ref(1.8);
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

// Collision warning colors (as hex for PixiJS)
const COLLISION_COLORS: Record<CollisionWarningLevel, number> = {
  none: 0x000000,
  caution: 0xffcc00,
  warning: 0xff6600,
  danger: 0xff0000,
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

// PixiJS renderer and layers
const pixiRenderer = new PixiRenderer();
let backgroundLayer: Container | undefined;
let gameLayer: Container | undefined;
let effectsLayer: Container | undefined;
let uiLayer: Container | undefined;

// Graphics objects for each element type
const graphics = {
  starfield: new Graphics(),
  grid: new Graphics(),
  radarOverlay: new Graphics(),
  star: new Graphics(),
  orbits: new Graphics(),
  planets: new Container(),
  stations: new Container(),
  jumpGates: new Graphics(),
  dockingGuidance: new Graphics(),
  waypoints: new Graphics(),
  paths: new Graphics(),
  courseProjection: new Graphics(),
  tractorBeam: new Graphics(),
  ship: new Graphics(),
  engineMounts: new Graphics(),
  collisionWarnings: new Graphics(),
  highlights: new Graphics(),
  labels: new Container(),
};

// Color constants (hex for PixiJS)
const COLOR = {
  background: 0x000000,
  grid: 0x1a1a1a,
  orbit: 0x333333,
  star: 0xffb347,
  planet: 0x66ccff,
  station: 0xffcc00,
  jumpGate: 0xbb99ff,
  ship: 0xffffff,
  shipHeading: 0xffcc00,
  selected: 0x9966ff,
  waypointActive: 0x9966ff,
  waypointInactive: 0xffcc00,
  courseProjection: 0xffcc00,
  courseProjectionReverse: 0xff6666,
  dockingPort: 0x00ff99,
  dockingPortUnavailable: 0xff6666,
  dockingPortRange: 0x00ff9966,
  tractorBeamOuter: 0x9966ff,
  tractorBeamMiddle: 0x9966ff,
  tractorBeamCore: 0xc896ff,
  tractorBeamTarget: 0x00ff99,
  radarRange: 0x9966ff,
};

function formatModuleType(type: string): string {
  return type.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getModuleStatus(_moduleType: string): string {
  return 'Operational';
}

function attachGraphics() {
  backgroundLayer?.addChild(graphics.starfield);
  backgroundLayer?.addChild(graphics.grid);
  gameLayer?.addChild(graphics.radarOverlay);
  gameLayer?.addChild(graphics.star);
  gameLayer?.addChild(graphics.orbits);
  gameLayer?.addChild(graphics.planets);
  gameLayer?.addChild(graphics.stations);
  gameLayer?.addChild(graphics.jumpGates);
  gameLayer?.addChild(graphics.dockingGuidance);
  uiLayer?.addChild(graphics.paths);
  uiLayer?.addChild(graphics.waypoints);
  uiLayer?.addChild(graphics.courseProjection);
  effectsLayer?.addChild(graphics.tractorBeam);
  gameLayer?.addChild(graphics.ship);
  gameLayer?.addChild(graphics.engineMounts);
  effectsLayer?.addChild(graphics.collisionWarnings);
  effectsLayer?.addChild(graphics.highlights);
  uiLayer?.addChild(graphics.labels);
}

function resetGraphics() {
  graphics.starfield.clear();
  graphics.grid.clear();
  graphics.radarOverlay.clear();
  graphics.star.clear();
  graphics.orbits.clear();
  graphics.jumpGates.clear();
  graphics.dockingGuidance.clear();
  graphics.waypoints.clear();
  graphics.paths.clear();
  graphics.courseProjection.clear();
  graphics.tractorBeam.clear();
  graphics.ship.clear();
  graphics.engineMounts.clear();
  graphics.collisionWarnings.clear();
  graphics.highlights.clear();
  graphics.labels.removeChildren();
  graphics.planets.removeChildren();
  graphics.stations.removeChildren();
}

function render() {
  if (!rendererReady.value) return;
  resetGraphics();

  drawStarfield();
  drawGrid();

  if (settingsStore.showRadarOverlay) {
    drawRadarOverlay();
  }

  if (navStore.currentSystem?.star) {
    drawStar();
  }

  drawOrbits();
  drawPlanets();

  // Determine active docking port
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

  drawStations(activePortId);
  drawJumpGates();
  drawCourseProjection();
  drawWaypointsAndPaths();

  if (shipStore.isTractorBeamActive && shipStore.tractorBeam.targetPosition) {
    drawTractorBeam();
  }

  drawShip();

  collision.updateCollisionWarnings();
  drawCollisionWarnings();

  drawDockingApproachGuidance();

  navStore.checkWaypointReached(shipStore.position);
}

function drawStarfield() {
  if (!starfieldConfig.value) return;
  graphics.starfield.clear();

  const config = starfieldConfig.value;
  const cam = camera.value;

  config.layers.forEach((layer, layerIndex) => {
    const cells = getVisibleCells(cam, config.cellSize, layer.parallaxFactor);
    for (const cell of cells) {
      const stars = generateStarsForCell(cell.x, cell.y, layerIndex, config);
      for (const star of stars) {
        const screenPos = starToScreen(star, cam, layer.parallaxFactor);
        graphics.starfield.beginFill(COLOR.star, star.brightness);
        graphics.starfield.drawCircle(screenPos.x, screenPos.y, star.radius);
        graphics.starfield.endFill();
      }
    }
  });
}

function drawGrid() {
  const gridSize = 100;
  const cam = camera.value;
  const topLeft = screenToWorld({ x: 0, y: 0 }, cam);
  const bottomRight = screenToWorld({ x: canvasWidth.value, y: canvasHeight.value }, cam);
  const startX = Math.floor(topLeft.x / gridSize) * gridSize;
  const startY = Math.floor(bottomRight.y / gridSize) * gridSize;
  const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
  const endY = Math.ceil(topLeft.y / gridSize) * gridSize;

  if (gridSize * cam.zoom < 20) return;

  graphics.grid.clear();
  graphics.grid.lineStyle(1, COLOR.grid, 1);

  for (let x = startX; x <= endX; x += gridSize) {
    const screen = worldToScreen({ x, y: 0 }, cam);
    graphics.grid.moveTo(screen.x, 0);
    graphics.grid.lineTo(screen.x, canvasHeight.value);
  }

  for (let y = startY; y <= endY; y += gridSize) {
    const screen = worldToScreen({ x: 0, y }, cam);
    graphics.grid.moveTo(0, screen.y);
    graphics.grid.lineTo(canvasWidth.value, screen.y);
  }
}

function drawRadarOverlay() {
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const displayRange = sensorStore.proximityDisplayRange;
  const screenRange = displayRange * zoom.value;

  graphics.radarOverlay.clear();

  for (const segment of sensorStore.radarSegments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    const startRad = northUpToCanvasRad(segment.startAngle);
    const endRad = northUpToCanvasRad(segment.endAngle);
    const distanceRatio = Math.min(segment.nearestContact.distance / displayRange, 1);
    const segmentRadius = screenRange * distanceRatio;

    const colorStr = getThreatLevelColor(segment.threatLevel);
    const color = parseInt(colorStr.replace('#', ''), 16);

    graphics.radarOverlay.beginFill(color, 0.2);
    graphics.radarOverlay.moveTo(shipScreenPos.x, shipScreenPos.y);
    graphics.radarOverlay.arc(shipScreenPos.x, shipScreenPos.y, segmentRadius, startRad, endRad);
    graphics.radarOverlay.lineTo(shipScreenPos.x, shipScreenPos.y);
    graphics.radarOverlay.endFill();
  }

  // Draw faint range circle
  graphics.radarOverlay.lineStyle(1, COLOR.radarRange, 0.15);
  graphics.radarOverlay.drawCircle(shipScreenPos.x, shipScreenPos.y, screenRange);
}

function drawStar() {
  const star = navStore.currentSystem!.star;
  const screenPos = worldToScreen({ x: 0, y: 0 }, camera.value);
  const screenRadius = star.radius * zoom.value;

  // Visibility check
  if (screenPos.x + screenRadius < 0 || screenPos.x - screenRadius > canvasWidth.value ||
      screenPos.y + screenRadius < 0 || screenPos.y - screenRadius > canvasHeight.value) {
    return;
  }

  graphics.star.clear();
  const starColor = parseInt(star.color.replace('#', ''), 16);

  // Glow effect (outer)
  graphics.star.beginFill(starColor, 0.25);
  graphics.star.drawCircle(screenPos.x, screenPos.y, screenRadius * 2);
  graphics.star.endFill();

  // Core
  graphics.star.beginFill(starColor, 1);
  graphics.star.drawCircle(screenPos.x, screenPos.y, screenRadius);
  graphics.star.endFill();
}

function drawOrbits() {
  graphics.orbits.clear();
  graphics.orbits.lineStyle(1, COLOR.orbit, 1);
  const center = worldToScreen({ x: 0, y: 0 }, camera.value);

  for (const planet of navStore.planets ?? []) {
    const screenRadius = planet.orbitRadius * zoom.value;
    // Draw dashed orbit using segments
    drawDashedCircle(graphics.orbits, center.x, center.y, screenRadius, 5, 5);
  }
}

function drawDashedCircle(g: Graphics, cx: number, cy: number, radius: number, dashLength: number, gapLength: number) {
  const circumference = 2 * Math.PI * radius;
  const totalLength = dashLength + gapLength;
  const segments = Math.floor(circumference / totalLength);
  const anglePerSegment = (2 * Math.PI) / segments;
  const dashAngle = (dashLength / circumference) * 2 * Math.PI;

  for (let i = 0; i < segments; i++) {
    const startAngle = i * anglePerSegment;
    const endAngle = startAngle + dashAngle;
    g.arc(cx, cy, radius, startAngle, endAngle);
    g.moveTo(cx + radius * Math.cos(endAngle + (anglePerSegment - dashAngle)), cy + radius * Math.sin(endAngle + (anglePerSegment - dashAngle)));
  }
}

function drawPlanets() {
  for (const planet of navStore.planets ?? []) {
    const screenPos = worldToScreen(planet.position, camera.value);
    const screenRadius = Math.max(planet.radius * zoom.value, 12);
    const isSelected = navStore.selectedObjectId === planet.id;

    // Selection highlight
    if (isSelected) {
      graphics.highlights.lineStyle(2, COLOR.selected, 1);
      graphics.highlights.drawCircle(screenPos.x, screenPos.y, screenRadius + 6);
    }

    // Planet body
    const planetColor = parseInt(planet.color.replace('#', ''), 16);
    const planetGraphic = new Graphics();
    planetGraphic.beginFill(planetColor, 1);
    planetGraphic.drawCircle(screenPos.x, screenPos.y, screenRadius);
    planetGraphic.endFill();
    graphics.planets.addChild(planetGraphic);
  }
}

function drawStations(activePortId: string | null = null) {
  for (const station of navStore.stations ?? []) {
    const screenPos = worldToScreen(station.position, camera.value);
    const isSelected = navStore.selectedObjectId === station.id;

    const templateId = station.templateId ?? station.type;
    const template = getStationTemplateById(templateId);
    const stationScale = station.dockingRange * STATION_VISUAL_MULTIPLIER;
    const stationRotation = station.rotation ?? 0;

    if (template) {
      // Selection highlight
      if (isSelected) {
        const selectionRadius = (template.boundingRadius ?? 1) * stationScale * zoom.value + 6;
        graphics.highlights.lineStyle(2, COLOR.selected, 1);
        graphics.highlights.drawCircle(screenPos.x, screenPos.y, selectionRadius);
      }

      // Render station shape with LOD
      const stationGraphic = new Graphics();
      const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };
      const cameraVec = { x: cameraCenter.value.x, y: cameraCenter.value.y };

      renderPixiShapeWithLOD(stationGraphic, {
        shape: template.shape,
        position: station.position,
        rotation: stationRotation,
        scale: stationScale,
        camera: cameraVec,
        screenCenter,
        zoom: zoom.value,
        fillColor: COLOR.station,
        strokeColor: 0xcc9900,
        lineWidth: 1,
        minSize: 8,
      });
      graphics.stations.addChild(stationGraphic);

      // Docking ports
      const screenSize = (template.boundingRadius ?? 1) * stationScale * zoom.value;
      if (screenSize > 20) {
        drawDockingPorts(station, activePortId);
      }
    } else {
      // Fallback diamond
      const size = 10;

      if (isSelected) {
        graphics.highlights.lineStyle(2, COLOR.selected, 1);
        graphics.highlights.drawCircle(screenPos.x, screenPos.y, size + 8);
      }

      const stationGraphic = new Graphics();
      stationGraphic.beginFill(COLOR.station, 1);
      stationGraphic.moveTo(screenPos.x, screenPos.y - size);
      stationGraphic.lineTo(screenPos.x + size, screenPos.y);
      stationGraphic.lineTo(screenPos.x, screenPos.y + size);
      stationGraphic.lineTo(screenPos.x - size, screenPos.y);
      stationGraphic.closePath();
      stationGraphic.endFill();
      graphics.stations.addChild(stationGraphic);
    }
  }
}

function drawDockingPorts(station: Station, activePortId: string | null) {
  const ports = navStore.getStationDockingPorts(station);
  const time = Date.now() / 1000;

  for (const portInfo of ports) {
    const portScreenPos = worldToScreen(portInfo.worldPosition, camera.value);
    const portRange = getDockingRange(portInfo.port);
    const visualRange = getVisualDockingRange(portRange);
    const screenRange = visualRange * zoom.value;
    const isActive = portInfo.port.id === activePortId;

    // Port circle
    graphics.dockingGuidance.lineStyle(1, isActive ? COLOR.dockingPort : COLOR.dockingPortUnavailable, 0.5);
    graphics.dockingGuidance.drawCircle(portScreenPos.x, portScreenPos.y, screenRange);

    // Port marker
    const markerSize = isActive ? 6 : 4;
    graphics.dockingGuidance.beginFill(isActive ? COLOR.dockingPort : COLOR.dockingPortRange, 1);
    graphics.dockingGuidance.drawCircle(portScreenPos.x, portScreenPos.y, markerSize);
    graphics.dockingGuidance.endFill();

    // Runway lights for active port
    if (isActive) {
      drawRunwayLights(portInfo.worldPosition, portInfo.approachVector, portRange, time);
    }
  }
}

function drawRunwayLights(portWorldPos: Vector2, approachVector: Vector2, portRange: number, time: number) {
  const runwayLength = portRange * RUNWAY_LENGTH_FACTOR;
  const lightSpacing = runwayLength / 6;
  const runwayWidth = 15;

  // Perpendicular vector
  const perpX = -approachVector.y;
  const perpY = approachVector.x;

  for (let i = 1; i <= 6; i++) {
    const distance = i * lightSpacing;
    const pulsePhase = (time * 2 + i * 0.3) % 1;
    const alpha = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI);

    // Left light
    const leftWorld = {
      x: portWorldPos.x + approachVector.x * distance - perpX * runwayWidth,
      y: portWorldPos.y + approachVector.y * distance - perpY * runwayWidth,
    };
    const leftScreen = worldToScreen(leftWorld, camera.value);

    // Right light
    const rightWorld = {
      x: portWorldPos.x + approachVector.x * distance + perpX * runwayWidth,
      y: portWorldPos.y + approachVector.y * distance + perpY * runwayWidth,
    };
    const rightScreen = worldToScreen(rightWorld, camera.value);

    const lightColor = i <= 2 ? 0x00ff00 : (i <= 4 ? 0xffff00 : 0xff0000);
    graphics.dockingGuidance.beginFill(lightColor, alpha);
    graphics.dockingGuidance.drawCircle(leftScreen.x, leftScreen.y, 3);
    graphics.dockingGuidance.drawCircle(rightScreen.x, rightScreen.y, 3);
    graphics.dockingGuidance.endFill();
  }
}

function drawDockingApproachGuidance() {
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
    const nearestPort = navStore.findNearestDockingPort(shipStore.position, shipStore.heading);
    if (nearestPort) {
      dockingStatus = nearestPort;
      targetStation = nearestPort.station;
    }
  }

  if (!dockingStatus?.port || !dockingStatus?.portWorldPosition || !targetStation) return;

  const portRange = getDockingRange(dockingStatus.port);
  if (dockingStatus.distance > portRange * 60) return;

  const portScreenPos = worldToScreen(dockingStatus.portWorldPosition, camera.value);

  const templateId = targetStation.templateId ?? targetStation.type;
  const template = getStationTemplateById(templateId);
  if (!template) return;

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

  const approachMagnitude = Math.hypot(worldApproachVector.x, worldApproachVector.y);
  if (approachMagnitude < 0.001) return;

  // Docking range circle
  const visualRange = getVisualDockingRange(portRange);
  const screenRange = visualRange * zoom.value;
  graphics.dockingGuidance.lineStyle(2, dockingStatus.inRange ? COLOR.dockingPort : COLOR.dockingPortUnavailable, 1);
  drawDashedCircle(graphics.dockingGuidance, portScreenPos.x, portScreenPos.y, screenRange, 5, 5);

  // Runway bounding box
  const runwayLength = portRange * 10;
  const runwayWidth = 25;

  const corners = computeRunwayCorners(dockingStatus.portWorldPosition, worldApproachVector, runwayLength, runwayWidth);
  const p1s = worldToScreen(corners.p1, camera.value);
  const p2s = worldToScreen(corners.p2, camera.value);
  const p3s = worldToScreen(corners.p3, camera.value);
  const p4s = worldToScreen(corners.p4, camera.value);

  // Fill runway rectangle
  const fillAlpha = dockingStatus.nearLights ? 0.12 : 0.04;
  graphics.dockingGuidance.beginFill(COLOR.dockingPort, fillAlpha);
  graphics.dockingGuidance.moveTo(p1s.x, p1s.y);
  graphics.dockingGuidance.lineTo(p2s.x, p2s.y);
  graphics.dockingGuidance.lineTo(p3s.x, p3s.y);
  graphics.dockingGuidance.lineTo(p4s.x, p4s.y);
  graphics.dockingGuidance.closePath();
  graphics.dockingGuidance.endFill();

  // Stroke runway
  const strokeAlpha = dockingStatus.nearLights ? 0.6 : 0.25;
  const strokeWidth = dockingStatus.nearLights ? 2 : 1;
  graphics.dockingGuidance.lineStyle(strokeWidth, COLOR.dockingPort, strokeAlpha);
  graphics.dockingGuidance.moveTo(p1s.x, p1s.y);
  graphics.dockingGuidance.lineTo(p2s.x, p2s.y);
  graphics.dockingGuidance.lineTo(p3s.x, p3s.y);
  graphics.dockingGuidance.lineTo(p4s.x, p4s.y);
  graphics.dockingGuidance.closePath();

  // Center approach line (dashed)
  const guideLineLength = runwayLength * zoom.value;
  const approachStartX = portScreenPos.x + worldApproachVector.x * guideLineLength;
  const approachStartY = portScreenPos.y - worldApproachVector.y * guideLineLength;

  graphics.dockingGuidance.lineStyle(1, 0x00ff80, 0.3);
  drawDashedLine(graphics.dockingGuidance, approachStartX, approachStartY, portScreenPos.x, portScreenPos.y, 5, 10);

  // Port marker
  const portMarkerSize = dockingStatus.inRange ? 10 : 6;
  graphics.dockingGuidance.beginFill(dockingStatus.inRange ? COLOR.dockingPort : COLOR.dockingPortRange, 1);
  graphics.dockingGuidance.drawCircle(portScreenPos.x, portScreenPos.y, portMarkerSize);
  graphics.dockingGuidance.endFill();
}

function drawDashedLine(g: Graphics, x1: number, y1: number, x2: number, y2: number, dashLength: number, gapLength: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const unitX = dx / distance;
  const unitY = dy / distance;
  const totalLength = dashLength + gapLength;
  const segments = Math.floor(distance / totalLength);

  for (let i = 0; i < segments; i++) {
    const startDist = i * totalLength;
    const endDist = startDist + dashLength;
    g.moveTo(x1 + unitX * startDist, y1 + unitY * startDist);
    g.lineTo(x1 + unitX * endDist, y1 + unitY * endDist);
  }
}

function drawJumpGates() {
  const size = 12;
  graphics.jumpGates.clear();
  graphics.jumpGates.beginFill(COLOR.jumpGate, 1);

  for (const gate of navStore.jumpGates ?? []) {
    const screenPos = worldToScreen(gate.position, camera.value);

    // Hexagon
    graphics.jumpGates.moveTo(screenPos.x + size, screenPos.y);
    for (let i = 1; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const x = screenPos.x + size * Math.cos(angle);
      const y = screenPos.y + size * Math.sin(angle);
      graphics.jumpGates.lineTo(x, y);
    }
    graphics.jumpGates.closePath();

    if (navStore.selectedObjectId === gate.id) {
      graphics.highlights.lineStyle(2, COLOR.selected, 1);
      graphics.highlights.drawCircle(screenPos.x, screenPos.y, size + 8);
    }
  }

  graphics.jumpGates.endFill();
}

function drawCourseProjection() {
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const isReversing = shipStore.speed < 0 || shipStore.targetSpeed < 0;
  const effectiveHeading = shipStore.speed < 0 ? shipStore.heading + 180 : shipStore.heading;
  const effectiveSpeed = Math.abs(shipStore.speed);
  const headingRad = (effectiveHeading * Math.PI) / 180;
  const distance = effectiveSpeed * 20;
  const endX = shipStore.position.x + distance * Math.sin(headingRad);
  const endY = shipStore.position.y - distance * Math.cos(headingRad);
  const endScreen = worldToScreen({ x: endX, y: endY }, camera.value);

  const color = isReversing ? COLOR.courseProjectionReverse : COLOR.courseProjection;
  graphics.courseProjection.clear();
  graphics.courseProjection.lineStyle(2, color, isReversing ? 0.6 : 0.5);
  graphics.courseProjection.moveTo(shipScreenPos.x, shipScreenPos.y);
  graphics.courseProjection.lineTo(endScreen.x, endScreen.y);
}

function drawWaypointsAndPaths() {
  graphics.waypoints.clear();
  graphics.paths.clear();

  const waypoints = navStore.waypoints ?? [];
  if (waypoints.length > 0) {
    const shipPos = worldToScreen(shipStore.position, camera.value);
    const first = worldToScreen(waypoints[0]!.position, camera.value);
    graphics.paths.lineStyle(2, COLOR.waypointActive, 0.6);
    graphics.paths.moveTo(shipPos.x, shipPos.y);
    graphics.paths.lineTo(first.x, first.y);

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = worldToScreen(waypoints[i]!.position, camera.value);
      const to = worldToScreen(waypoints[i + 1]!.position, camera.value);
      graphics.paths.moveTo(from.x, from.y);
      graphics.paths.lineTo(to.x, to.y);
    }
  }

  waypoints.forEach((waypoint, index) => {
    const screenPos = worldToScreen(waypoint.position, camera.value);
    const active = index === 0;
    const color = active ? COLOR.waypointActive : COLOR.waypointInactive;
    const alpha = active ? 0.8 : 0.6;
    const size = 8;

    graphics.waypoints.lineStyle(2, color, alpha);
    graphics.waypoints.beginFill(color, 0.15);
    graphics.waypoints.drawRect(screenPos.x - size, screenPos.y - size, size * 2, size * 2);
    graphics.waypoints.endFill();
  });
}

function drawTractorBeam() {
  const targetPos = shipStore.tractorBeam.targetPosition;
  const stationId = shipStore.tractorBeam.stationId;
  const portId = shipStore.tractorBeam.portId;
  if (!targetPos || !stationId || !portId) return;

  const station = navStore.stations.find(s => s.id === stationId);
  if (!station) return;

  const ports = navStore.getStationDockingPorts(station);
  const targetPort = ports.find(p => p.port.id === portId);
  if (!targetPort) return;

  const portScreenPos = worldToScreen(targetPort.worldPosition, camera.value);
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const targetScreenPos = worldToScreen(targetPos, camera.value);

  const distance = Math.hypot(shipScreenPos.x - portScreenPos.x, shipScreenPos.y - portScreenPos.y);
  if (distance < 1) return;

  const time = Date.now() * 0.003;
  const pulsePhase = Math.sin(time * 2);

  graphics.tractorBeam.clear();

  // Outer glow
  graphics.tractorBeam.lineStyle(12, COLOR.tractorBeamOuter, 0.2 + pulsePhase * 0.1);
  graphics.tractorBeam.moveTo(portScreenPos.x, portScreenPos.y);
  graphics.tractorBeam.lineTo(shipScreenPos.x, shipScreenPos.y);

  // Middle beam
  graphics.tractorBeam.lineStyle(6, COLOR.tractorBeamMiddle, 0.4 + pulsePhase * 0.2);
  graphics.tractorBeam.moveTo(portScreenPos.x, portScreenPos.y);
  graphics.tractorBeam.lineTo(shipScreenPos.x, shipScreenPos.y);

  // Core beam (animated dashes)
  graphics.tractorBeam.lineStyle(2, COLOR.tractorBeamCore, 0.8 + pulsePhase * 0.2);
  drawDashedLine(graphics.tractorBeam, portScreenPos.x, portScreenPos.y, shipScreenPos.x, shipScreenPos.y, 10, 15);

  // Target indicator
  graphics.tractorBeam.lineStyle(2, COLOR.tractorBeamTarget, 0.6 + pulsePhase * 0.2);
  drawDashedCircle(graphics.tractorBeam, targetScreenPos.x, targetScreenPos.y, 15 + pulsePhase * 3, 4, 4);

  // Inner target dot
  graphics.tractorBeam.beginFill(COLOR.tractorBeamTarget, 0.8 + pulsePhase * 0.2);
  graphics.tractorBeam.drawCircle(targetScreenPos.x, targetScreenPos.y, 4);
  graphics.tractorBeam.endFill();
}

function drawShip() {
  const template = getShipTemplate(shipStore.templateId);
  if (!template) return;

  graphics.ship.clear();
  const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };
  const cameraVec = { x: cameraCenter.value.x, y: cameraCenter.value.y };

  renderPixiShapeWithLOD(graphics.ship, {
    shape: template.shape,
    position: shipStore.position,
    rotation: shipStore.heading,
    scale: shipStore.size,
    camera: cameraVec,
    screenCenter,
    zoom: zoom.value,
    fillColor: COLOR.ship,
    strokeColor: COLOR.shipHeading,
    lineWidth: 1,
    minSize: 6,
  });

  // Engine mounts when zoomed in
  if (template.engineMounts.length > 0) {
    drawEngineMounts(template.engineMounts);
  }
}

function drawEngineMounts(engineMounts: Array<{ position: Vector2; direction: number }>) {
  graphics.engineMounts.clear();
  const headingRad = (shipStore.heading * Math.PI) / 180;

  for (const mount of engineMounts) {
    // Transform mount position
    const rotatedX = mount.position.x * Math.cos(headingRad) - mount.position.y * Math.sin(headingRad);
    const rotatedY = mount.position.x * Math.sin(headingRad) + mount.position.y * Math.cos(headingRad);
    const worldX = shipStore.position.x + rotatedX * shipStore.size;
    const worldY = shipStore.position.y + rotatedY * shipStore.size;
    const screenPos = worldToScreen({ x: worldX, y: worldY }, camera.value);

    const mountScreenSize = 3 * zoom.value;
    if (mountScreenSize > 2) {
      graphics.engineMounts.beginFill(0xff6600, 1);
      graphics.engineMounts.drawCircle(screenPos.x, screenPos.y, Math.max(2, mountScreenSize));
      graphics.engineMounts.endFill();
    }
  }
}

function drawCollisionWarnings() {
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const warningLevel = collision.highestWarningLevel.value;

  if (warningLevel === 'none') return;

  const ringColor = COLLISION_COLORS[warningLevel];
  const ringRadius = Math.max(shipStore.size * zoom.value, 20) + 8;
  const pulseIntensity = warningLevel === 'danger' ? 0.8 : (warningLevel === 'warning' ? 0.5 : 0.3);
  const pulsePhase = (Date.now() % 1000) / 1000;
  const pulseAlpha = 0.3 + pulseIntensity * Math.sin(pulsePhase * Math.PI * 2);

  graphics.collisionWarnings.clear();
  graphics.collisionWarnings.lineStyle(warningLevel === 'danger' ? 3 : 2, ringColor, pulseAlpha);
  graphics.collisionWarnings.drawCircle(shipScreenPos.x, shipScreenPos.y, ringRadius);

  // Contact points for danger level
  for (const warning of collision.warnings.value) {
    if (warning.level === 'danger' && warning.collisionPoint) {
      drawCollisionContactPoint(warning.collisionPoint, warning.normal);
    }
  }
}

function drawCollisionContactPoint(contactPoint: Vector2, normal?: Vector2) {
  const screenPos = worldToScreen(contactPoint, camera.value);
  const size = 6;

  // X marker
  graphics.collisionWarnings.lineStyle(2, COLLISION_COLORS.danger, 1);
  graphics.collisionWarnings.moveTo(screenPos.x - size, screenPos.y - size);
  graphics.collisionWarnings.lineTo(screenPos.x + size, screenPos.y + size);
  graphics.collisionWarnings.moveTo(screenPos.x + size, screenPos.y - size);
  graphics.collisionWarnings.lineTo(screenPos.x - size, screenPos.y + size);

  // Normal arrow
  if (normal) {
    const arrowLength = 20;
    const endPos = {
      x: screenPos.x + normal.x * arrowLength,
      y: screenPos.y - normal.y * arrowLength,
    };

    graphics.collisionWarnings.lineStyle(1, COLLISION_COLORS.warning, 1);
    graphics.collisionWarnings.moveTo(screenPos.x, screenPos.y);
    graphics.collisionWarnings.lineTo(endPos.x, endPos.y);

    // Arrow head
    const headSize = 4;
    const angle = Math.atan2(-normal.y, normal.x);
    graphics.collisionWarnings.moveTo(endPos.x, endPos.y);
    graphics.collisionWarnings.lineTo(
      endPos.x - headSize * Math.cos(angle - Math.PI / 6),
      endPos.y - headSize * Math.sin(angle - Math.PI / 6)
    );
    graphics.collisionWarnings.moveTo(endPos.x, endPos.y);
    graphics.collisionWarnings.lineTo(
      endPos.x - headSize * Math.cos(angle + Math.PI / 6),
      endPos.y - headSize * Math.sin(angle + Math.PI / 6)
    );
  }
}

// Event handlers
function toWorldPoint(event: MouseEvent): Vector2 {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  return screenToWorld(screenPoint, camera.value);
}

function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.max(0.2, Math.min(3, zoom.value + zoomDelta));
}

function handleMouseDown(event: MouseEvent) {
  const worldPos = toWorldPoint(event);
  const clickRadius = 20 / zoom.value;

  if (event.button === 0) {
    // Check stations
    for (const station of navStore.stations) {
      const dx = station.position.x - worldPos.x;
      const dy = station.position.y - worldPos.y;
      if (Math.hypot(dx, dy) < clickRadius) {
        navStore.selectStation(station.id);
        sensorStore.selectContact(station.id);
        return;
      }
    }

    // Check planets
    for (const planet of navStore.planets) {
      const dx = planet.position.x - worldPos.x;
      const dy = planet.position.y - worldPos.y;
      if (Math.hypot(dx, dy) < clickRadius + planet.radius) {
        navStore.selectPlanet(planet.id);
        sensorStore.selectContact(planet.id);
        return;
      }
    }

    // Check jump gates
    for (const gate of navStore.jumpGates) {
      const dx = gate.position.x - worldPos.x;
      const dy = gate.position.y - worldPos.y;
      if (Math.hypot(dx, dy) < clickRadius) {
        navStore.selectJumpGate(gate.id);
        sensorStore.selectContact(gate.id);
        return;
      }
    }

    // Click to steer
    const targetHeading = navStore.getHeadingToWaypoint(shipStore.position, worldPos);
    navStore.disableAutopilot();
    shipStore.setTargetHeading(targetHeading);
    navStore.clearSelection();
    sensorStore.clearSelection();
  } else if (event.button === 2) {
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
    handleModuleHover(event);
  }
}

function handleModuleHover(event: MouseEvent) {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return;

  const screenPoint = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  const cameraVec = { x: cameraCenter.value.x, y: cameraCenter.value.y };
  const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };
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
  if (!containerRef.value) return;
  canvasWidth.value = containerRef.value.clientWidth;
  canvasHeight.value = containerRef.value.clientHeight;
  pixiRenderer.resize(canvasWidth.value, canvasHeight.value);
}

function centerOnShip() {
  panOffset.value = { x: 0, y: 0 };
}

defineExpose({ centerOnShip, zoom });

async function initializeRenderer() {
  const capability = detectCapabilities();
  rendererStore.setCapability(capability.selected, capability.fallbackReason);
  if (!meetsMinimumRequirements(capability.selected)) {
    rendererReady.value = false;
    return;
  }

  const width = containerRef.value?.clientWidth ?? canvasWidth.value;
  const height = containerRef.value?.clientHeight ?? canvasHeight.value;
  canvasWidth.value = width;
  canvasHeight.value = height;

  await pixiRenderer.initialize({
    width,
    height,
    capability: capability.selected,
    backgroundColor: COLOR.background,
  });

  const canvas = pixiRenderer.getCanvas();
  if (canvas && containerRef.value) {
    canvas.classList.add('helm-map__canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.value.prepend(canvas);
  }

  backgroundLayer = pixiRenderer.getLayer('background');
  gameLayer = pixiRenderer.getLayer('game');
  effectsLayer = pixiRenderer.getLayer('effects');
  uiLayer = pixiRenderer.getLayer('ui');

  attachGraphics();
  rendererStore.setInitialized(true);
  rendererReady.value = true;
}

onMounted(async () => {
  await initializeRenderer();
  handleResize();
  window.addEventListener('resize', handleResize);
  loopUnsubscribe = subscribe(render);
  render();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  loopUnsubscribe?.();
  pixiRenderer.destroy();
});
</script>

<template>
  <div
    ref="containerRef"
    class="helm-map"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @contextmenu="handleContextMenu"
  >
    <div class="helm-map__overlay">
      <div class="helm-map__info">
        <span class="helm-map__system-name">{{ navStore.systemName }}</span>
        <span class="helm-map__zoom">{{ (zoom * 100).toFixed(0) }}%</span>
      </div>
      <div
        v-if="collision.highestWarningLevel.value !== 'none'"
        class="helm-map__collision-warning"
        :class="`helm-map__collision-warning--${collision.highestWarningLevel.value}`"
      >
        <span class="helm-map__collision-warning-icon">&#9888;</span>
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
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" />
          <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1" />
          <circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1" />
          <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
    <div
      v-if="tooltipVisible && tooltipContent"
      class="helm-map__tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="helm-map__tooltip-station">{{ tooltipContent.stationName }}</div>
      <div class="helm-map__tooltip-module">{{ tooltipContent.moduleName }}</div>
      <div class="helm-map__tooltip-type">{{ tooltipContent.moduleType.toUpperCase() }}</div>
      <div class="helm-map__tooltip-status">{{ tooltipContent.moduleStatus }}</div>
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
    &:active { cursor: grabbing; }
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

  &__collision-warning-icon { font-size: $font-size-md; }
  &__collision-warning-text { font-weight: bold; }
  &__collision-warning-object { opacity: 0.8; font-size: $font-size-xs; }

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

  &__tooltip-station { color: $color-gold; font-weight: bold; margin-bottom: 2px; }
  &__tooltip-module { color: $color-white; margin-bottom: 2px; }
  &__tooltip-type { color: $color-gray; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
  &__tooltip-status { color: $color-success; font-size: 10px; }
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
