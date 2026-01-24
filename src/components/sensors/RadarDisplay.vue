<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import type { RadarSegment, Contact } from '@/models';
import { getThreatLevelColor } from '@/models';
import { useGameLoop } from '@/core/game-loop';
import {
  RADAR_COLORS,
  northUpToCanvasArcRad,
  drawRangeRings,
  drawSegmentDividers,
  drawCardinalLabels,
  drawHeadingIndicator,
  drawRadarShipIcon,
  drawOcclusionRays,
  drawContactLabels,
  getSegmentAtPosition,
} from '@/core/rendering';

interface Props {
  segments: RadarSegment[];
  contacts?: Contact[]; // Optional contacts with visibility data for occlusion rendering
  range: number;
  displayRange: number; // The scaled range for proximity display
  shipHeading: number;
  showLabels?: boolean;
  showOcclusionRays?: boolean; // Debug option to visualize sensor rays
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: false,
  showOcclusionRays: false,
  contacts: () => [],
});

const emit = defineEmits<{
  selectContact: [contactId: string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Tooltip state
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipText = ref('');

// Canvas dimensions
const canvasSize = ref(400);
const center = ref(200);
const maxRadius = ref(180);

// Ring distances (as fraction of maxRadius)
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];

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
  ctx.fillStyle = RADAR_COLORS.background;
  ctx.fillRect(0, 0, size, size);

  // Draw range rings
  drawRangeRings(ctx, cx, cy, r, RING_FRACTIONS);

  // Draw range labels
  ctx.fillStyle = RADAR_COLORS.ringLabel;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const fraction of RING_FRACTIONS) {
    const rangeValue = Math.round(props.displayRange * fraction);
    const labelY = cy - r * fraction - 2;
    ctx.fillText(`${rangeValue}`, cx + 4, labelY);
  }

  // Draw segment divider lines (every 30 degrees for cleaner look)
  drawSegmentDividers(ctx, cx, cy, r, 30);

  // Draw threat segments with occlusion support
  for (const segment of props.segments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    const startRad = northUpToCanvasArcRad(segment.startAngle);
    const endRad = northUpToCanvasArcRad(segment.endAngle);
    const distanceRatio = Math.min(segment.nearestContact.distance / props.displayRange, 1);
    const segmentRadius = r * distanceRatio;

    // Check if this contact is occluded (visibility < 1)
    const contact = props.contacts.find(c => c.id === segment.nearestContact!.id);
    const visibility = contact?.visibility ?? 1;
    const isPartiallyOccluded = visibility > 0 && visibility < 1;
    const isFullyOccluded = visibility === 0;

    // Draw filled arc from center to contact distance
    if (isFullyOccluded) {
      ctx.fillStyle = RADAR_COLORS.occluded;
      ctx.globalAlpha = 0.7;
    } else if (isPartiallyOccluded) {
      ctx.fillStyle = RADAR_COLORS.partialOcclusion;
      ctx.globalAlpha = 0.4 + (visibility * 0.4);
    } else {
      ctx.fillStyle = getThreatLevelColor(segment.threatLevel);
      ctx.globalAlpha = 0.6;
    }

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segmentRadius, startRad, endRad);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw occlusion indicator (dashed outline for occluded contacts)
    if (isPartiallyOccluded || isFullyOccluded) {
      ctx.strokeStyle = isFullyOccluded ? RADAR_COLORS.occluded : RADAR_COLORS.partialOcclusion;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, segmentRadius, startRad, endRad);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw debug ray visualization if enabled
  if (props.showOcclusionRays && props.contacts.length > 0) {
    drawOcclusionRays({ ctx, cx, cy, contacts: props.contacts, displayRange: props.displayRange, maxRadius: r });
  }

  // Draw cardinal labels
  drawCardinalLabels(ctx, cx, cy, r);

  // Draw ship heading indicator
  drawHeadingIndicator(ctx, cx, cy, props.shipHeading, r * 0.3);

  // Draw ship icon at center
  drawRadarShipIcon(ctx, cx, cy, props.shipHeading);

  // Draw contact labels if enabled
  if (props.showLabels) {
    drawContactLabels({ ctx, cx, cy, segments: props.segments, displayRange: props.displayRange, maxRadius: r });
  }
}

function handleCanvasHover(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const { segment, contact } = getSegmentAtPosition(x, y, center.value, center.value, props.segments, props.contacts);
  
  // Show tooltip for any segment with a contact
  if (segment?.nearestContact) {
    const visibility = contact?.visibility ?? 1;
    let text = `${segment.nearestContact.name}\nDistance: ${segment.nearestContact.distance.toFixed(0)}u`;
    text += `\nBearing: ${segment.nearestContact.bearing.toFixed(0)}°`;
    
    if (visibility < 1) {
      text += `\nVisibility: ${(visibility * 100).toFixed(0)}%`;
      if (contact?.occludedBy) {
        const blocker = props.contacts.find(c => c.id === contact.occludedBy);
        text += `\nOccluded by: ${blocker?.name || contact.occludedBy}`;
      }
      if (visibility === 0) {
        text += '\n⚠️ FULLY OCCLUDED';
      }
    }
    
    tooltipText.value = text;
    tooltipX.value = event.clientX + 15;
    tooltipY.value = event.clientY + 15;
    tooltipVisible.value = true;
  } else {
    tooltipVisible.value = false;
  }
}

function handleCanvasLeave() {
  tooltipVisible.value = false;
}

function handleCanvasClick(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const { segment } = getSegmentAtPosition(x, y, center.value, center.value, props.segments, props.contacts);

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

watch([() => props.segments, () => props.contacts, () => props.shipHeading], () => {
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
      @mousemove="handleCanvasHover"
      @mouseleave="handleCanvasLeave"
    />
    <div
      v-if="tooltipVisible"
      class="radar-display__tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <pre>{{ tooltipText }}</pre>
    </div>
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
  position: relative;

  &__canvas {
    max-width: 100%;
    max-height: 100%;
    cursor: crosshair;
  }

  &__tooltip {
    position: fixed;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.95);
    border: 1px solid $color-purple;
    border-radius: $radius-sm;
    padding: $space-xs $space-sm;
    pointer-events: none;
    max-width: 250px;
    
    pre {
      margin: 0;
      font-family: $font-mono;
      font-size: 11px;
      color: $color-white;
      white-space: pre-wrap;
      line-height: 1.4;
    }
  }
}
</style>
