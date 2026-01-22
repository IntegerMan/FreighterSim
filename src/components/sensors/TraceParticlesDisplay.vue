<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { ParticleCell, Vector2 } from '@/models';
import { gridToWorldCoord, worldToGridCoord, createCellKey } from '@/models';
import { useGameLoop } from '@/core/game-loop';
import { worldToScreen, drawShipIcon, drawGrid, type CameraState } from '@/core/rendering/mapUtils';

interface Props {
  cells: ParticleCell[];
  cellSize: number;
  shipPosition: Vector2;
  shipHeading: number;
  viewRadius?: number;
  maxDensity?: number;
  noiseIntensity?: number;
  noiseScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  viewRadius: 1000,
  maxDensity: 10,
  noiseIntensity: 0.15,
  noiseScale: 0.3,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const canvasWidth = ref(600);
const canvasHeight = ref(600);

// Zoom level (world units per pixel)
const zoom = ref(0.5);

// Colors
const COLORS = {
  background: '#000000',
  grid: '#1a1a1a',
  ship: '#44FF44',
  particleLow: { r: 102, g: 51, b: 153 },   // Dim purple
  particleHigh: { r: 153, g: 102, b: 255 }, // Bright purple/cyan
};

// Build a lookup map from cells array for O(1) access
const cellMap = computed(() => {
  const map = new Map<string, ParticleCell>();
  for (const cell of props.cells) {
    map.set(createCellKey(cell.x, cell.y), cell);
  }
  return map;
});

// Camera state centered on ship
const camera = computed((): CameraState => ({
  zoom: zoom.value,
  panOffset: { x: 0, y: 0 },
  centerX: props.shipPosition.x,
  centerY: props.shipPosition.y,
  canvasWidth: canvasWidth.value,
  canvasHeight: canvasHeight.value,
}));

/**
 * Calculate visual density for a cell (real density + random noise)
 * Noise is recalculated each frame for dynamic flickering effect
 */
function getVisualDensity(realDensity: number): number {
  // Add subtle random noise (recalculated each frame)
  const noise = Math.random() < props.noiseScale
    ? Math.random() * props.noiseIntensity
    : 0;

  return realDensity + noise;
}

/**
 * Convert particle density to RGBA color
 */
function densityToColor(density: number): string {
  const normalized = Math.min(density / props.maxDensity, 1);
  const alpha = 0.15 + normalized * 0.7;

  // Interpolate between low and high colors
  const r = Math.floor(COLORS.particleLow.r + (COLORS.particleHigh.r - COLORS.particleLow.r) * normalized);
  const g = Math.floor(COLORS.particleLow.g + (COLORS.particleHigh.g - COLORS.particleLow.g) * normalized);
  const b = Math.floor(COLORS.particleLow.b + (COLORS.particleHigh.b - COLORS.particleLow.b) * normalized);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvasWidth.value;
  const height = canvasHeight.value;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const cam = camera.value;
  const cx = width / 2;
  const cy = height / 2;
  const viewRadiusScreen = props.viewRadius * cam.zoom;

  // Clear entire canvas first (outside clipped region)
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Save state and create circular clipping path for sensor region
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, viewRadiusScreen, 0, Math.PI * 2);
  ctx.clip();

  // Draw grid (clipped to circle)
  drawGrid(ctx, cam, props.cellSize);

  // Calculate visible grid bounds
  const gridRadius = Math.ceil(props.viewRadius / props.cellSize);
  const shipGridPos = worldToGridCoord(props.shipPosition, props.cellSize);
  const screenCellSize = props.cellSize * cam.zoom;

  // Render all visible cells (including empty ones with just noise) - clipped to circle
  for (let gx = shipGridPos.x - gridRadius; gx <= shipGridPos.x + gridRadius; gx++) {
    for (let gy = shipGridPos.y - gridRadius; gy <= shipGridPos.y + gridRadius; gy++) {
      const key = createCellKey(gx, gy);
      const storedCell = cellMap.value.get(key);
      const realDensity = storedCell?.density ?? 0;

      // Calculate visual density with noise
      const visualDensity = getVisualDensity(realDensity);

      // Only render if there's something to show
      if (visualDensity > 0.02) {
        const worldPos = gridToWorldCoord(gx, gy, props.cellSize);
        const screenPos = worldToScreen(worldPos, cam);

        // Draw cell rectangle centered on the world position
        const halfSize = screenCellSize / 2;
        ctx.fillStyle = densityToColor(visualDensity);
        ctx.fillRect(
          screenPos.x - halfSize,
          screenPos.y - halfSize,
          screenCellSize,
          screenCellSize
        );
      }
    }
  }

  // Draw vignette fade at the edge of the sensor region (still clipped)
  const vignetteGradient = ctx.createRadialGradient(cx, cy, viewRadiusScreen * 0.7, cx, cy, viewRadiusScreen);
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
  vignetteGradient.addColorStop(1, 'rgba(30, 10, 40, 0.8)');
  ctx.fillStyle = vignetteGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, viewRadiusScreen, 0, Math.PI * 2);
  ctx.fill();

  // Restore to remove clip (UI elements render outside clipped region)
  ctx.restore();

  // Draw view radius circle boundary (outside clip, fully visible)
  ctx.strokeStyle = 'rgba(153, 102, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, viewRadiusScreen, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw ship at center
  const shipScreenPos = worldToScreen(props.shipPosition, cam);
  drawShipIcon(ctx, shipScreenPos, props.shipHeading, 10, COLORS.ship);

  // Draw info overlay
  ctx.fillStyle = 'rgba(153, 102, 255, 0.8)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Active cells: ${props.cells.length}`, 10, 20);
  ctx.fillText(`View radius: ${props.viewRadius}`, 10, 35);
}

function updateCanvasSize() {
  if (!containerRef.value) return;

  const container = containerRef.value;
  canvasWidth.value = container.clientWidth;
  canvasHeight.value = container.clientHeight;

  // Adjust zoom so the sensor circle fills the container edge-to-edge (with small margin)
  const minDimension = Math.min(canvasWidth.value, canvasHeight.value);
  const margin = 2;
  zoom.value = ((minDimension / 2) - margin) / props.viewRadius;

  render();
}

function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.05 : 0.05;
  zoom.value = Math.max(0.1, Math.min(2, zoom.value + delta));
  render();
}

// Subscribe to game loop for continuous updates
const { subscribe } = useGameLoop();
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);

  unsubscribe = subscribe(() => {
    render();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize);
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div ref="containerRef" class="trace-particles-display">
    <canvas
      ref="canvasRef"
      class="trace-particles-display__canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @wheel="handleWheel"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.trace-particles-display {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $color-black;
  overflow: hidden;

  &__canvas {
    width: 100%;
    height: 100%;
  }
}
</style>
