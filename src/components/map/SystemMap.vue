<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Container, Graphics, Text } from 'pixi.js';
import { useNavigationStore, useSensorStore, useShipStore } from '@/stores';
import { useRendererStore } from '@/stores/rendererStore';
import { useGameLoop } from '@/core/game-loop';
import {
  MAP_COLORS,
  STATION_VISUAL_MULTIPLIER,
  worldToScreen,
  screenToWorld,
  findModuleAtScreenPosition,
  type CameraState,
} from '@/core/rendering';
import {
  PixiRenderer,
  detectCapabilities,
  meetsMinimumRequirements,
} from '@/core/rendering';
import {
  createDefaultStarfieldConfig,
  generateStarsForCell,
  getVisibleCells,
  starToScreen,
} from '@/core/starfield';
import { getShipTemplate, getStationTemplateById, calculateStationBoundingRadius } from '@/data/shapes';
import type { Vector2, Station } from '@/models';
import type { StarfieldConfig } from '@/models/Starfield';

const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const rendererStore = useRendererStore();
const { subscribe } = useGameLoop();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const zoom = ref(0.5);
const panOffset = ref<Vector2>({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref<Vector2>({ x: 0, y: 0 });

const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipContent = ref<{
  stationName: string;
  moduleName: string;
  moduleType: string;
  moduleStatus: string;
} | null>(null);

const starfieldConfig = ref<StarfieldConfig | null>(null);
const rendererReady = ref(false);
let loopUnsubscribe: (() => void) | null = null;

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

const pixiRenderer = new PixiRenderer();
let backgroundLayer: Container | undefined;
let gameLayer: Container | undefined;
let effectsLayer: Container | undefined;
let uiLayer: Container | undefined;

const graphics = {
  starfield: new Graphics(),
  grid: new Graphics(),
  orbits: new Graphics(),
  planets: new Container(),
  stations: new Container(),
  jumpGates: new Graphics(),
  waypoints: new Graphics(),
  paths: new Graphics(),
  ship: new Graphics(),
  highlights: new Graphics(),
  labels: new Container(),
};

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
};

watch(
  () => navStore.currentSystem,
  (system) => {
    starfieldConfig.value = system ? createDefaultStarfieldConfig(system.id) : null;
  },
  { immediate: true }
);

function attachGraphics() {
  backgroundLayer?.addChild(graphics.starfield);
  backgroundLayer?.addChild(graphics.grid);
  gameLayer?.addChild(graphics.orbits);
  gameLayer?.addChild(graphics.planets);
  gameLayer?.addChild(graphics.stations);
  gameLayer?.addChild(graphics.jumpGates);
  gameLayer?.addChild(graphics.ship);
  uiLayer?.addChild(graphics.paths);
  uiLayer?.addChild(graphics.waypoints);
  effectsLayer?.addChild(graphics.highlights);
  uiLayer?.addChild(graphics.labels);
}

function resetGraphics() {
  graphics.starfield.clear();
  graphics.grid.clear();
  graphics.orbits.clear();
  graphics.jumpGates.clear();
  graphics.waypoints.clear();
  graphics.paths.clear();
  graphics.ship.clear();
  graphics.highlights.clear();
  graphics.labels.removeChildren();
  graphics.planets.removeChildren();
  graphics.stations.removeChildren();
}

function toWorldPoint(event: MouseEvent): Vector2 {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  return screenToWorld(screenPoint, camera.value);
}

function formatModuleType(type: string): string {
  return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getModuleStatus(_moduleType: string): string {
  return 'Operational';
}

function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.max(0.1, Math.min(3, zoom.value + zoomDelta));
}

function selectStationAt(worldPos: Vector2, clickRadius: number): boolean {
  for (const station of navStore.stations) {
    const dx = station.position.x - worldPos.x;
    const dy = station.position.y - worldPos.y;
    if (Math.hypot(dx, dy) < clickRadius) {
      navStore.selectStation(station.id);
      sensorStore.selectContact(station.id);
      return true;
    }
  }
  return false;
}

function selectPlanetAt(worldPos: Vector2, clickRadius: number): boolean {
  for (const planet of navStore.planets) {
    const dx = planet.position.x - worldPos.x;
    const dy = planet.position.y - worldPos.y;
    if (Math.hypot(dx, dy) < clickRadius + planet.radius) {
      navStore.selectPlanet(planet.id);
      sensorStore.selectContact(planet.id);
      return true;
    }
  }
  return false;
}

function selectGateAt(worldPos: Vector2, clickRadius: number): boolean {
  for (const gate of navStore.jumpGates) {
    const dx = gate.position.x - worldPos.x;
    const dy = gate.position.y - worldPos.y;
    if (Math.hypot(dx, dy) < clickRadius) {
      navStore.selectJumpGate(gate.id);
      sensorStore.selectContact(gate.id);
      return true;
    }
  }
  return false;
}

function selectAnyObject(worldPos: Vector2, clickRadius: number): boolean {
  return selectStationAt(worldPos, clickRadius) || selectPlanetAt(worldPos, clickRadius) || selectGateAt(worldPos, clickRadius);
}

function removeWaypointAt(worldPos: Vector2, clickRadius: number): boolean {
  for (const waypoint of navStore.waypoints) {
    const dx = waypoint.position.x - worldPos.x;
    const dy = waypoint.position.y - worldPos.y;
    if (Math.hypot(dx, dy) < clickRadius) {
      navStore.removeWaypoint(waypoint.id);
      return true;
    }
  }
  return false;
}

function handleLeftClick(worldPos: Vector2, clickRadius: number, event: MouseEvent) {
  if (selectAnyObject(worldPos, clickRadius)) return;

  if (!event.shiftKey) {
    navStore.clearWaypoints();
  }
  navStore.addWaypoint(worldPos);
  navStore.clearSelection();
  sensorStore.clearSelection();
}

function handleRightClick(worldPos: Vector2, clickRadius: number, event: MouseEvent) {
  if (removeWaypointAt(worldPos, clickRadius)) return;
  isDragging.value = true;
  dragStart.value = { x: event.clientX, y: event.clientY };
}

function handleMouseDown(event: MouseEvent) {
  const worldPos = toWorldPoint(event);
  const clickRadius = 20 / zoom.value;

  if (event.button === 0) {
    handleLeftClick(worldPos, clickRadius, event);
  } else if (event.button === 2) {
    handleRightClick(worldPos, clickRadius, event);
  }
}

function handleMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    const dx = (event.clientX - dragStart.value.x) / zoom.value;
    const dy = (event.clientY - dragStart.value.y) / zoom.value;
    panOffset.value = { x: panOffset.value.x - dx, y: panOffset.value.y + dy };
    dragStart.value = { x: event.clientX, y: event.clientY };
  } else {
    handleModuleHover(event);
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleMouseLeave() {
  handleMouseUp();
  tooltipVisible.value = false;
  tooltipContent.value = null;
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

function handleModuleHover(event: MouseEvent) {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect) return;

  const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };
  const getStationScale = (station: Station) => station.dockingRange * STATION_VISUAL_MULTIPLIER;

  const result = findModuleAtScreenPosition(
    screenPoint,
    navStore.stations,
    getStationTemplateById,
    { x: cameraCenter.value.x, y: cameraCenter.value.y },
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

function drawStar() {
  if (!navStore.currentSystem?.star) return;
  const star = navStore.currentSystem.star;
  const screenPos = worldToScreen({ x: 0, y: 0 }, camera.value);
  const screenRadius = star.radius * camera.value.zoom;

  graphics.grid.beginFill(COLOR.star, 0.25);
  graphics.grid.drawCircle(screenPos.x, screenPos.y, screenRadius * 2);
  graphics.grid.endFill();

  graphics.grid.beginFill(COLOR.star, 1);
  graphics.grid.drawCircle(screenPos.x, screenPos.y, screenRadius);
  graphics.grid.endFill();
}

function drawOrbits() {
  graphics.orbits.clear();
  graphics.orbits.lineStyle(1, COLOR.orbit, 1);
  const center = worldToScreen({ x: 0, y: 0 }, camera.value);

  for (const planet of navStore.planets) {
    const screenRadius = planet.orbitRadius * camera.value.zoom;
    graphics.orbits.drawCircle(center.x, center.y, screenRadius);
  }
}

function drawPlanets() {
  for (const planet of navStore.planets) {
    const screenPos = worldToScreen(planet.position, camera.value);
    const screenRadius = Math.max(planet.radius * camera.value.zoom, 12);
    const planetGraphic = new Graphics();
    planetGraphic.beginFill(COLOR.planet, 1);
    planetGraphic.drawCircle(screenPos.x, screenPos.y, screenRadius);
    planetGraphic.endFill();
    graphics.planets.addChild(planetGraphic);

    if (navStore.selectedObjectId === planet.id) {
      graphics.highlights.lineStyle(2, COLOR.selected, 1);
      graphics.highlights.drawCircle(screenPos.x, screenPos.y, screenRadius + 6);
    }

    const label = new Text({
      text: planet.name,
      style: {
        fill: MAP_COLORS.planet,
        fontSize: 11,
        fontFamily: 'Share Tech Mono, monospace',
      },
    });
    label.anchor.set(0.5, 0);
    label.position.set(screenPos.x, screenPos.y + screenRadius + 6);
    graphics.labels.addChild(label);
  }
}

function drawStations() {
  for (const station of navStore.stations) {
    const screenPos = worldToScreen(station.position, camera.value);
    const templateId = station.templateId ?? station.type;
    const template = getStationTemplateById(templateId);
    const baseRadius = template ? (template.boundingRadius ?? calculateStationBoundingRadius(template.modules)) : 10;
    const stationScale = station.dockingRange * STATION_VISUAL_MULTIPLIER;
    const screenSize = Math.max(12, Math.min(baseRadius * stationScale * camera.value.zoom, 64));

    const dockingRange = station.dockingRange * camera.value.zoom;
    graphics.highlights.lineStyle(1, COLOR.selected, 0.5);
    graphics.highlights.drawCircle(screenPos.x, screenPos.y, dockingRange);

    const stationGraphic = new Graphics();
    stationGraphic.beginFill(COLOR.station, 1);
    stationGraphic.moveTo(screenPos.x, screenPos.y - screenSize);
    stationGraphic.lineTo(screenPos.x + screenSize, screenPos.y);
    stationGraphic.lineTo(screenPos.x, screenPos.y + screenSize);
    stationGraphic.lineTo(screenPos.x - screenSize, screenPos.y);
    stationGraphic.closePath();
    stationGraphic.endFill();
    graphics.stations.addChild(stationGraphic);

    if (navStore.selectedObjectId === station.id) {
      graphics.highlights.lineStyle(2, COLOR.selected, 1);
      graphics.highlights.drawCircle(screenPos.x, screenPos.y, screenSize + 8);
    }

    const label = new Text({
      text: station.name,
      style: {
        fill: MAP_COLORS.station,
        fontSize: 11,
        fontFamily: 'Share Tech Mono, monospace',
      },
    });
    label.anchor.set(0.5, 0);
    label.position.set(screenPos.x, screenPos.y + screenSize + 6);
    graphics.labels.addChild(label);
  }
}

function drawJumpGates() {
  const size = 12;
  graphics.jumpGates.clear();
  graphics.jumpGates.beginFill(COLOR.jumpGate, 1);

  for (const gate of navStore.jumpGates) {
    const screenPos = worldToScreen(gate.position, camera.value);
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

    const label = new Text({
      text: gate.name,
      style: {
        fill: MAP_COLORS.jumpGate,
        fontSize: 11,
        fontFamily: 'Share Tech Mono, monospace',
      },
    });
    label.anchor.set(0.5, 0);
    label.position.set(screenPos.x, screenPos.y + size + 6);
    graphics.labels.addChild(label);
  }

  graphics.jumpGates.endFill();
}

function drawWaypointsAndPaths() {
  graphics.waypoints.clear();
  graphics.paths.clear();

  const waypoints = navStore.waypoints;
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

    const label = new Text({
      text: waypoint.name,
      style: {
        fill: active ? MAP_COLORS.selected : MAP_COLORS.station,
        fontSize: 10,
        fontFamily: 'Share Tech Mono, monospace',
      },
    });
    label.anchor.set(0.5, 0);
    label.position.set(screenPos.x, screenPos.y + size + 4);
    graphics.labels.addChild(label);
  });
}

