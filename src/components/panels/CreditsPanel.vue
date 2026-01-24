<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores';
import { LcarsFrame } from '@/components/ui';

const gameStore = useGameStore();
const formattedCredits = computed(() => gameStore.formattedCredits);
</script>

<template>
  <LcarsFrame
    title="Status"
    color="gold"
  >
    <div class="status-panel">
      <div class="status-panel__row">
        <span class="status-panel__label">BALANCE</span>
        <span class="status-panel__value">{{ formattedCredits }}</span>
      </div>
    </div>
  </LcarsFrame>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.status-panel {
  display: flex;
  flex-direction: column;
  padding: $space-sm;
  gap: $space-sm;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-xs 0;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-purple;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  &__value {
    font-family: $font-mono;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gold;
  }
}
</style>
