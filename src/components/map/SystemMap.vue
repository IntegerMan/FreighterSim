<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useShipStore, useNavigationStore, useSensorStore } from '@/stores';
import { useGameLoop } from '@/core/game-loop';
import {
  drawCourseProjection,
  drawShipIcon,
  drawWaypoint,
  drawWaypointPath,
  type CameraState,
  renderShapeWithLOD,
  renderEngineMounts,
  getShapeScreenSize,
  renderStationWithLOD,
} from '@/core/rendering';
import { Starfield, createDefaultStarfieldConfig } from '@/core/starfield';
import { getShipTemplate, getStationTemplateById, getStationModule } from '@/data/shapes';
import type { Vector2, Station, Planet, JumpGate } from '@/models';
import { getDockingRange } from '@/models';

// Colors matching our design system
const COLORS = {
  background: '#000000',
  grid: '#1a1a1a',
  gridMajor: '#333333',
  star: '#FFB347',
  ship: '#FFFFFF',
  shipHeading: '#FFCC00',
  station: '#FFCC00',
  planet: '#66CCFF',
  jumpGate: '#BB99FF',
  orbit: '#333333',
  selected: '#9966FF',
  dockingRange: 'rgba(153, 102, 255, 0.2)',
  dockingPort: '#00FF99',           // Green for available docking ports
  dockingPortApproach: '#00FF99',   // Arrow showing approach direction
};

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
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

// Canvas state
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const zoom = ref(0.5);
const panOffset = ref<Vector2>({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref<Vector2>({ x: 0, y: 0 });

// Computed camera center (follows ship by default)
const cameraCenter = computed(() => ({
  x: shipStore.position.x + panOffset.value.x,
  y: shipStore.position.y + panOffset.value.y,
}));

// Camera state for starfield rendering
const camera = computed<CameraState>(() => ({
  zoom: zoom.value,
  panOffset: panOffset.value,
  centerX: cameraCenter.value.x,
  centerY: cameraCenter.value.y,
  canvasWidth: canvasWidth.value,
  canvasHeight: canvasHeight.value,
}));

// Convert world coordinates to screen coordinates
function worldToScreen(worldPos: Vector2): Vector2 {
  const screenCenterX = canvasWidth.value / 2;
  const screenCenterY = canvasHeight.value / 2;
  
  return {
    x: screenCenterX + (worldPos.x - cameraCenter.value.x) * zoom.value,
    y: screenCenterY - (worldPos.y - cameraCenter.value.y) * zoom.value, // Flip Y for screen coords
  };
}

// Convert screen coordinates to world coordinates
function screenToWorld(screenPos: Vector2): Vector2 {
  const screenCenterX = canvasWidth.value / 2;
  const screenCenterY = canvasHeight.value / 2;
  
  return {
    x: cameraCenter.value.x + (screenPos.x - screenCenterX) / zoom.value,
    y: cameraCenter.value.y - (screenPos.y - screenCenterY) / zoom.value,
  };
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

  // Draw starfield background (before grid, behind everything)
  if (starfield.value) {
    starfield.value.render(ctx, camera.value);
  }

  // Draw grid
  drawGrid(ctx);

  // Draw star
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

  // Draw waypoint paths
  const waypoints = navStore.waypoints;
  if (waypoints.length > 0) {
    // Line from ship to first waypoint
    const shipScreenPos = worldToScreen(shipStore.position);
    const firstWaypointScreenPos = worldToScreen(waypoints[0]!.position);
    drawWaypointPath(ctx, shipScreenPos, firstWaypointScreenPos);

    // Lines between waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      const fromScreenPos = worldToScreen(waypoints[i]!.position);
      const toScreenPos = worldToScreen(waypoints[i + 1]!.position);
      drawWaypointPath(ctx, fromScreenPos, toScreenPos);
    }
  }

  // Draw waypoints
  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i]!;
    const screenPos = worldToScreen(waypoint.position);
    drawWaypoint(ctx, screenPos, waypoint.name, i === 0);
  }

  // Draw ship with velocity line
  drawShip(ctx);

  // Check if waypoint reached
  navStore.checkWaypointReached(shipStore.position);
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  const gridSize = 100; // World units
  const screenGridSize = gridSize * zoom.value;
  
  if (screenGridSize < 20) return; // Don't draw if too zoomed out

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;

  // Calculate visible world bounds
  const topLeft = screenToWorld({ x: 0, y: 0 });
  const bottomRight = screenToWorld({ x: canvasWidth.value, y: canvasHeight.value });

  const startX = Math.floor(topLeft.x / gridSize) * gridSize;
  const startY = Math.floor(bottomRight.y / gridSize) * gridSize;
  const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
  const endY = Math.ceil(topLeft.y / gridSize) * gridSize;

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    const screenX = worldToScreen({ x, y: 0 }).x;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvasHeight.value);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    const screenY = worldToScreen({ x: 0, y }).y;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvasWidth.value, screenY);
    ctx.stroke();
  }
}