function drawShip() {
  const screenPos = worldToScreen(shipStore.position, camera.value);
  const isReversing = shipStore.speed < 0 || shipStore.targetSpeed < 0;
  const projectionTime = 20;
  const effectiveHeading = shipStore.speed < 0 ? shipStore.heading + 180 : shipStore.heading;
  const effectiveSpeed = Math.abs(shipStore.speed);
  const headingRad = (effectiveHeading * Math.PI) / 180;
  const distance = effectiveSpeed * projectionTime;
  const endX = shipStore.position.x + distance * Math.sin(headingRad);
  const endY = shipStore.position.y - distance * Math.cos(headingRad);
  const endScreen = worldToScreen({ x: endX, y: endY }, camera.value);

  graphics.paths.lineStyle(2, COLOR.courseProjection, isReversing ? 0.6 : 0.5);
  graphics.paths.moveTo(screenPos.x, screenPos.y);
  graphics.paths.lineTo(endScreen.x, endScreen.y);

  const shipSize = Math.max(8, Math.min(24, (getShipTemplate(shipStore.templateId)?.shape.boundingRadius ?? 6) * shipStore.size * camera.value.zoom));
  graphics.ship.clear();
  graphics.ship.beginFill(COLOR.ship, 1);
  graphics.ship.moveTo(screenPos.x, screenPos.y - shipSize);
  graphics.ship.lineTo(screenPos.x + shipSize * 0.7, screenPos.y + shipSize);
  graphics.ship.lineTo(screenPos.x - shipSize * 0.7, screenPos.y + shipSize);
  graphics.ship.closePath();
  graphics.ship.endFill();

  graphics.ship.lineStyle(2, COLOR.shipHeading, 1);
  graphics.ship.moveTo(screenPos.x, screenPos.y);
  graphics.ship.lineTo(screenPos.x + Math.sin((shipStore.heading * Math.PI) / 180) * shipSize * 1.5, screenPos.y - Math.cos((shipStore.heading * Math.PI) / 180) * shipSize * 1.5);
}

