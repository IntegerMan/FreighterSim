<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import type { RadarSegment } from '@/models';
import { getThreatLevelColor } from '@/models';
import { useGameLoop } from '@/core/game-loop';

interface Props {
  segments: RadarSegment[];
  range: number;
  displayRange: number; // The scaled range for proximity display
  shipHeading: number;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
});

const emit = defineEmits<{
  selectContact: [contactId: string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Ring distances (as fraction of maxRadius)
const RING_FRACTIONS = [0.5, 1];

// Colors
const COLORS = {
  background: '#000000',
  ring: 'rgba(153, 102, 255, 0.3)',
  segmentLine: 'rgba(153, 102, 255, 0.15)',
  ship: '#44FF44',
  heading: '#D4AF37',
};

const center = computed(() => props.size / 2);
const maxRadius = computed(() => (props.size / 2) - 10);

function drawRadar() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const size = props.size;

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

  // Draw segment divider lines (every 45 degrees for compact view)
  ctx.strokeStyle = COLORS.segmentLine;
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 45) {
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
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segmentRadius, startRad, endRad);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw ship heading indicator
  const headingRad = (props.shipHeading * Math.PI) / 180;
  ctx.strokeStyle = COLORS.heading;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(headingRad) * (r * 0.4), cy + Math.sin(headingRad) * (r * 0.4));
  ctx.stroke();

  // Draw ship icon at center
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw ship triangle pointing in heading direction
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(headingRad);
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-3, -3);
  ctx.lineTo(-3, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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

// Subscribe to game loop for continuous updates
const { subscribe } = useGameLoop();
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  drawRadar();
  unsubscribe = subscribe(() => {
    drawRadar();
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

watch([() => props.segments, () => props.shipHeading], () => {
  drawRadar();
});
</script>

<template>
  <div class="compact-radar">
    <canvas
      ref="canvasRef"
      class="compact-radar__canvas"
      :width="size"
      :height="size"
      @click="handleCanvasClick"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.compact-radar {
  display: flex;
  align-items: center;
  justify-content: center;

  &__canvas {
    cursor: crosshair;
  }
}
</style>
