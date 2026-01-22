<script setup lang="ts">
import { computed } from 'vue';
import { SensorPanel } from '@/components/panels';
import { LcarsFrame } from '@/components/ui';
import { RadarDisplay, TraceParticlesDisplay } from '@/components/sensors';
import { useSensorStore, useShipStore, useParticleStore } from '@/stores';

const sensorStore = useSensorStore();
const shipStore = useShipStore();
const particleStore = useParticleStore();

// Computed props for displays
const radarSegments = computed(() => sensorStore.radarSegments);
const sensorRange = computed(() => sensorStore.sensorRange);
const proximityDisplayRange = computed(() => sensorStore.proximityDisplayRange);
const shipHeading = computed(() => shipStore.heading);
const shipPosition = computed(() => shipStore.position);
const particleCells = computed(() => particleStore.activeCells);
const particleCellSize = computed(() => particleStore.config.cellSize);
const particleMaxDensity = computed(() => particleStore.config.maxDensity);

// Handle contact selection from radar
function handleSelectContact(contactId: string) {
  sensorStore.selectContact(contactId);
}
</script>

<template>
  <div class="sensors-view">
    <!-- Left Panel Column -->
    <div class="sensors-view__left-panels">
      <div class="sensors-view__panel sensors-view__panel--grow">
        <SensorPanel />
      </div>
    </div>

    <!-- Radar Display -->
    <div class="sensors-view__display">
      <LcarsFrame
        title="Proximity Radar"
        color="purple"
        no-padding
      >
        <RadarDisplay
          :segments="radarSegments"
          :range="sensorRange"
          :display-range="proximityDisplayRange"
          :ship-heading="shipHeading"
          @select-contact="handleSelectContact"
        />
      </LcarsFrame>
    </div>

    <!-- Particle Display -->
    <div class="sensors-view__display">
      <LcarsFrame
        title="Particle Traces"
        color="purple"
        no-padding
      >
        <TraceParticlesDisplay
          :cells="particleCells"
          :cell-size="particleCellSize"
          :ship-position="shipPosition"
          :ship-heading="shipHeading"
          :max-density="particleMaxDensity"
          :view-radius="1000"
        />
      </LcarsFrame>
    </div>

    <!-- Station Title -->
    <div class="sensors-view__title">
      <span class="sensors-view__title-text">SENSOR STATION</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.sensors-view {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: $space-md;
  padding: $space-md;
  background-color: $color-black;
  overflow: hidden;

  &__title {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $space-xs $space-md;
    background-color: $color-info-dim;
    border-radius: $radius-md;
  }

  &__title-text {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-white;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  &__display {
    grid-row: 2;
    border-radius: $radius-lcars-corner;
    overflow: hidden;
  }

  &__left-panels {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    gap: $space-md;
    min-height: 0;
  }

  &__panel {
    flex-shrink: 0;

    &--grow {
      flex: 1;
      min-height: 200px;
    }
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-lg) {
  .sensors-view {
    grid-template-columns: 240px 1fr 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .sensors-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr 1fr auto;

    &__display {
      grid-column: 1;
    }

    &__left-panels {
      grid-column: 1;
      grid-row: 4;
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
}
</style>
