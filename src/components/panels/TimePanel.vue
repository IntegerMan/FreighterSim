<script setup lang="ts">
import { useGameStore } from '@/stores';
import { useGameLoop } from '@/core/game-loop';
import { LcarsFrame, LcarsButton } from '@/components/ui';

const gameStore = useGameStore();
const { setTimeScale } = useGameLoop();

function handleTimeScaleChange(scale: number) {
  setTimeScale(scale);
}
</script>

<template>
  <LcarsFrame title="Time" color="gold">
    <div class="time-panel">
      <div class="time-panel__clock">
        <span class="time-panel__label">ELAPSED</span>
        <span class="time-panel__time">{{ gameStore.formattedTime }}</span>
      </div>

      <div class="time-panel__scale">
        <span class="time-panel__label">TIME SCALE</span>
        <div class="time-panel__buttons">
          <LcarsButton
            v-for="scale in gameStore.availableTimescales"
            :key="scale"
            :label="`${scale}x`"
            size="sm"
            :color="gameStore.timeScale === scale ? 'gold' : 'purple'"
            :active="gameStore.timeScale === scale"
            @click="handleTimeScaleChange(scale)"
          />
        </div>
      </div>

      <div class="time-panel__status">
        <span 
          class="time-panel__indicator"
          :class="{ 'time-panel__indicator--paused': gameStore.isPaused }"
        >
          {{ gameStore.isPaused ? 'PAUSED' : 'RUNNING' }}
        </span>
      </div>
    </div>
  </LcarsFrame>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.time-panel {
  display: flex;
  flex-direction: column;
  gap: $space-md;

  &__clock {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
    text-align: center;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__time {
    font-family: $font-mono;
    font-size: $font-size-xxl;
    color: $color-gold;
    letter-spacing: 0.1em;
  }

  &__scale {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
    align-items: center;
  }

  &__buttons {
    display: flex;
    gap: $space-xs;
  }

  &__status {
    text-align: center;
  }

  &__indicator {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-success;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: $space-xs $space-sm;
    background-color: rgba($color-success, 0.1);
    border-radius: $radius-sm;

    &--paused {
      color: $color-warning;
      background-color: rgba($color-warning, 0.1);
    }
  }
}
</style>
