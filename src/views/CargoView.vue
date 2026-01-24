<script setup lang="ts">
import { LcarsFrame } from '@/components/ui';
import { CargoGrid } from '@/components/cargo';
import { CargoPanel, CreditsPanel } from '@/components/panels';
</script>

<template>
  <div class="cargo-view">
    <!-- Left Panel Column -->
    <div class="cargo-view__left-panels">
      <div class="cargo-view__panel">
        <CreditsPanel />
      </div>
      <div class="cargo-view__panel cargo-view__panel--grow">
        <CargoPanel />
      </div>
    </div>

    <!-- Cargo Grid Display -->
    <div class="cargo-view__display">
      <LcarsFrame
        title="Cargo Bay"
        color="gold"
        no-padding
      >
        <CargoGrid />
      </LcarsFrame>
    </div>

    <!-- Station Title -->
    <div class="cargo-view__title">
      <span class="cargo-view__title-text">CARGO HOLD</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.cargo-view {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;
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
    background-color: $color-gold-dim;
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
    grid-column: 2;
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
  .cargo-view {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .cargo-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;

    &__display {
      grid-column: 1;
      grid-row: 2;
    }

    &__left-panels {
      grid-column: 1;
      grid-row: 3;
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
}
</style>