function drawStar(ctx: CanvasRenderingContext2D) {
  const star = navStore.currentSystem!.star;
  const screenPos = worldToScreen({ x: 0, y: 0 });
  const screenRadius = star.radius * zoom.value;

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
  const screenPos = worldToScreen({ x: 0, y: 0 });
  const screenRadius = planet.orbitRadius * zoom.value;

  ctx.strokeStyle = COLORS.orbit;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlanet(ctx: CanvasRenderingContext2D, planet: Planet) {
  const screenPos = worldToScreen(planet.position);
  const screenRadius = Math.max(planet.radius * zoom.value, 6);
  const isSelected = navStore.selectedObjectId === planet.id;

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = COLORS.selected;
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
  ctx.fillStyle = COLORS.planet;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(planet.name, screenPos.x, screenPos.y + screenRadius + 14);
}

function drawStation(ctx: CanvasRenderingContext2D, station: Station) {
  const screenPos = worldToScreen(station.position);
  const isSelected = navStore.selectedObjectId === station.id;
  const camera = { x: cameraCenter.value.x, y: cameraCenter.value.y };
  const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };

  // Docking range circle
  const screenDockingRange = station.dockingRange * zoom.value;
  ctx.fillStyle = COLORS.dockingRange;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenDockingRange, 0, Math.PI * 2);
  ctx.fill();

  // Get station template for shape rendering
  const templateId = station.templateId ?? station.type;
  const template = getStationTemplateById(templateId);
  
  // Calculate station render size (use docking range as a guide, or default scale)
  const stationScale = station.dockingRange * 0.3; // Station visual size is ~30% of docking range
  const stationRotation = station.rotation ?? 0;

  if (template) {
    // Selection highlight
    if (isSelected) {
      const selectionRadius = template.boundingRadius * stationScale * zoom.value + 6;
      ctx.strokeStyle = COLORS.selected;
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
      camera,
      screenCenter,
      zoom.value,
      COLORS.station,   // fillColor
      '#CC9900',        // strokeColor (darker gold outline)
      8                 // minSize for LOD fallback
    );
  } else {
    // Fallback to simple diamond if template not found
    const size = 10;
    
    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = COLORS.selected;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, size + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Station icon (diamond shape)
    ctx.fillStyle = COLORS.station;
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y - size);
    ctx.lineTo(screenPos.x + size, screenPos.y);
    ctx.lineTo(screenPos.x, screenPos.y + size);
    ctx.lineTo(screenPos.x - size, screenPos.y);
    ctx.closePath();
    ctx.fill();
  }

  // Label
  ctx.fillStyle = COLORS.station;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(station.name, screenPos.x, screenPos.y + (template ? template.boundingRadius * stationScale * zoom.value : 10) + 14);

  // Draw docking port indicators (T047)
  if (template && isSelected) {
    drawDockingPorts(ctx, station, stationScale, stationRotation);
  }
}

/**
 * T047: Draw visual docking port indicators on station
 * Shows port locations and approach vectors when station is selected
 */
function drawDockingPorts(
  ctx: CanvasRenderingContext2D,
  station: Station,
  stationScale: number,
  stationRotation: number
) {
  const templateId = station.templateId ?? station.type;
  const template = getStationTemplateById(templateId);
  if (!template) return;

  const stationRotationRad = (stationRotation * Math.PI) / 180;

  // Find docking modules in the template
  for (const modulePlacement of template.modules) {
    const module = getStationModule(modulePlacement.moduleType);
    if (!module?.dockingPorts) continue;

    const moduleRotationRad = (modulePlacement.rotation * Math.PI) / 180;
    const totalRotation = stationRotationRad + moduleRotationRad;

    for (const port of module.dockingPorts) {
      // Transform port position from module local → station local → world
      const moduleLocalX = port.position.x * Math.cos(moduleRotationRad) - port.position.y * Math.sin(moduleRotationRad);
      const moduleLocalY = port.position.x * Math.sin(moduleRotationRad) + port.position.y * Math.cos(moduleRotationRad);
      
      // Add module offset (module scale = 40 world units per normalized unit)
      const stationLocalX = moduleLocalX * 40 + modulePlacement.position.x;
      const stationLocalY = moduleLocalY * 40 + modulePlacement.position.y;
      
      // Rotate by station rotation and add station position
      const worldX = stationLocalX * Math.cos(stationRotationRad) - stationLocalY * Math.sin(stationRotationRad) + station.position.x;
      const worldY = stationLocalX * Math.sin(stationRotationRad) + stationLocalY * Math.cos(stationRotationRad) + station.position.y;

      // Transform approach vector
      const approachX = port.approachVector.x * Math.cos(totalRotation) - port.approachVector.y * Math.sin(totalRotation);
      const approachY = port.approachVector.x * Math.sin(totalRotation) + port.approachVector.y * Math.cos(totalRotation);

      // Convert to screen coordinates
      const screenPos = worldToScreen({ x: worldX, y: worldY });
      
      // Draw port marker (small circle)
      const portSize = Math.max(4, 6 * zoom.value);
      ctx.fillStyle = COLORS.dockingPort;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, portSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw approach direction arrow
      const dockingRange = getDockingRange(port);
      const arrowLength = Math.min(30, dockingRange * zoom.value * 0.5);
      const arrowEndX = screenPos.x + approachX * arrowLength;
      const arrowEndY = screenPos.y - approachY * arrowLength; // Flip Y for screen coords

      ctx.strokeStyle = COLORS.dockingPortApproach;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y);
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.stroke();

      // Draw arrowhead
      const arrowHeadSize = 6;
      const angle = Math.atan2(-approachY, approachX); // Note: -Y for screen coords
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(
        arrowEndX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
        arrowEndY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowEndX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
        arrowEndY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = COLORS.dockingPortApproach;
      ctx.fill();
    }
  }
}

