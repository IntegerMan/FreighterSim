<script setup lang="ts">
import { computed } from 'vue';
import { useCargoStore } from '@/stores';
import { LcarsFrame, LcarsGauge } from '@/components/ui';
import { CARGO_TYPE_COLORS } from '@/models';
import type { CargoType } from '@/models';

const cargoStore = useCargoStore();

// Capacity values
const totalSlots = computed(() => cargoStore.totalSlots);
const occupiedSlots = computed(() => cargoStore.occupiedSlots);
const availableSlots = computed(() => cargoStore.availableSlots);
const isFull = computed(() => cargoStore.isFull);
const isEmpty = computed(() => cargoStore.isEmpty);
const capacityPercent = computed(() => cargoStore.capacityPercent);
const itemsByType = computed(() => cargoStore.itemsByType);
const uniqueTypeCount = computed(() => cargoStore.uniqueTypeCount);

// Capacity status for styling
const capacityStatus = computed(() => {
  if (isFull.value) return 'full';
  if (isEmpty.value) return 'empty';
  if (cargoStore.capacityPercent > 80) return 'high';
  return 'normal';
});

// Get color for cargo type badge
function getTypeColor(type: CargoType): string {
  return CARGO_TYPE_COLORS[type] ?? '#ffffff';
}

// Get display name for cargo type
function getTypeName(type: CargoType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
</script>

<template>
  <LcarsFrame
    title="Cargo Status"
    color="gold"
  >
    <div class="cargo-panel">
      <!-- Capacity Header -->
      <div class="cargo-panel__header">
        <span class="cargo-panel__label">CAPACITY</span>
        <span 
          class="cargo-panel__status"
          :class="`cargo-panel__status--${capacityStatus}`"
        >
          {{ capacityStatus.toUpperCase() }}
        </span>
      </div>

      <!-- Capacity Gauge -->
      <div class="cargo-panel__gauge">
        <LcarsGauge
          label="Bay Usage"
          :value="capacityPercent"
          :max="100"
          :min="0"
          :warning-threshold="80"
          :danger-threshold="95"
          unit="%"
        />
      </div>

      <!-- Capacity Stats -->
      <div class="cargo-panel__stats">
        <div class="cargo-panel__stat">
          <span class="cargo-panel__stat-label">TOTAL</span>
          <span class="cargo-panel__stat-value">{{ totalSlots }}</span>
        </div>
        <div class="cargo-panel__stat">
          <span class="cargo-panel__stat-label">OCCUPIED</span>
          <span class="cargo-panel__stat-value">{{ occupiedSlots }}</span>
        </div>
        <div class="cargo-panel__stat">
          <span class="cargo-panel__stat-label">AVAILABLE</span>
          <span 
            class="cargo-panel__stat-value"
            :class="{ 'cargo-panel__stat-value--warning': isFull }"
          >
            {{ availableSlots }}
          </span>
        </div>
      </div>

      <!-- Cargo Type Breakdown -->
      <div
        v-if="uniqueTypeCount > 0"
        class="cargo-panel__types"
      >
        <div class="cargo-panel__types-header">
          <span class="cargo-panel__types-label">CARGO TYPES</span>
          <span class="cargo-panel__types-count">{{ uniqueTypeCount }}</span>
        </div>
        <div class="cargo-panel__types-list">
          <div
            v-for="[type, items] in itemsByType"
            :key="type"
            class="cargo-panel__type-item"
          >
            <span 
              class="cargo-panel__type-badge"
              :style="{ backgroundColor: getTypeColor(type) }"
            />
            <span class="cargo-panel__type-name">{{ getTypeName(type) }}</span>
            <span class="cargo-panel__type-count">{{ items.length }}</span>
          </div>
        </div>
      </div>

      <!-- Full Capacity Warning -->
      <div 
        v-if="isFull" 
        class="cargo-panel__warning"
      >
        <span class="cargo-panel__warning-icon">⚠</span>
        <span class="cargo-panel__warning-text">CARGO BAY FULL</span>
      </div>
    </div>
  </LcarsFrame>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.cargo-panel {
  display: flex;
  flex-direction: column;
  gap: $space-md;
  padding: $space-sm;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: $space-sm;
    border-bottom: 1px solid $color-gold-dim;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-white;
    letter-spacing: 0.1em;
  }

  &__status {
    font-family: $font-mono;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
    text-transform: uppercase;

    &--empty {
      background-color: $color-info-dim;
      color: $color-white;
    }

    &--normal {
      background-color: $color-success-dim;
      color: $color-success;
    }

    &--high {
      background-color: $color-warning-dim;
      color: $color-warning;
    }

    &--full {
      background-color: $color-danger-dim;
      color: $color-danger;
    }
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  &__stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-xs 0;
  }

  &__stat-label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-info;
    letter-spacing: 0.05em;
  }

  &__stat-value {
    font-family: $font-mono;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-white;

    &--warning {
      color: $color-danger;
    }
  }

  &__gauge {
    padding: $space-sm 0;
    border-bottom: 1px solid $color-gold-dim;
  }

  &__types {
    padding-top: $space-sm;
  }

  &__types-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-sm;
  }

  &__types-label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-info;
    letter-spacing: 0.05em;
  }

  &__types-count {
    font-family: $font-mono;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $color-white;
  }

  &__types-list {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__type-item {
    display: flex;
    align-items: center;
    gap: $space-sm;
    padding: $space-xs;
    background-color: rgba($color-white, 0.05);
    border-radius: $radius-sm;
  }

  &__type-badge {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__type-name {
    flex: 1;
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__type-count {
    font-family: $font-mono;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $color-gold;
  }

  &__warning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-sm;
    padding: $space-sm;
    background-color: $color-danger-dim;
    border-radius: $radius-sm;
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__warning-icon {
    font-size: $font-size-lg;
    color: $color-danger;
  }

  &__warning-text {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $color-danger;
    letter-spacing: 0.1em;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
