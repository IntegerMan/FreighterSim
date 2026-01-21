<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGameStore, useShipStore, useNavigationStore, useSensorStore } from '@/stores';
import { useGameLoop } from '@/core/game-loop';
import { KESTREL_REACH, KESTREL_REACH_SPAWN } from '@/data';

import { SystemMap } from '@/components/map';
import { NavigationPanel, SensorPanel, DockingPanel, TimePanel } from '@/components/panels';

const gameStore = useGameStore();
const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const { start, stop, subscribe } = useGameLoop();

onMounted(() => {
  // Initialize game state
  navStore.loadSystem(KESTREL_REACH);
  shipStore.reset(KESTREL_REACH_SPAWN);
  gameStore.initialize(KESTREL_REACH.id);
  
  // Initial sensor refresh
  sensorStore.refreshContacts();
  
  // Subscribe stores to game loop
  const unsubscribe = subscribe((gameTime) => {
    gameStore.update(gameTime);
    shipStore.update(gameTime);
    navStore.update(gameTime);
    sensorStore.update(gameTime);
  });

  // Start the game loop
  start();

  onUnmounted(() => {
    unsubscribe();
    stop();
  });
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
      <div class="bridge-view__panel">
        <TimePanel />
      </div>
    </div>

    <!-- Right Panel Column -->
    <div class="bridge-view__right-panels">
      <div class="bridge-view__panel bridge-view__panel--grow">
        <SensorPanel />
      </div>
      <div class="bridge-view__panel">
        <DockingPanel />
      </div>
    </div>

    <!-- Title Bar -->
    <div class="bridge-view__title">
      <span class="bridge-view__title-text">SPACE FREIGHTER SIM</span>
      <span class="bridge-view__title-subtitle">BRIDGE CONTROL</span>
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
    justify-content: space-between;
    align-items: center;
    padding: $space-sm $space-md;
    background-color: $color-purple;
    border-radius: $radius-lcars-corner;
  }

  &__title-text {
    font-family: $font-display;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-black;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__title-subtitle {
    font-family: $font-display;
    font-size: $font-size-sm;
    color: $color-black;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
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
