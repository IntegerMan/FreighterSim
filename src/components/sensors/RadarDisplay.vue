<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { Graphics, Text, Container } from 'pixi.js';
import type { RadarSegment, Contact } from '@/models';
import { getThreatLevelColor } from '@/models';
import { useGameLoop } from '@/core/game-loop';
import { useRendererStore } from '@/stores/rendererStore';
import {
  PixiRenderer,
  detectCapabilities,
  meetsMinimumRequirements,
  angleToScreenCoords,
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

const containerRef = ref<HTMLDivElement | null>(null);
const rendererStore = useRendererStore();

// Tooltip state
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipText = ref('');

// Canvas dimensions
const canvasSize = ref(400);
const center = ref(200);
const maxRadius = ref(180);
const rendererReady = ref(false);

// Ring distances (as fraction of maxRadius)
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];

// PixiJS renderer and graphics
const pixiRenderer = new PixiRenderer();
let gameLayer: Container | undefined;

// Graphics objects for radar elements
const graphics = {
  background: new Graphics(),
  rings: new Graphics(),
  dividers: new Graphics(),
  segments: new Graphics(),
  occlusionRays: new Graphics(),
  cardinals: new Container(),
  heading: new Graphics(),
  ship: new Graphics(),
  labels: new Container(),
  rangeLabels: new Container(),
};

// Color constants (hex for PixiJS)
const COLOR = {
  background: 0x000000,
  ring: 0x9966ff,
  segmentLine: 0x9966ff,
  ship: 0x44ff44,
  heading: 0xd4af37,
  text: 0x9966ff,
  occluded: 0xff0000,
  partialOcclusion: 0xff8800,
  occlusionRay: 0xff6464,
};

/**
 * Convert North-Up angle to canvas arc angle (radians)
 */
function northUpToCanvasArcRad(angleDegrees: number): number {
  return ((angleDegrees - 90) * Math.PI) / 180;
}

function attachGraphics() {
  gameLayer?.addChild(graphics.background);
  gameLayer?.addChild(graphics.rings);
  gameLayer?.addChild(graphics.dividers);
  gameLayer?.addChild(graphics.segments);
  gameLayer?.addChild(graphics.occlusionRays);
  gameLayer?.addChild(graphics.cardinals);
  gameLayer?.addChild(graphics.heading);
  gameLayer?.addChild(graphics.ship);
  gameLayer?.addChild(graphics.labels);
  gameLayer?.addChild(graphics.rangeLabels);
}

function resetGraphics() {
  graphics.background.clear();
  graphics.rings.clear();
  graphics.dividers.clear();
  graphics.segments.clear();
  graphics.occlusionRays.clear();
  graphics.heading.clear();
  graphics.ship.clear();
  graphics.cardinals.removeChildren();
  graphics.labels.removeChildren();
  graphics.rangeLabels.removeChildren();
}

function drawRadar() {
  if (!rendererReady.value) return;
  resetGraphics();

  const cx = center.value;
  const cy = center.value;
  const r = maxRadius.value;
  const size = canvasSize.value;

  // Draw background
  graphics.background.beginFill(COLOR.background);
  graphics.background.drawRect(0, 0, size, size);
  graphics.background.endFill();

  // Draw range rings
  drawRangeRings(cx, cy, r);

  // Draw range labels
  drawRangeLabels(cx, cy, r);

  // Draw segment divider lines
  drawSegmentDividers(cx, cy, r, 30);

  // Draw threat segments
  drawThreatSegments(cx, cy, r);

  // Draw debug ray visualization if enabled
  if (props.showOcclusionRays && props.contacts.length > 0) {
    drawOcclusionRays(cx, cy, r);
  }

  // Draw cardinal labels
  drawCardinalLabels(cx, cy, r);

  // Draw ship heading indicator
  drawHeadingIndicator(cx, cy, r * 0.3);

  // Draw ship icon at center
  drawShipIcon(cx, cy);

  // Draw contact labels if enabled
  if (props.showLabels) {
    drawContactLabels(cx, cy, r);
  }
}

function drawRangeRings(cx: number, cy: number, maxRadius: number) {
  graphics.rings.lineStyle(1, COLOR.ring, 0.3);
  for (const fraction of RING_FRACTIONS) {
    graphics.rings.drawCircle(cx, cy, maxRadius * fraction);
  }
}

function drawRangeLabels(cx: number, cy: number, r: number) {
  for (const fraction of RING_FRACTIONS) {
    const rangeValue = Math.round(props.displayRange * fraction);
    const labelY = cy - r * fraction - 2;
    const label = new Text({
      text: `${rangeValue}`,
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: COLOR.ring,
        align: 'left',
      },
    });
    label.x = cx + 4;
    label.y = labelY - 5;
    label.alpha = 0.6;
    graphics.rangeLabels.addChild(label);
  }
}

