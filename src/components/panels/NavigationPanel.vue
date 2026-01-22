<script setup lang="ts">
import { computed } from 'vue';
import { useShipStore, useNavigationStore } from '@/stores';
import { LcarsFrame, LcarsDisplay } from '@/components/ui';

const shipStore = useShipStore();
const navStore = useNavigationStore();

const headingDisplay = computed(() => shipStore.headingFormatted);
const speedDisplay = computed(() => shipStore.speed.toFixed(0));
const selectedObject = computed(() => {
  if (!navStore.selectedObjectId) return null;
  
  // Check stations
  const station = navStore.stations.find(s => s.id === navStore.selectedObjectId);
  if (station) return { name: station.name, type: 'Station' };
  
  // Check planets
  const planet = navStore.planets.find(p => p.id === navStore.selectedObjectId);
  if (planet) return { name: planet.name, type: 'Planet' };
  
  // Check jump gates
  const gate = navStore.jumpGates.find(g => g.id === navStore.selectedObjectId);
  if (gate) return { name: gate.name, type: 'Jump Gate' };
  
  return null;
});
</script>

<template>
  <LcarsFrame
    title="Navigation"
    color="purple"
  >
    <div class="nav-panel">
      <!-- Ship Status Summary -->
      <div class="nav-panel__section">
        <LcarsDisplay
          label="Heading"
          :value="headingDisplay"
        />
        <LcarsDisplay
          label="Speed"
          :value="speedDisplay"
          unit="u/s"
        />
      </div>

      <!-- Ship Telemetry -->
      <div class="nav-panel__divider" />

      <div class="nav-panel__section">
        <div class="nav-panel__section-header">
          Ship Telemetry
        </div>
        <LcarsDisplay
          label="Position X"
          :value="shipStore.position.x.toFixed(0)"
          unit="u"
        />
        <LcarsDisplay
          label="Position Y"
          :value="shipStore.position.y.toFixed(0)"
          unit="u"
        />
        <LcarsDisplay
          label="Velocity"
          :value="shipStore.speed.toFixed(1)"
          unit="u/s"
        />
        <LcarsDisplay
          label="Max Speed"
          :value="shipStore.engines.maxSpeed.toFixed(0)"
          unit="u/s"
        />
      </div>

      <!-- Divider -->
      <div class="nav-panel__divider" />

      <!-- Selected Target -->
      <div class="nav-panel__section">
        <div class="nav-panel__target-header">
          Selected Target
        </div>
        <div
          v-if="selectedObject"
          class="nav-panel__target-info"
        >
          <span class="nav-panel__target-name">{{ selectedObject.name }}</span>
          <span class="nav-panel__target-type">{{ selectedObject.type }}</span>
        </div>
        <div
          v-else
          class="nav-panel__no-target"
        >
          No target selected
        </div>
      </div>



      <!-- Docked indicator -->
      <div
        v-if="shipStore.isDocked"
        class="nav-panel__docked-notice"
      >
        SHIP DOCKED
      </div>
    </div>
  </LcarsFrame>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.nav-panel {
  display: flex;
  flex-direction: column;
  gap: $space-md;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: $space-xs;
  
  // Custom scrollbar styling
  scrollbar-width: thin;
  scrollbar-color: $color-purple $color-black;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: $color-black;
  }
  
  &::-webkit-scrollbar-thumb {
    background: $color-purple;
    border-radius: $radius-pill;
    
    &:hover {
      background: lighten($color-purple, 10%);
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  &__section-header {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-gray;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__divider {
    height: 2px;
    background-color: $color-purple-dim;
  }

  &__target-header {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-gray;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__target-info {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__target-name {
    font-family: $font-mono;
    font-size: $font-size-md;
    color: $color-white;
  }

  &__target-type {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
    text-transform: uppercase;
  }

  &__no-target {
    font-family: $font-mono;
    font-size: $font-size-sm;
    color: $color-gray;
    font-style: italic;
  }

  &__link-section {
    display: flex;
    justify-content: center;
  }

  &__helm-link {
    font-family: $font-display;
    font-size: $font-size-sm;
    color: $color-gold;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: $space-sm $space-md;
    border: 1px solid $color-gold;
    border-radius: $radius-pill;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: $color-gold;
      color: $color-black;
    }
  }

  &__docked-notice {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-warning;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: $space-sm;
    background-color: rgba($color-warning, 0.1);
    border-radius: $radius-sm;
  }
}
</style>
