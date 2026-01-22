<script setup lang="ts">
import { computed } from 'vue';
import { useShipStore, useSensorStore, useNavigationStore } from '@/stores';
import { HelmMap } from '@/components/map';
import { LcarsButton, HeadingGauge, SpeedSlider } from '@/components/ui';
import { CompactRadar } from '@/components/sensors';
import { formatDistance } from '@/models';

const shipStore = useShipStore();
const sensorStore = useSensorStore();
const navStore = useNavigationStore();

// Waypoint heading for compass display
const waypointHeading = computed(() => {
  if (!navStore.currentWaypoint) return null;
  return navStore.getHeadingToWaypoint(shipStore.position, navStore.currentWaypoint.position);
});

// Docking logic (moved from DockingPanel)
const nearestStation = computed(() => {
  const stationContacts = sensorStore.stationContacts;
  if (stationContacts.length === 0) return null;
  const sorted = [...stationContacts].sort((a, b) => a.distance - b.distance);
  return sorted[0];
});

const nearestStationData = computed(() => {
  if (!nearestStation.value) return null;
  return navStore.stations.find(s => s.id === nearestStation.value!.id);
});

const isInDockingRange = computed(() => {
  if (!nearestStation.value || !nearestStationData.value) return false;
  return nearestStation.value.distance <= nearestStationData.value.dockingRange;
});

const canDock = computed(() => {
  return isInDockingRange.value && Math.abs(shipStore.speed) <= 5 && !shipStore.isDocked;
});

const dockingStatus = computed(() => {
  if (shipStore.isDocked) return 'docked';
  if (!nearestStation.value) return 'no-station';
  if (!isInDockingRange.value) return 'out-of-range';
  if (Math.abs(shipStore.speed) > 5) return 'too-fast';
  return 'ready';
});

const dockedStation = computed(() => {
  if (!shipStore.dockedAtId) return null;
  return navStore.stations.find(s => s.id === shipStore.dockedAtId);
});

function handleDock() {
  if (canDock.value && nearestStation.value) {
    shipStore.dock(nearestStation.value.id);
  }
}

function handleUndock() {
  shipStore.undock();
}

function setHeading(heading: number) {
  // Manual heading adjustment - disable autopilot
  navStore.disableAutopilot();
  shipStore.setTargetHeading(heading);
}

function setSpeed(speed: number) {
  shipStore.setTargetSpeed(speed);
}

function handleRadarSelect(contactId: string) {
  sensorStore.selectContact(contactId);
  navStore.selectStation(contactId);
}
</script>

