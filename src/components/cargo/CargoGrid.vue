<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCargoStore } from '@/stores';
import { CARGO_TYPE_COLORS } from '@/models';
import type { CargoItem, CargoType } from '@/models';

const props = defineProps<{
  slotSize?: number;
  padding?: number;
  loading?: boolean;
}>();

const slotSize = computed(() => props.slotSize ?? 48);
const padding = computed(() => props.padding ?? 4);

const cargoStore = useCargoStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const hoveredItem = ref<CargoItem | null>(null);

// Computed values from store
const items = computed(() => cargoStore.items);
const width = computed(() => cargoStore.bayDimensions.width);
const depth = computed(() => cargoStore.bayDimensions.depth);
const isEmpty = computed(() => cargoStore.isEmpty);
const totalSlots = computed(() => cargoStore.totalSlots);

// Error state: detect inconsistent/corrupted data (items > totalSlots)
const hasDataError = computed(() => items.value.length > totalSlots.value);

// Canvas dimensions
const canvasWidth = computed(() => width.value * slotSize.value + (width.value + 1) * padding.value);
const canvasHeight = computed(() => depth.value * slotSize.value + (depth.value + 1) * padding.value);

/**
 * Get the color for a cargo type
 */
function getCargoColor(type: CargoType): string {
  return CARGO_TYPE_COLORS[type] ?? '#ffffff';
}

/**
 * Get slot position on canvas
 */
function getSlotPosition(index: number): { x: number; y: number } {
  const col = index % width.value;
  const row = Math.floor(index / width.value);
  return {
    x: padding.value + col * (slotSize.value + padding.value),
    y: padding.value + row * (slotSize.value + padding.value),
  };
}

/**
 * Draw the cargo grid on canvas
 */
function drawGrid() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all slots (empty or filled)
  for (let i = 0; i < totalSlots.value; i++) {
    const pos = getSlotPosition(i);
    const item = items.value[i];

    if (item) {
      // Draw filled slot with cargo color
      ctx.fillStyle = getCargoColor(item.type);
      ctx.fillRect(pos.x, pos.y, slotSize.value, slotSize.value);

      // Draw item name in the center (dark text on light backgrounds)
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${Math.max(10, slotSize.value * 0.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Truncate name if too long
      const maxChars = Math.floor(slotSize.value / 8);
      const displayName = item.name.length > maxChars 
        ? item.name.substring(0, maxChars - 1) + '…' 
        : item.name;
      
      ctx.fillText(
        displayName,
        pos.x + slotSize.value / 2,
        pos.y + slotSize.value / 2
      );

      // Draw highlight if hovered
      if (hoveredItem.value?.id === item.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x + 1.5, pos.y + 1.5, slotSize.value - 3, slotSize.value - 3);
      }
    } else {
      // Draw empty slot
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(pos.x, pos.y, slotSize.value, slotSize.value);

      // Draw border for empty slot
      ctx.strokeStyle = '#2d2d44';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x + 0.5, pos.y + 0.5, slotSize.value - 1, slotSize.value - 1);
    }
  }
}

/**
 * Handle mouse move for hover detection
 */
function handleMouseMove(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Find which slot is hovered
  for (let i = 0; i < items.value.length; i++) {
    const pos = getSlotPosition(i);
    if (
      x >= pos.x &&
      x <= pos.x + slotSize.value &&
      y >= pos.y &&
      y <= pos.y + slotSize.value
    ) {
      const item = items.value[i];
      if (item) {
        hoveredItem.value = item;
        drawGrid();
      }
      return;
    }
  }
  
  if (hoveredItem.value) {
    hoveredItem.value = null;
    drawGrid();
  }
}

/**
 * Handle mouse leave
 */
function handleMouseLeave() {
  if (hoveredItem.value) {
    hoveredItem.value = null;
    drawGrid();
  }
}

// Watch for cargo changes and redraw
watch([items, width, depth], () => {
  drawGrid();
}, { deep: true });

// Draw on mount
onMounted(() => {
  drawGrid();
});
</script>

<template>
  <div class="cargo-grid">
    <!-- Loading state -->
    <div
      v-if="loading"
      class="cargo-grid__loading"
    >
      <span class="cargo-grid__loading-spinner" />
      <span class="cargo-grid__loading-text">LOADING CARGO DATA...</span>
    </div>

    <!-- Error state: corrupted/inconsistent data -->
    <div
      v-else-if="hasDataError"
      class="cargo-grid__error"
    >
      <span class="cargo-grid__error-icon">⚠</span>
      <span class="cargo-grid__error-text">CARGO DATA ERROR</span>
      <span class="cargo-grid__error-detail">Items exceed bay capacity</span>
    </div>

    <!-- Normal state: show grid (always) with optional empty overlay -->
    <template v-else>
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="cargo-grid__canvas"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      />

      <!-- Empty state overlay -->
      <div
        v-if="isEmpty"
        class="cargo-grid__empty-overlay"
      >
        <span class="cargo-grid__empty-text">NO CARGO LOADED</span>
      </div>

      <!-- Hover tooltip -->
      <div
        v-if="hoveredItem"
        class="cargo-grid__tooltip"
      >
        <span class="cargo-grid__tooltip-name">{{ hoveredItem.name }}</span>
        <span class="cargo-grid__tooltip-type">{{ hoveredItem.type.toUpperCase() }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.cargo-grid {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 300px;
  background-color: $color-black;
  border-radius: $radius-md;

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-md;
    width: 100%;
    height: 100%;
    min-height: 200px;
  }

  &__loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid $color-gold-dim;
    border-top-color: $color-gold;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__loading-text {
    font-family: $font-display;
    font-size: $font-size-sm;
    color: $color-gold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-sm;
    width: 100%;
    height: 100%;
    min-height: 200px;
    padding: $space-md;
  }

  &__error-icon {
    font-size: $font-size-xxl;
    color: $color-danger;
  }

  &__error-text {
    font-family: $font-display;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-danger;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__error-detail {
    font-family: $font-mono;
    font-size: $font-size-sm;
    color: $color-danger-dim;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 200px;
  }

  &__empty-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__empty-text {
    font-family: $font-display;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $color-info-dim;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 0 0 10px rgba($color-black, 0.8);
  }

  &__canvas {
    border-radius: $radius-sm;
    cursor: pointer;
  }

  &__tooltip {
    position: absolute;
    bottom: $space-md;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;
    padding: $space-sm $space-md;
    background-color: rgba($color-black, 0.9);
    border: 1px solid $color-info-dim;
    border-radius: $radius-sm;
  }

  &__tooltip-name {
    font-family: $font-display;
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-white;
  }

  &__tooltip-type {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-info;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