function drawJumpGate(ctx: CanvasRenderingContext2D, gate: JumpGate) {
  const screenPos = worldToScreen(gate.position);
  const size = 12;
  const isSelected = navStore.selectedObjectId === gate.id;

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = COLORS.selected;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, size + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hexagon shape
  ctx.fillStyle = COLORS.jumpGate;
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
  ctx.fillStyle = COLORS.jumpGate;
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(gate.name, screenPos.x, screenPos.y + size + 14);
}

function drawShip(ctx: CanvasRenderingContext2D) {
  const screenPos = worldToScreen(shipStore.position);
  const isReversing = shipStore.speed < 0 || shipStore.targetSpeed < 0;

  // Draw velocity projection line (same as helm screen)
  drawCourseProjection(ctx, screenPos, shipStore.heading, shipStore.speed, {
    zoom: zoom.value,
    panOffset: panOffset.value,
    centerX: cameraCenter.value.x,
    centerY: cameraCenter.value.y,
    canvasWidth: canvasWidth.value,
    canvasHeight: canvasHeight.value,
  }, 20, isReversing);

  // Get ship template for shape rendering
  const template = getShipTemplate(shipStore.templateId);
  
  if (template) {
    const camera = { x: cameraCenter.value.x, y: cameraCenter.value.y };
    const screenCenter = { x: canvasWidth.value / 2, y: canvasHeight.value / 2 };
    
    // Render ship shape with LOD (falls back to point when zoomed out)
    renderShapeWithLOD(
      ctx,
      template.shape,
      shipStore.position,
      shipStore.heading,
      shipStore.size,
      camera,
      screenCenter,
      zoom.value,
      COLORS.ship,      // fillColor
      COLORS.shipHeading, // strokeColor
      1,                // lineWidth
      6                 // minSize for LOD fallback
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
        camera,
        screenCenter,
        zoom.value,
        '#FF6600'
      );
    }
  } else {
    // Fallback to simple icon if template not found
    drawShipIcon(ctx, screenPos, shipStore.heading, 8, COLORS.ship);
  }
}

// Event handlers
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.max(0.1, Math.min(2, zoom.value + zoomDelta));
}

function handleMouseDown(event: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect();
  const clickPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const worldPos = screenToWorld(clickPos);
  const clickRadius = 20 / zoom.value;

  if (event.button === 0) { // Left click
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

    // No object clicked - handle waypoint creation
    // Shift+click: add to queue, otherwise clear all and create new
    if (!event.shiftKey) {
      navStore.clearWaypoints();
    }
    navStore.addWaypoint(worldPos);
    navStore.clearSelection();
    sensorStore.clearSelection();
  } else if (event.button === 2) { // Right click
    // Check if clicking on a waypoint to delete it
    for (const waypoint of navStore.waypoints) {
      const dx = waypoint.position.x - worldPos.x;
      const dy = waypoint.position.y - worldPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        navStore.removeWaypoint(waypoint.id);
        return;
      }
    }

    // Not on a waypoint - start panning
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
      y: panOffset.value.y + dy, // Flip Y
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

// Center on ship
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
    class="system-map"
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
    <div class="system-map__overlay">
      <div class="system-map__info">
        <span class="system-map__system-name">{{ navStore.systemName }}</span>
        <span class="system-map__zoom">{{ (zoom * 100).toFixed(0) }}%</span>
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
}
</style>