function renderScene() {
  if (!rendererReady.value) return;
  resetGraphics();
  drawStarfield();
  drawGrid();
  drawStar();
  drawOrbits();
  drawPlanets();
  drawStations();
  drawJumpGates();
  drawWaypointsAndPaths();
  drawShip();
  navStore.checkWaypointReached(shipStore.position);
}

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
    canvas.classList.add('system-map__canvas');
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

function centerOnShip() {
  panOffset.value = { x: 0, y: 0 };
}

defineExpose({ centerOnShip, zoom });

onMounted(async () => {
  await initializeRenderer();
  handleResize();
  window.addEventListener('resize', handleResize);
  loopUnsubscribe = subscribe(renderScene);
  renderScene();
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
    class="system-map"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @contextmenu="handleContextMenu"
  >
    <div class="system-map__overlay">
      <div class="system-map__info">
        <span class="system-map__system-name">{{ navStore.systemName }}</span>
        <span class="system-map__zoom">{{ (zoom * 100).toFixed(0) }}%</span>
      </div>
    </div>
    <div
      v-if="tooltipVisible && tooltipContent"
      class="system-map__tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="system-map__tooltip-station">
        {{ tooltipContent.stationName }}
      </div>
      <div class="system-map__tooltip-module">
        {{ tooltipContent.moduleName }}
      </div>
      <div class="system-map__tooltip-type">
        {{ tooltipContent.moduleType.toUpperCase() }}
      </div>
      <div class="system-map__tooltip-status">
        {{ tooltipContent.moduleStatus }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.system-map {
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
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__zoom {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
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
</style>