function drawSegmentDividers(cx: number, cy: number, maxRadius: number, intervalDegrees: number) {
  graphics.dividers.lineStyle(1, COLOR.segmentLine, 0.2);
  for (let deg = 0; deg < 360; deg += intervalDegrees) {
    const { x, y } = angleToScreenCoords(deg, maxRadius, cx, cy);
    graphics.dividers.moveTo(cx, cy);
    graphics.dividers.lineTo(x, y);
  }
}

function drawThreatSegments(cx: number, cy: number, r: number) {
  for (const segment of props.segments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    const startRad = northUpToCanvasArcRad(segment.startAngle);
    const endRad = northUpToCanvasArcRad(segment.endAngle);
    const distanceRatio = Math.min(segment.nearestContact.distance / props.displayRange, 1);
    const segmentRadius = r * distanceRatio;

    // Check if this contact is occluded
    const contact = props.contacts.find(c => c.id === segment.nearestContact!.id);
    const visibility = contact?.visibility ?? 1;
    const isPartiallyOccluded = visibility > 0 && visibility < 1;
    const isFullyOccluded = visibility === 0;

    // Determine color and alpha based on occlusion
    let fillColor: number;
    let fillAlpha: number;

    if (isFullyOccluded) {
      fillColor = COLOR.occluded;
      fillAlpha = 0.7;
    } else if (isPartiallyOccluded) {
      fillColor = COLOR.partialOcclusion;
      fillAlpha = 0.4 + (visibility * 0.4);
    } else {
      const colorStr = getThreatLevelColor(segment.threatLevel);
      fillColor = Number.parseInt(colorStr.replace('#', ''), 16);
      fillAlpha = 0.6;
    }

    // Draw filled arc from center to contact distance
    graphics.segments.beginFill(fillColor, fillAlpha);
    graphics.segments.moveTo(cx, cy);
    graphics.segments.arc(cx, cy, segmentRadius, startRad, endRad);
    graphics.segments.lineTo(cx, cy);
    graphics.segments.endFill();

    // Draw occlusion indicator (dashed outline for occluded contacts)
    if (isPartiallyOccluded || isFullyOccluded) {
      const strokeColor = isFullyOccluded ? COLOR.occluded : COLOR.partialOcclusion;
      // PixiJS doesn't have native dashed lines, so we draw segments
      drawDashedArc(graphics.segments, {
        cx, cy, radius: segmentRadius, startAngle: startRad, endAngle: endRad,
        color: strokeColor, lineWidth: 2, dashLength: 4, gapLength: 4,
      });
    }
  }
}

interface DashedArcOptions {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: number;
  lineWidth: number;
  dashLength: number;
  gapLength: number;
}

function drawDashedArc(g: Graphics, opts: DashedArcOptions) {
  const { cx, cy, radius, startAngle, endAngle, color, lineWidth, dashLength, gapLength } = opts;
  const arcLength = Math.abs(endAngle - startAngle) * radius;
  const totalLength = dashLength + gapLength;
  const numSegments = Math.floor(arcLength / totalLength);
  const anglePerUnit = (endAngle - startAngle) / arcLength;

  for (let i = 0; i < numSegments; i++) {
    const segStart = startAngle + (i * totalLength * anglePerUnit);
    const segEnd = segStart + (dashLength * anglePerUnit);
    g.lineStyle(lineWidth, color, 1);
    g.arc(cx, cy, radius, segStart, segEnd);
  }
}

function drawOcclusionRays(cx: number, cy: number, r: number) {
  graphics.occlusionRays.lineStyle(1, COLOR.occlusionRay, 0.3);

  for (const contact of props.contacts) {
    if (contact.visibility >= 1) continue;

    const distanceRatio = Math.min(contact.distance / props.displayRange, 1);
    const contactRadius = r * distanceRatio;
    const { x, y } = angleToScreenCoords(contact.bearing, contactRadius, cx, cy);

    // Draw ray from center to contact
    graphics.occlusionRays.moveTo(cx, cy);
    graphics.occlusionRays.lineTo(x, y);

    // Mark blocking point
    if (contact.occludedBy) {
      const blocker = props.contacts.find(c => c.id === contact.occludedBy);
      if (blocker) {
        const blockerDistRatio = Math.min(blocker.distance / props.displayRange, 1);
        const blockerRadius = r * blockerDistRatio;
        const { x: bx, y: by } = angleToScreenCoords(blocker.bearing, blockerRadius, cx, cy);

        // Draw X at blocking point
        const crossSize = 5;
        graphics.occlusionRays.lineStyle(2, 0xff0000, 1);
        graphics.occlusionRays.moveTo(bx - crossSize, by - crossSize);
        graphics.occlusionRays.lineTo(bx + crossSize, by + crossSize);
        graphics.occlusionRays.moveTo(bx + crossSize, by - crossSize);
        graphics.occlusionRays.lineTo(bx - crossSize, by + crossSize);

        // Reset for next ray
        graphics.occlusionRays.lineStyle(1, COLOR.occlusionRay, 0.3);
      }
    }
  }
}

