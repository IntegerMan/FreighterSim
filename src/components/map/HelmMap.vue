<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useShipStore, useNavigationStore, useSensorStore } from '@/stores';
import { useGameLoop } from '@/core/game-loop';
import { 
  MAP_COLORS, 
  worldToScreen, 
  screenToWorld, 
  drawGrid, 
  drawHeadingLine,
  drawShipIcon,
  drawCourseProjection,
  type CameraState 
} from '@/core/rendering';
import type { Vector2, Station, Planet, JumpGate } from '@/models';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const { subscribe } = useGameLoop();

// Canvas state - higher default zoom for helm, ship-centric
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const zoom = ref(1); // Higher default zoom than SystemMap
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

  // Draw grid
  drawGrid(ctx, camera.value);

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

  // Draw course projection (helm-specific)
  const shipScreenPos = worldToScreen(shipStore.position, camera.value);
  drawCourseProjection(ctx, shipScreenPos, shipStore.heading, shipStore.speed, camera.value);

  // Draw ship with extended heading line
  drawShip(ctx);
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

  // Extended heading indicator line (longer than SystemMap)
  drawHeadingLine(ctx, screenPos, shipStore.heading, 80);

  // Ship icon
  drawShipIcon(ctx, screenPos, shipStore.heading);
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

    // No object clicked - clear selection
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
  <div ref="containerRef" class="helm-map">
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
}
</style>
