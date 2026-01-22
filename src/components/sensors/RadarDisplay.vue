<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import type { RadarSegment } from '@/models';
import { getThreatLevelColor } from '@/models';
import { useGameLoop } from '@/core/game-loop';

interface Props {
  segments: RadarSegment[];
  range: number;
  displayRange: number; // The scaled range for proximity display
  shipHeading: number;
  showLabels?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: false,
});

const emit = defineEmits<{
  selectContact: [contactId: string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Canvas dimensions
const canvasSize = ref(400);
const center = ref(200);
const maxRadius = ref(180);

// Ring distances (as fraction of maxRadius)
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1.0];

// Colors
const COLORS = {
  background: '#000000',
  ring: 'rgba(153, 102, 255, 0.3)',
  ringLabel: 'rgba(153, 102, 255, 0.6)',
  segmentLine: 'rgba(153, 102, 255, 0.2)',
  ship: '#44FF44',
  heading: '#D4AF37',
  text: '#9966FF',
};

function drawRadar() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const size = canvasSize.value;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  const cx = center.value;
  const cy = center.value;
  const r = maxRadius.value;

  // Clear background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, size, size);

  // Draw range rings
  ctx.strokeStyle = COLORS.ring;
  ctx.lineWidth = 1;
  for (const fraction of RING_FRACTIONS) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * fraction, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw range labels
  ctx.fillStyle = COLORS.ringLabel;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const fraction of RING_FRACTIONS) {
    const rangeValue = Math.round(props.displayRange * fraction);
    const labelY = cy - r * fraction - 2;
    ctx.fillText(`${rangeValue}`, cx + 4, labelY);
  }

  // Draw segment divider lines (every 30 degrees for cleaner look)
  ctx.strokeStyle = COLORS.segmentLine;
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
    ctx.stroke();
  }

  // Draw threat segments
  for (const segment of props.segments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    const startRad = (segment.startAngle * Math.PI) / 180;
    const endRad = (segment.endAngle * Math.PI) / 180;

    // Calculate segment radius based on distance relative to display range
    const distanceRatio = Math.min(segment.nearestContact.distance / props.displayRange, 1);
    const segmentRadius = r * distanceRatio;

    // Draw filled arc from center to contact distance
    ctx.fillStyle = getThreatLevelColor(segment.threatLevel);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segmentRadius, startRad, endRad);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Draw cardinal directions
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cardinals = [
    { angle: 0, label: 'E' },
    { angle: 90, label: 'S' },
    { angle: 180, label: 'W' },
    { angle: 270, label: 'N' },
  ];

  for (const { angle, label } of cardinals) {
    const rad = (angle * Math.PI) / 180;
    const x = cx + Math.cos(rad) * (r + 12);
    const y = cy + Math.sin(rad) * (r + 12);
    ctx.fillText(label, x, y);
  }

  // Draw ship heading indicator
  const headingRad = (props.shipHeading * Math.PI) / 180;
  ctx.strokeStyle = COLORS.heading;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(headingRad) * (r * 0.3), cy + Math.sin(headingRad) * (r * 0.3));
  ctx.stroke();

  // Draw ship icon at center
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Draw ship triangle pointing in heading direction
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(headingRad);
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw contact labels if enabled
  if (props.showLabels) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    for (const segment of props.segments) {
      if (!segment.nearestContact) continue;

      const bearing = segment.nearestContact.bearing;
      const distance = segment.nearestContact.distance;
      const rad = (bearing * Math.PI) / 180;
      const distanceRatio = Math.min(distance / props.displayRange, 1);
      const labelRadius = r * distanceRatio + 15;

      const x = cx + Math.cos(rad) * labelRadius;
      const y = cy + Math.sin(rad) * labelRadius;

      ctx.fillText(segment.nearestContact.name, x, y);
    }
  }
}

function handleCanvasClick(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const cx = center.value;
  const cy = center.value;

  // Calculate angle from center
  const dx = x - cx;
  const dy = y - cy;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Find segment at this angle
  const segmentIndex = Math.floor(angle / 10) % 36;
  const segment = props.segments[segmentIndex];

  if (segment?.nearestContact) {
    emit('selectContact', segment.nearestContact.id);
  }
}

function updateCanvasSize() {
  if (!containerRef.value) return;

  const container = containerRef.value;
  const size = Math.min(container.clientWidth, container.clientHeight);
  canvasSize.value = size;
  center.value = size / 2;
  maxRadius.value = (size / 2) - 20;

  drawRadar();
}

// Subscribe to game loop for continuous updates
const { subscribe } = useGameLoop();
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);

  unsubscribe = subscribe(() => {
    drawRadar();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize);
  if (unsubscribe) {
    unsubscribe();
  }
});

watch([() => props.segments, () => props.shipHeading], () => {
  drawRadar();
});
</script>

<template>
  <div
    ref="containerRef"
    class="radar-display"
  >
    <canvas
      ref="canvasRef"
      class="radar-display__canvas"
      :width="canvasSize"
      :height="canvasSize"
      @click="handleCanvasClick"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.radar-display {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $color-black;

  &__canvas {
    max-width: 100%;
    max-height: 100%;
    cursor: crosshair;
  }
}
</style>
