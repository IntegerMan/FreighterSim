<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import type { RadarSegment, Contact } from '@/models';
import { useGameLoop } from '@/core/game-loop';
import {
  RADAR_COLORS,
  drawRangeRings,
  drawSegmentDividers,
  drawThreatSegments,
  drawHeadingIndicator,
  drawRadarShipIcon,
  getSegmentAtPosition,
} from '@/core/rendering';

interface Props {
  segments: RadarSegment[];
  contacts?: Contact[]; // Optional contacts with visibility data for occlusion rendering
  range: number;
  displayRange: number; // The scaled range for proximity display
  shipHeading: number;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  contacts: () => [],
});

const emit = defineEmits<{
  selectContact: [contactId: string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipText = ref('');

// Ring distances (as fraction of maxRadius)
const RING_FRACTIONS = [0.5, 1];

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
  ctx.fillStyle = RADAR_COLORS.background;
  ctx.fillRect(0, 0, size, size);

  // Draw range rings
  drawRangeRings(ctx, cx, cy, r, RING_FRACTIONS);

  // Draw segment divider lines (every 45 degrees for compact view)
  drawSegmentDividers(ctx, cx, cy, r, 45, RADAR_COLORS.segmentLineLight);

  // Draw threat segments with occlusion support
  drawThreatSegments({ ctx, cx, cy, segments: props.segments, displayRange: props.displayRange, maxRadius: r, contacts: props.contacts });

  // Draw ship heading indicator
  drawHeadingIndicator(ctx, cx, cy, props.shipHeading, r * 0.4);

  // Draw ship icon at center
  drawRadarShipIcon(ctx, cx, cy, props.shipHeading, 4, 7);
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
    tooltipX.value = event.clientX + 10;
    tooltipY.value = event.clientY + 10;
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

watch([() => props.segments, () => props.contacts, () => props.shipHeading], () => {
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
      @mousemove="handleCanvasHover"
      @mouseleave="handleCanvasLeave"
    />
    <div
      v-if="tooltipVisible"
      class="compact-radar__tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <pre>{{ tooltipText }}</pre>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.compact-radar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &__canvas {
    cursor: crosshair;
  }

  &__tooltip {
    position: fixed;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.9);
    border: 1px solid $color-purple;
    border-radius: $radius-sm;
    padding: $space-xs $space-sm;
    pointer-events: none;
    
    pre {
      margin: 0;
      font-family: $font-mono;
      font-size: 10px;
      color: $color-white;
      white-space: pre-wrap;
    }
  }
}
</style>
