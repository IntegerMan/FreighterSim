<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useShipStore, useNavigationStore, useSensorStore, useSettingsStore } from '@/stores';
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
  type CameraState
} from '@/core/rendering';
import { Starfield, createDefaultStarfieldConfig } from '@/core/starfield';
import type { Vector2, Station, Planet, JumpGate } from '@/models';
import { getThreatLevelColor } from '@/models';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const settingsStore = useSettingsStore();
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
  for (const planet of navStore.planets) {
    drawOrbit(ctx, planet);
  }

  // Draw planets
  for (const planet of navStore.planets) {
    drawPlanet(ctx, planet);
  }

  // Draw stations
  for (const station of navStore.stations) {
    drawStation(ctx, station);
  }

  // Draw jump gates
  for (const gate of navStore.jumpGates) {
    drawJumpGate(ctx, gate);
  }

  // Draw course projection (helm-specific) - color changes with reverse
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const isReversing = shipStore.speed < 0 || shipStore.targetSpeed < 0;
  drawCourseProjection(ctx, shipScreenPos, shipStore.heading, shipStore.speed, camera.value, 20, isReversing);

  // Draw waypoint paths
  const waypoints = navStore.waypoints;
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

  // Draw ship
  drawShip(ctx);

  // Check if waypoint reached
  navStore.checkWaypointReached(shipStore.position);
}

function drawRadarOverlay(ctx: CanvasRenderingContext2D) {
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  const displayRange = sensorStore.proximityDisplayRange;
  const screenRange = displayRange * zoom.value;

  for (const segment of sensorStore.radarSegments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    const startRad = (segment.startAngle * Math.PI) / 180;
    const endRad = (segment.endAngle * Math.PI) / 180;
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
  const screenRadius = Math.max(planet.radius * zoom.value, 6);
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

function drawStation(ctx: CanvasRenderingContext2D, station: Station) {
  const screenPos = worldToScreen(station.position, camera.value);
  const size = 10;
  const isSelected = navStore.selectedObjectId === station.id;

  // Docking range circle
  const screenDockingRange = station.dockingRange * zoom.value;
  ctx.fillStyle = MAP_COLORS.dockingRange;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenDockingRange, 0, Math.PI * 2);
  ctx.fill();

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

  // Label
  ctx.fillStyle = MAP_COLORS.station;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(station.name, screenPos.x, screenPos.y + size + 14);
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
  const isReversing = shipStore.speed < 0 || shipStore.targetSpeed < 0;

  // Ship icon - purple when reversing
  const shipColor = isReversing ? '#9966FF' : MAP_COLORS.ship;
  drawShipIcon(ctx, screenPos, shipStore.heading, 8, shipColor);
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
  }
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
      :width="canvasWidth"
      :height="canvasHeight"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @contextmenu="handleContextMenu"
    />
    <div class="helm-map__overlay">
      <div class="helm-map__info">
        <span class="helm-map__system-name">{{ navStore.systemName }}</span>
        <span class="helm-map__zoom">{{ (zoom * 100).toFixed(0) }}%</span>
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
}
</style>
