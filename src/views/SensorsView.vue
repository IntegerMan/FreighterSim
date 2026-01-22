<script setup lang="ts">
import { SensorPanel } from '@/components/panels';
import { LcarsFrame } from '@/components/ui';
</script>

<template>
  <div class="sensors-view">
    <!-- Main Radar Area (Placeholder) -->
    <div class="sensors-view__radar">
      <LcarsFrame title="Radar Display" color="purple" no-padding>
        <div class="sensors-view__radar-placeholder">
          <div class="sensors-view__radar-rings">
            <div class="sensors-view__radar-ring sensors-view__radar-ring--1"></div>
            <div class="sensors-view__radar-ring sensors-view__radar-ring--2"></div>
            <div class="sensors-view__radar-ring sensors-view__radar-ring--3"></div>
            <div class="sensors-view__radar-ring sensors-view__radar-ring--4"></div>
          </div>
          <div class="sensors-view__radar-crosshair"></div>
          <div class="sensors-view__radar-ship"></div>
          <span class="sensors-view__radar-label">RADAR DISPLAY</span>
          <span class="sensors-view__radar-sublabel">Coming Soon</span>
        </div>
      </LcarsFrame>
    </div>

    <!-- Left Panel Column -->
    <div class="sensors-view__left-panels">
      <div class="sensors-view__panel sensors-view__panel--grow">
        <SensorPanel />
      </div>
    </div>

    <!-- Right Panel Column -->
    <div class="sensors-view__right-panels">
      <div class="sensors-view__panel">
        <LcarsFrame title="Scan Controls" color="purple">
          <div class="scan-controls">
            <div class="scan-controls__placeholder">
              <span class="scan-controls__label">SCAN CONTROLS</span>
              <span class="scan-controls__sublabel">Coming Soon</span>
            </div>
          </div>
        </LcarsFrame>
      </div>
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

  &__radar {
    grid-column: 2;
    grid-row: 2;
    border-radius: $radius-lcars-corner;
    overflow: hidden;
  }

  &__radar-placeholder {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: $color-black;
    position: relative;
    overflow: hidden;
  }

  &__radar-rings {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &__radar-ring {
    position: absolute;
    border: 1px solid $color-purple-dim;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    &--1 {
      width: 100px;
      height: 100px;
    }

    &--2 {
      width: 200px;
      height: 200px;
    }

    &--3 {
      width: 300px;
      height: 300px;
    }

    &--4 {
      width: 400px;
      height: 400px;
    }
  }

  &__radar-crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: $color-purple-dim;
    }

    &::before {
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
    }

    &::after {
      left: 50%;
      top: 0;
      bottom: 0;
      width: 1px;
    }
  }

  &__radar-ship {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background-color: $color-success;
    border-radius: 50%;
    box-shadow: 0 0 10px $color-success;
  }

  &__radar-label {
    position: relative;
    z-index: 1;
    font-family: $font-display;
    font-size: $font-size-lg;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }

  &__radar-sublabel {
    position: relative;
    z-index: 1;
    margin-top: $space-sm;
    font-family: $font-mono;
    font-size: $font-size-sm;
    color: $color-gray;
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

.scan-controls {
  &__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $space-xl;
    gap: $space-sm;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-sm;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__sublabel {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-lg) {
  .sensors-view {
    grid-template-columns: 240px 1fr 240px;
  }
}

@media (max-width: $breakpoint-md) {
  .sensors-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;

    &__radar {
      grid-column: 1;
      grid-row: 2;
    }

    &__left-panels {
      grid-column: 1;
      grid-row: 3;
      flex-direction: row;
      flex-wrap: wrap;
    }

    &__right-panels {
      display: none;
    }
  }
}
</style>