<template>
  <div class="helm-view">
    <!-- Main Map Area -->
    <div class="helm-view__map">
      <HelmMap />
    </div>

    <!-- Left Panel Column -->
    <div class="helm-view__sidebar">
      <div class="helm-view__panel">
        <!-- Heading Section -->
        <div class="helm-view__section">
          <div class="helm-view__section-header">Heading</div>
          <HeadingGauge
            :current-heading="shipStore.heading"
            :target-heading="shipStore.targetHeading"
            :waypoint-heading="waypointHeading"
            :disabled="shipStore.isDocked"
            @set-heading="setHeading"
          />
        </div>

        <!-- Divider -->
        <div class="helm-view__divider"></div>

        <!-- Speed Section -->
        <div class="helm-view__section">
          <div class="helm-view__section-header">Speed</div>
          <SpeedSlider
            :current-speed="shipStore.speed"
            :target-speed="shipStore.targetSpeed"
            :max-speed="shipStore.engines.maxSpeed"
            :min-speed="shipStore.minSpeed"
            :disabled="shipStore.isDocked"
            @set-speed="setSpeed"
          />
        </div>

        <!-- Divider -->
        <div class="helm-view__divider"></div>

        <!-- Emergency Controls -->
        <div class="helm-view__controls">
          <LcarsButton 
            label="ALL STOP" 
            color="danger" 
            full-width 
            :disabled="shipStore.isDocked"
            @click="shipStore.allStop()" 
          />
          
          <!-- Dock Button - conditional display -->
          <template v-if="shipStore.isDocked">
            <div class="helm-view__docked-info">
              <span class="helm-view__docked-label">DOCKED AT</span>
              <span class="helm-view__docked-station">{{ dockedStation?.name }}</span>
            </div>
            <LcarsButton 
              label="UNDOCK" 
              color="warning" 
              full-width 
              @click="handleUndock" 
            />
          </template>
          <template v-else-if="dockingStatus === 'ready'">
            <LcarsButton 
              label="DOCK" 
              color="success" 
              full-width 
              @click="handleDock" 
            />
          </template>
          <template v-else-if="dockingStatus === 'too-fast'">
            <LcarsButton 
              label="TOO FAST" 
              color="warning" 
              full-width 
              disabled
            />
          </template>

          <LcarsButton 
            :label="navStore.autopilotEnabled ? 'AUTOPILOT ON' : 'AUTOPILOT OFF'" 
            :color="navStore.autopilotEnabled ? 'success' : 'purple'" 
            full-width 
            :disabled="shipStore.isDocked"
            @click="navStore.toggleAutopilot()" 
          />
        </div>

        <!-- Divider -->
        <div class="helm-view__divider"></div>

        <!-- Proximity Radar -->
        <div class="helm-view__section">
          <div class="helm-view__section-header">Proximity</div>
          <div class="helm-view__radar-container">
            <CompactRadar
              :segments="sensorStore.radarSegments"
              :range="sensorStore.sensorRange"
              :display-range="sensorStore.proximityDisplayRange"
              :ship-heading="shipStore.heading"
              :size="120"
              @select-contact="handleRadarSelect"
            />
          </div>
          <div v-if="nearestStation" class="helm-view__nearest">
            <span class="helm-view__nearest-label">{{ nearestStation.name }}</span>
            <span class="helm-view__nearest-distance" :class="{ 'helm-view__nearest-distance--in-range': isInDockingRange }">
              {{ formatDistance(nearestStation.distance) }}
            </span>
          </div>
        </div>

        <!-- Docked indicator -->
        <div v-if="shipStore.isDocked" class="helm-view__docked-notice">
          HELM DISABLED WHILE DOCKED
        </div>
      </div>
    </div>

    <!-- Station Title -->
    <div class="helm-view__title">
      <span v-if="navStore.autopilotEnabled" class="helm-view__autopilot-badge">AUTOPILOT</span>
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
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr;
  gap: $space-sm;
  padding: $space-sm;
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

  &__autopilot-badge {
    padding: $space-xs $space-sm;
    background-color: $color-success;
    color: $color-black;
    font-family: $font-display;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: $radius-sm;
    margin-right: $space-md;
    animation: helm-pulse-glow 2s ease-in-out infinite;
  }

  &__map {
    grid-column: 2;
    grid-row: 2;
    border-radius: $radius-lcars-corner;
    overflow: hidden;
    border: $panel-border-width solid $color-gold;
  }

  &__sidebar {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-sm;
    padding: $space-sm;
    background-color: $color-black;
    border: $panel-border-width solid $color-gold;
    border-radius: $radius-lcars-corner;
    overflow-y: auto;
    
    // Custom scrollbar styling
    scrollbar-width: thin;
    scrollbar-color: $color-gold $color-black;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: $color-black;
    }
    
    &::-webkit-scrollbar-thumb {
      background: $color-gold;
      border-radius: $radius-pill;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;
  }

  &__section-header {
    width: 100%;
    font-family: $font-display;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__divider {
    height: 1px;
    background-color: $color-gray-dark;
    margin: $space-xs 0;
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
    width: 100%;
  }

  &__docked-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: $space-xs;
    background-color: rgba($color-success, 0.1);
    border-radius: $radius-sm;
  }

  &__docked-label {
    font-family: $font-display;
    font-size: 10px;
    color: $color-success;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__docked-station {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gold;
  }

  &__radar-container {
    display: flex;
    justify-content: center;
  }

  &__nearest {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: $space-xs;
    background-color: rgba($color-purple, 0.1);
    border-radius: $radius-sm;
  }

  &__nearest-label {
    font-family: $font-mono;
    font-size: 10px;
    color: $color-gold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__nearest-distance {
    font-family: $font-mono;
    font-size: 10px;
    color: $color-warning;

    &--in-range {
      color: $color-success;
    }
  }

  &__docked-notice {
    margin-top: auto;
    padding: $space-xs;
    background-color: $color-warning-dim;
    color: $color-black;
    text-align: center;
    font-family: $font-display;
    font-size: 10px;
    border-radius: $radius-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-lg) {
  .helm-view {
    grid-template-columns: 180px 1fr;
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

    &__sidebar {
      grid-column: 1;
      grid-row: 3;
      max-height: 300px;
    }
  }
}

@keyframes helm-pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