function drawCardinalLabels(cx: number, cy: number, r: number) {
  const offset = 12;
  const cardinals = [
    { angle: 0, label: 'N' },
    { angle: 90, label: 'E' },
    { angle: 180, label: 'S' },
    { angle: 270, label: 'W' },
  ];

  for (const { angle, label } of cardinals) {
    const { x, y } = angleToScreenCoords(angle, r + offset, cx, cy);
    const text = new Text({
      text: label,
      style: {
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: COLOR.text,
        align: 'center',
      },
    });
    text.anchor.set(0.5, 0.5);
    text.x = x;
    text.y = y;
    graphics.cardinals.addChild(text);
  }
}

function drawHeadingIndicator(cx: number, cy: number, length: number) {
  const { x, y } = angleToScreenCoords(props.shipHeading, length, cx, cy);

  graphics.heading.lineStyle(2, COLOR.heading, 1);
  graphics.heading.moveTo(cx, cy);
  graphics.heading.lineTo(x, y);
}

function drawShipIcon(cx: number, cy: number) {
  const circleRadius = 6;
  const triangleSize = 10;

  // Draw center dot
  graphics.ship.beginFill(COLOR.ship, 1);
  graphics.ship.drawCircle(cx, cy, circleRadius);
  graphics.ship.endFill();

  // Draw directional triangle
  const headingRad = (props.shipHeading * Math.PI) / 180;
  const tipX = cx + Math.sin(headingRad) * triangleSize;
  const tipY = cy - Math.cos(headingRad) * triangleSize;
  const backLeftX = cx + Math.sin(headingRad + 2.5) * (triangleSize * 0.5);
  const backLeftY = cy - Math.cos(headingRad + 2.5) * (triangleSize * 0.5);
  const backRightX = cx + Math.sin(headingRad - 2.5) * (triangleSize * 0.5);
  const backRightY = cy - Math.cos(headingRad - 2.5) * (triangleSize * 0.5);

  graphics.ship.beginFill(COLOR.ship, 1);
  graphics.ship.moveTo(tipX, tipY);
  graphics.ship.lineTo(backLeftX, backLeftY);
  graphics.ship.lineTo(backRightX, backRightY);
  graphics.ship.closePath();
  graphics.ship.endFill();
}

function drawContactLabels(cx: number, cy: number, r: number) {
  const offset = 15;

  for (const segment of props.segments) {
    if (!segment.nearestContact) continue;

    const distanceRatio = Math.min(segment.nearestContact.distance / props.displayRange, 1);
    const labelRadius = r * distanceRatio + offset;
    const { x, y } = angleToScreenCoords(segment.nearestContact.bearing, labelRadius, cx, cy);

    const label = new Text({
      text: segment.nearestContact.name,
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: 0xffffff,
        align: 'center',
      },
    });
    label.anchor.set(0.5, 0.5);
    label.x = x;
    label.y = y;
    graphics.labels.addChild(label);
  }
}

function handleCanvasHover(event: MouseEvent) {
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
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
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
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

  pixiRenderer.resize(size, size);
  drawRadar();
}

async function initializeRenderer() {
  const capability = detectCapabilities();
  rendererStore.setCapability(capability.selected, capability.fallbackReason);
  if (!meetsMinimumRequirements(capability.selected)) {
    rendererReady.value = false;
    return;
  }

  const size = containerRef.value?.clientWidth ?? canvasSize.value;
  canvasSize.value = size;
  center.value = size / 2;
  maxRadius.value = (size / 2) - 20;

  await pixiRenderer.initialize({
    width: size,
    height: size,
    capability: capability.selected,
    backgroundColor: COLOR.background,
  });

  const canvas = pixiRenderer.getCanvas();
  if (canvas && containerRef.value) {
    canvas.classList.add('radar-display__canvas');
    containerRef.value.prepend(canvas);
  }

  gameLayer = pixiRenderer.getLayer('game');
  attachGraphics();
  rendererReady.value = true;
}

// Subscribe to game loop for continuous updates
const { subscribe } = useGameLoop();
let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  await initializeRenderer();
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
  pixiRenderer.destroy();
});

watch([() => props.segments, () => props.contacts, () => props.shipHeading], () => {
  drawRadar();
});
</script>

<template>
  <div
    ref="containerRef"
    class="radar-display"
    @click="handleCanvasClick"
    @mousemove="handleCanvasHover"
    @mouseleave="handleCanvasLeave"
  >
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
