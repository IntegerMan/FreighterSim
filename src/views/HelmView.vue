<script setup lang="ts">
import { computed, ref } from 'vue';
import { useShipStore } from '@/stores';
import { HelmMap } from '@/components/map';
import { DockingPanel } from '@/components/panels';
import { LcarsFrame, LcarsButton, LcarsDisplay } from '@/components/ui';

const shipStore = useShipStore();
const expandedPanel = ref<'helm' | 'docking'>('helm');

const headingDisplay = computed(() => shipStore.headingFormatted);
const targetHeadingDisplay = computed(() => {
  return shipStore.targetHeading.toFixed(0).padStart(3, '0') + '°';
});
const speedDisplay = computed(() => shipStore.speed.toFixed(0));
const targetSpeedDisplay = computed(() => shipStore.targetSpeed.toFixed(0));

function adjustHeading(delta: number) {
  shipStore.adjustHeading(delta);
}

function adjustSpeed(delta: number) {
  shipStore.adjustSpeed(delta);
}

function setSpeedPreset(percent: number) {
  shipStore.setTargetSpeed(shipStore.maxSpeed * (percent / 100));
}
</script>

<template>
  <div class="helm-view">
    <!-- Main Map Area -->
    <div class="helm-view__map">
      <HelmMap />
    </div>

    <!-- Left Panel Column - Helm Controls and Docking -->
    <div class="helm-view__left-panels">
      <div 
        class="helm-view__panel"
        :class="{ 'helm-view__panel--collapsed': expandedPanel !== 'helm' }"
      >
        <div 
          class="helm-view__panel-header"
          @click="expandedPanel = 'helm'"
        >
          <span class="helm-view__panel-title">Helm Control</span>
          <span class="helm-view__panel-toggle">{{ expandedPanel === 'helm' ? '▼' : '▶' }}</span>
        </div>
        <div v-show="expandedPanel === 'helm'" class="helm-view__panel-content">
          <div class="helm-controls">
              <!-- Heading Section -->
              <div class="helm-controls__section">
                <div class="helm-controls__heading-display">
                  <LcarsDisplay label="Heading" :value="headingDisplay" size="lg" />
                  <span class="helm-controls__target">
                    Target: {{ targetHeadingDisplay }}
                  </span>
                </div>
                
                <div class="helm-controls__heading-buttons">
                  <LcarsButton label="◀◀" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(-15)" />
                  <LcarsButton label="◀" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(-5)" />
                  <LcarsButton label="▶" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(5)" />
                  <LcarsButton label="▶▶" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(15)" />
                </div>
              </div>

              <!-- Divider -->
              <div class="helm-controls__divider"></div>

              <!-- Speed Section -->
              <div class="helm-controls__section">
                <div class="helm-controls__speed-display">
                  <LcarsDisplay label="Speed" :value="speedDisplay" unit="u/s" size="lg" />
                  <span class="helm-controls__target">
                    Target: {{ targetSpeedDisplay }} u/s
                  </span>
                </div>

                <div class="helm-controls__speed-bar">
                  <div 
                    class="helm-controls__speed-fill" 
                    :style="{ width: `${shipStore.speedPercent}%` }"
                  ></div>
                </div>

                <div class="helm-controls__speed-presets">
                  <LcarsButton label="0%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(0)" />
                  <LcarsButton label="25%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(25)" />
                  <LcarsButton label="50%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(50)" />
                  <LcarsButton label="75%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(75)" />
                  <LcarsButton label="100%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(100)" />
                </div>
              </div>

              <!-- Emergency Controls -->
              <div class="helm-controls__divider"></div>
              
              <div class="helm-controls__emergency">
                <LcarsButton 
                  label="ALL STOP" 
                  color="danger" 
                  full-width 
                  :disabled="shipStore.isDocked"
                  @click="shipStore.allStop()" 
                />
              </div>

              <!-- Docked indicator -->
              <div v-if="shipStore.isDocked" class="helm-controls__docked-notice">
                SHIP DOCKED - HELM DISABLED
              </div>
            </div>
        </div>
      </div>
      <div 
        class="helm-view__panel"
        :class="{ 'helm-view__panel--collapsed': expandedPanel !== 'docking' }"
      >
        <div 
          class="helm-view__panel-header"
          @click="expandedPanel = 'docking'"
        >
          <span class="helm-view__panel-title">Docking</span>
          <span class="helm-view__panel-toggle">{{ expandedPanel === 'docking' ? '▼' : '▶' }}</span>
        </div>
        <div v-show="expandedPanel === 'docking'" class="helm-view__panel-content">
          <DockingPanel />
        </div>
      </div>
    </div>

    <!-- Station Title -->
    <div class="helm-view__title">
      <span class="helm-view__title-text">HELM CONTROL</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.helm-view {
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
    background-color: $color-gold-dark;
    border-radius: $radius-md;
  }

  &__title-text {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-black;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  &__map {
    grid-column: 2;
    grid-row: 2;
    border-radius: $radius-lcars-corner;
    overflow: hidden;
    border: $panel-border-width solid $color-gold;
  }

  &__left-panels {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    grid-column: 1;
    grid-row: 2;
    overflow: hidden;
    border-radius: $radius-lcars-corner;
  }

  &__panel {
    flex-shrink: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: $color-black;
    overflow: hidden;
    border-top: $panel-border-width solid $color-gold;
    
    &:first-child {
      border-radius: $radius-lcars-corner $radius-lcars-corner 0 0;
      border-top: $panel-border-width solid $color-gold;
      border-left: $panel-border-width solid $color-gold;
      border-right: $panel-border-width solid $color-gold;
    }

    &:last-child {
      border-radius: 0 0 $radius-lcars-corner $radius-lcars-corner;
      border-left: $panel-border-width solid $color-gold;
      border-right: $panel-border-width solid $color-gold;
      border-bottom: $panel-border-width solid $color-gold;
    }

    &--collapsed {
      flex: 0 0 auto;
    }

    &:not(&--collapsed) {
      flex: 1;
    }
  }

  &__panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-sm $space-md;
    background-color: $color-gold-dark;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
    border-radius: inherit;

    &:hover {
      background-color: lighten($color-gold-dark, 5%);
    }
  }

  &__panel-title {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-black;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__panel-toggle {
    font-size: $font-size-sm;
    color: $color-black;
    transition: transform 0.2s ease;
  }

  &__panel-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: $space-md;
    
    // Custom scrollbar styling
    scrollbar-width: thin;
    scrollbar-color: $color-gold $color-black;
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: $color-black;
    }
    
    &::-webkit-scrollbar-thumb {
      background: $color-gold;
      border-radius: $radius-pill;
      
      &:hover {
        background: lighten($color-gold, 10%);
      }
    }
  }
}

.helm-controls {
  display: flex;
  flex-direction: column;
  gap: $space-md;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  &__heading-display,
  &__speed-display {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__target {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
  }

  &__heading-buttons,
  &__speed-buttons {
    display: flex;
    gap: $space-xs;
    justify-content: center;
  }

  &__speed-presets {
    display: flex;
    gap: $space-xs;
    justify-content: space-between;
  }

  &__speed-bar {
    height: 8px;
    background-color: $color-gray-dark;
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__speed-fill {
    height: 100%;
    background-color: $color-gold;
    border-radius: $radius-pill;
    transition: width 0.2s ease;
  }

  &__divider {
    height: 1px;
    background-color: $color-gray-dark;
    margin: $space-xs 0;
  }

  &__emergency {
    margin-top: $space-sm;
  }

  &__docked-notice {
    margin-top: $space-sm;
    padding: $space-sm;
    background-color: $color-warning-dim;
    color: $color-black;
    text-align: center;
    font-family: $font-display;
    font-size: $font-size-xs;
    border-radius: $radius-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.ship-status {
  display: flex;
  flex-direction: column;
  gap: $space-md;
}

// Responsive adjustments
@media (max-width: $breakpoint-lg) {
  .helm-view {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .helm-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;

    &__map {
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
