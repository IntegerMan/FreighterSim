<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGameStore, useShipStore, useNavigationStore, useSensorStore, useParticleStore, usePlayerShipEngines } from '@/stores';
import { useGameLoop } from '@/core/game-loop';
import { KESTREL_REACH, KESTREL_REACH_SPAWN } from '@/data';
import { LcarsTabBar } from '@/components/ui';

const gameStore = useGameStore();
const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const particleStore = useParticleStore();
const { start, stop, subscribe } = useGameLoop();

onMounted(() => {
  // Initialize game state (shared across all station views)
  navStore.loadSystem(KESTREL_REACH);
  shipStore.reset(KESTREL_REACH_SPAWN);
  gameStore.initialize(KESTREL_REACH.id);
  
  // Initial sensor refresh
  sensorStore.refreshContacts();

  // Register player ship engines for multi-point particle emission
  const unregisterEngines = usePlayerShipEngines();

  // Subscribe stores to game loop
  const unsubscribe = subscribe((gameTime) => {
    gameStore.update(gameTime);
    
    // Apply autopilot steering if enabled
    if (navStore.autopilotEnabled && navStore.currentWaypoint && !shipStore.isDocked) {
      const targetHeading = navStore.getHeadingToWaypoint(
        shipStore.position, 
        navStore.currentWaypoint.position
      );
      shipStore.setTargetHeading(targetHeading);
    }
    
    shipStore.update(gameTime);
    navStore.update(gameTime);
    sensorStore.update(gameTime);
    particleStore.update(gameTime);
  });

  // Start the game loop
  start();

  onUnmounted(() => {
    unsubscribe();
    unregisterEngines();
    stop();
  });
});
</script>

<template>
  <div class="app">
    <header class="app__header">
      <div class="app__title">
        <span class="app__title-text">TAKE THE SKY</span>
      </div>
      <LcarsTabBar />
    </header>
    <main class="app__content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $color-black;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: $space-md;
    padding: $space-sm $space-md;
    flex-shrink: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    padding: $space-sm $space-lg;
    background-color: $color-purple;
    border-radius: $radius-lcars-corner;
    flex-shrink: 0;
  }

  &__title-text {
    font-family: $font-display;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-black;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}
</style>
