<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGameStore, useShipStore, useNavigationStore, useSensorStore, useParticleStore, usePlayerShipEngines } from '@/stores';
import { useRendererStore } from '@/stores/rendererStore';
import { useGameLoop } from '@/core/game-loop';
import { KESTREL_REACH, KESTREL_REACH_SPAWN } from '@/data';
import { LcarsTabBar } from '@/components/ui';
import { PerformanceMonitor, ThrottlingController, DEFAULT_THROTTLING_CONFIG } from '@/core/rendering';

const gameStore = useGameStore();
const shipStore = useShipStore();
const navStore = useNavigationStore();
const sensorStore = useSensorStore();
const particleStore = useParticleStore();
const rendererStore = useRendererStore();
const { start, stop, subscribe } = useGameLoop();

const performanceMonitor = new PerformanceMonitor((rendererStore.performanceProfile as any).value.fpsAvgWindowSec);
const throttlingController = new ThrottlingController((rendererStore.performanceProfile as any).value, DEFAULT_THROTTLING_CONFIG);
throttlingController.start();

function mapThrottlingState(state: string): 'none' | 'particles' | 'effects' | 'resolution' {
  switch (state) {
    case 'throttling-particles':
      return 'particles';
    case 'throttling-effects':
      return 'effects';
    case 'throttling-resolution':
      return 'resolution';
    default:
      return 'none';
  }
}

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
    performanceMonitor.recordFrame();
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

    const snapshot = performanceMonitor.getSnapshot();
    throttlingController.update(snapshot);

    rendererStore.updateMetrics({
      fps: snapshot.fps,
      avgFps: snapshot.avgFps,
      frameTimeP95Ms: snapshot.frameTimeP95Ms,
      memoryMB: snapshot.memoryMB ?? (rendererStore.metrics as any).value.memoryMB,
      particleCount: (particleStore.activeCellCount as any) as number,
      effectsIntensity: throttlingController.getEffectsIntensity(),
    });

    rendererStore.setThrottlingStage(mapThrottlingState(throttlingController.getState()));
    particleStore.setThrottlingFactor(throttlingController.getParticleReductionFactor());
    particleStore.setParticleBudget(throttlingController.getMaxParticleCount());
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
