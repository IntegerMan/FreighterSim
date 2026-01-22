<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  currentHeading: number;
  targetHeading: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  setHeading: [heading: number];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Canvas drawing
const radius = 80;
const centerX = radius + 20;
const centerY = radius + 20;

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function drawGauge() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Draw outer circle (background)
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw cardinal directions
  const cardinalDirections = [
    { angle: 0, label: 'E' },
    { angle: 90, label: 'S' },
    { angle: 180, label: 'W' },
    { angle: 270, label: 'N' },
  ];

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  cardinalDirections.forEach(({ angle, label }) => {
    const rad = (angle * Math.PI) / 180;
    const x = centerX + Math.cos(rad) * (radius - 15);
    const y = centerY + Math.sin(rad) * (radius - 15);
    ctx.fillText(label, x, y);
  });

  // Draw degree markers
  ctx.strokeStyle = '#888888';
  ctx.fillStyle = '#888888';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 360; i += 10) {
    const rad = (i * Math.PI) / 180;
    const x1 = centerX + Math.cos(rad) * radius;
    const y1 = centerY + Math.sin(rad) * radius;

    if (i % 30 === 0) {
      const x0 = centerX + Math.cos(rad) * (radius - 8);
      const y0 = centerY + Math.sin(rad) * (radius - 8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      if (i % 90 !== 0) {
        const labelX = centerX + Math.cos(rad) * (radius - 25);
        const labelY = centerY + Math.sin(rad) * (radius - 25);
        ctx.fillText(i.toString(), labelX, labelY);
      }
    } else {
      const x0 = centerX + Math.cos(rad) * (radius - 4);
      const y0 = centerY + Math.sin(rad) * (radius - 4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  // Draw target heading arc (light)
  const targetRad = (normalizeAngle(-props.targetHeading) * Math.PI) / 180;
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Draw target heading indicator (thin line)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  const targetX = centerX + Math.cos(targetRad) * (radius - 2);
  const targetY = centerY + Math.sin(targetRad) * (radius - 2);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // Draw current heading needle
  const currentRad = (normalizeAngle(-props.currentHeading) * Math.PI) / 180;
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  const currentX = centerX + Math.cos(currentRad) * (radius - 5);
  const currentY = centerY + Math.sin(currentRad) * (radius - 5);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();

  // Draw center dot
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function handleCanvasClick(event: MouseEvent) {
  if (props.disabled) return;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const dpr = window.devicePixelRatio || 1;
  const canvasX = (x * dpr) / dpr;
  const canvasY = (y * dpr) / dpr;

  const deltaX = canvasX - centerX;
  const deltaY = canvasY - centerY;

  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  angle = normalizeAngle(-angle);

  emit('setHeading', angle);
}

// Lifecycle and watchers
onMounted(() => {
  drawGauge();
});

watch([() => props.currentHeading, () => props.targetHeading], () => {
  drawGauge();
});
</script>

<template>
  <div class="heading-gauge" :class="{ 'heading-gauge--disabled': disabled }">
    <div class="heading-gauge__label">Heading</div>
    <canvas
      ref="canvasRef"
      class="heading-gauge__canvas"
      width="200"
      height="200"
      @click="handleCanvasClick"
    />
    <div class="heading-gauge__info">
      <div class="heading-gauge__current">
        Current: <span class="heading-gauge__value">{{ normalizeAngle(currentHeading).toFixed(0).padStart(3, '0') }}°</span>
      </div>
      <div class="heading-gauge__target">
        Target: <span class="heading-gauge__value">{{ normalizeAngle(targetHeading).toFixed(0).padStart(3, '0') }}°</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.heading-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-md;
  padding: $space-md;
  background-color: rgba($color-black, 0.5);
  border-radius: $radius-sm;
  border: 1px solid $color-gold;

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__canvas {
    width: 200px;
    height: 200px;
    cursor: pointer;
    transition: filter 0.2s ease;

    &:hover:not([disabled]) {
      filter: brightness(1.1);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
    width: 100%;
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
    text-align: center;
  }

  &__current,
  &__target {
    display: flex;
    justify-content: center;
    gap: $space-xs;
  }

  &__value {
    color: $color-white;
    font-weight: bold;
  }
}
</style>
