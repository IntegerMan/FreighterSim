<script setup lang="ts">
import { computed } from 'vue';
import { useShipStore, useNavigationStore } from '@/stores';
import { SystemMap } from '@/components/map';
import { NavigationPanel, SensorPanel } from '@/components/panels';
import { LcarsFrame, HeadingGauge, SpeedSlider } from '@/components/ui';

const shipStore = useShipStore();
const navStore = useNavigationStore();

// Waypoint heading for compass display
const waypointHeading = computed(() => {
  if (!navStore.currentWaypoint) return null;
  return navStore.getHeadingToWaypoint(shipStore.position, navStore.currentWaypoint.position);
});
</script>

<template>
  <div class="bridge-view">
    <!-- Main Map Area -->
    <div class="bridge-view__map">
      <SystemMap />
    </div>

    <!-- Left Panel Column -->
    <div class="bridge-view__left-panels">
      <div class="bridge-view__panel">
        <NavigationPanel />
      </div>
    </div>

    <!-- Right Panel Column -->
    <div class="bridge-view__right-panels">
      <!-- Helm Status Panel -->
      <LcarsFrame
        title="Helm Status"
        color="gold"
      >
        <div class="bridge-view__helm-status">
          <!-- Heading Gauge (read-only) -->
          <div class="bridge-view__gauge-section">
            <div class="bridge-view__section-header">
              Heading
            </div>
            <HeadingGauge
              :current-heading="shipStore.heading"
              :target-heading="shipStore.targetHeading"
              :waypoint-heading="waypointHeading"
              readonly
            />
          </div>

          <!-- Speed Slider (read-only) -->
          <div class="bridge-view__gauge-section">
            <div class="bridge-view__section-header">
              Speed
            </div>
            <SpeedSlider
              :current-speed="shipStore.speed"
              :target-speed="shipStore.targetSpeed"
              :max-speed="shipStore.engines.maxSpeed"
              :min-speed="shipStore.minSpeed"
              readonly
            />
          </div>

          <!-- Autopilot Indicator -->
          <div
            v-if="navStore.autopilotEnabled"
            class="bridge-view__autopilot-indicator"
          >
            AUTOPILOT ACTIVE
          </div>
        </div>
      </LcarsFrame>

      <div class="bridge-view__panel bridge-view__panel--grow">
        <SensorPanel />
      </div>
    </div>

    <!-- Station Title -->
    <div class="bridge-view__title">
      <span
        v-if="navStore.autopilotEnabled"
        class="bridge-view__autopilot-badge"
      >AUTOPILOT</span>
      <span class="bridge-view__title-text">TACTICAL OVERVIEW</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.bridge-view {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
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
    background-color: $color-purple-dark;
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

  &__map {
    grid-column: 2;
    grid-row: 2;
    border-radius: $radius-lcars-corner;
    overflow: hidden;
    border: $panel-border-width solid $color-purple;
  }

  &__left-panels,
  &__right-panels {
    display: flex;
    flex-direction: column;
    gap: $space-md;
    min-height: 0;
  }

  &__left-panels {
    grid-column: 1;
    grid-row: 2;
  }

  &__right-panels {
    grid-column: 3;
    grid-row: 2;
  }

  &__panel {
    flex-shrink: 0;

    &--grow {
      flex: 1;
      min-height: 200px;
    }
  }

  &__helm-status {
    display: flex;
    flex-direction: column;
    gap: $space-md;
  }

  &__gauge-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;
  }

  &__section-header {
    width: 100%;
    font-family: $font-display;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__autopilot-indicator {
    padding: $space-sm;
    background-color: rgba($color-success, 0.2);
    border: 1px solid $color-success;
    border-radius: $radius-sm;
    color: $color-success;
    font-family: $font-display;
    font-size: $font-size-xs;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  &__autopilot-badge {
    padding: $space-xs $space-sm;
    background-color: $color-success;
    color: $color-black;
    font-family: $font-display;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: $radius-sm;
    margin-right: $space-md;
    animation: pulse-glow 2s ease-in-out infinite;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-lg) {
  .bridge-view {
    grid-template-columns: 240px 1fr 240px;
  }
}

@media (max-width: $breakpoint-md) {
  .bridge-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;

    &__map {
      grid-column: 1;
      grid-row: 2;
    }

    &__left-panels,
    &__right-panels {
      flex-direction: row;
      flex-wrap: wrap;
    }

    &__left-panels {
      grid-column: 1;
      grid-row: 3;
    }

    &__right-panels {
      display: none; // Hide on mobile for now
    }

    &__panel {
      flex: 1;
      min-width: 200px;
    }
  }
}
</style>
