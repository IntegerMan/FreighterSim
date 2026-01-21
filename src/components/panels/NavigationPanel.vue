<script setup lang="ts">
import { computed } from 'vue';
import { useShipStore } from '@/stores';
import { LcarsFrame, LcarsButton, LcarsDisplay } from '@/components/ui';

const shipStore = useShipStore();

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
  <LcarsFrame title="Navigation" color="purple">
    <div class="nav-panel">
      <!-- Heading Section -->
      <div class="nav-panel__section">
        <div class="nav-panel__heading-display">
          <LcarsDisplay label="Heading" :value="headingDisplay" size="lg" />
          <span class="nav-panel__target">
            Target: {{ targetHeadingDisplay }}
          </span>
        </div>
        
        <div class="nav-panel__heading-controls">
          <LcarsButton label="◀◀" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(-15)" />
          <LcarsButton label="◀" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(-5)" />
          <LcarsButton label="▶" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(5)" />
          <LcarsButton label="▶▶" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustHeading(15)" />
        </div>
      </div>

      <!-- Divider -->
      <div class="nav-panel__divider"></div>

      <!-- Speed Section -->
      <div class="nav-panel__section">
        <div class="nav-panel__speed-display">
          <LcarsDisplay label="Speed" :value="speedDisplay" unit="u/s" size="lg" />
          <span class="nav-panel__target">
            Target: {{ targetSpeedDisplay }} u/s
          </span>
        </div>

        <div class="nav-panel__speed-bar">
          <div 
            class="nav-panel__speed-fill" 
            :style="{ width: `${shipStore.speedPercent}%` }"
          ></div>
        </div>

        <div class="nav-panel__speed-presets">
          <LcarsButton label="0%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(0)" />
          <LcarsButton label="25%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(25)" />
          <LcarsButton label="50%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(50)" />
          <LcarsButton label="75%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(75)" />
          <LcarsButton label="100%" size="sm" :disabled="shipStore.isDocked" @click="setSpeedPreset(100)" />
        </div>

        <div class="nav-panel__speed-controls">
          <LcarsButton label="-10" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustSpeed(-10)" />
          <LcarsButton label="-5" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustSpeed(-5)" />
          <LcarsButton label="+5" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustSpeed(5)" />
          <LcarsButton label="+10" size="sm" color="gold" :disabled="shipStore.isDocked" @click="adjustSpeed(10)" />
        </div>
      </div>

      <!-- Emergency Controls -->
      <div class="nav-panel__divider"></div>
      
      <div class="nav-panel__emergency">
        <LcarsButton 
          label="ALL STOP" 
          color="danger" 
          full-width 
          :disabled="shipStore.isDocked"
          @click="shipStore.allStop()" 
        />
      </div>

      <!-- Docked indicator -->
      <div v-if="shipStore.isDocked" class="nav-panel__docked-notice">
        SHIP DOCKED - NAVIGATION DISABLED
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

  &__heading-controls,
  &__speed-controls {
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
    transition: width $transition-normal;
  }

  &__divider {
    height: 2px;
    background-color: $color-purple-dim;
  }

  &__emergency {
    padding-top: $space-sm;
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
