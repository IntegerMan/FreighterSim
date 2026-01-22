<script setup lang="ts">
import { computed } from 'vue';
import { useShipStore, useSensorStore, useNavigationStore } from '@/stores';
import { LcarsButton } from '@/components/ui';
import { formatDistance } from '@/models';

const shipStore = useShipStore();
const sensorStore = useSensorStore();
const navStore = useNavigationStore();

// Find the nearest station that can be docked at
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

const distanceToStation = computed(() => {
  if (!nearestStation.value) return null;
  return nearestStation.value.distance;
});

const isInDockingRange = computed(() => {
  if (!nearestStation.value || !nearestStationData.value) return false;
  return nearestStation.value.distance <= nearestStationData.value.dockingRange;
});

const canDock = computed(() => {
  return isInDockingRange.value && shipStore.speed <= 5 && !shipStore.isDocked;
});

const dockingStatus = computed(() => {
  if (shipStore.isDocked) {
    return 'DOCKED';
  }
  if (!nearestStation.value) {
    return 'NO STATION IN RANGE';
  }
  if (!isInDockingRange.value) {
    return 'APPROACH STATION';
  }
  if (shipStore.speed > 5) {
    return 'REDUCE SPEED';
  }
  return 'READY TO DOCK';
});

const statusClass = computed(() => {
  if (shipStore.isDocked) return 'success';
  if (canDock.value) return 'ready';
  return 'warning';
});

function handleDock() {
  if (canDock.value && nearestStation.value) {
    shipStore.dock(nearestStation.value.id);
  }
}

function handleUndock() {
  shipStore.undock();
}

// Get the station we're docked at
const dockedStation = computed(() => {
  if (!shipStore.dockedAtId) return null;
  return navStore.stations.find(s => s.id === shipStore.dockedAtId);
});
</script>

<template>
  <div class="docking-panel">
    <!-- Docked State -->
    <template v-if="shipStore.isDocked && dockedStation">
      <div class="docking-panel__docked">
        <div class="docking-panel__station-info">
          <span class="docking-panel__label">DOCKED AT</span>
          <span class="docking-panel__station-name">{{ dockedStation.name }}</span>
        </div>

        <div class="docking-panel__services">
          <span class="docking-panel__label">AVAILABLE SERVICES</span>
          <div class="docking-panel__service-list">
            <span 
              v-for="service in dockedStation.services" 
              :key="service"
              class="docking-panel__service"
            >
              {{ service.toUpperCase() }}
            </span>
          </div>
        </div>

        <LcarsButton 
          label="UNDOCK" 
          color="warning" 
          full-width 
          @click="handleUndock" 
        />
      </div>
    </template>

    <!-- Undocked State -->
    <template v-else>
      <div
        class="docking-panel__status"
        :class="`docking-panel__status--${statusClass}`"
      >
        {{ dockingStatus }}
      </div>

      <template v-if="nearestStation">
        <div class="docking-panel__nearest">
          <span class="docking-panel__label">NEAREST STATION</span>
          <span class="docking-panel__station-name">{{ nearestStation.name }}</span>
        </div>

        <div class="docking-panel__distance">
          <span class="docking-panel__label">DISTANCE</span>
          <span 
            class="docking-panel__distance-value"
            :class="{ 'docking-panel__distance-value--in-range': isInDockingRange }"
          >
            {{ formatDistance(distanceToStation!) }}
          </span>
        </div>

        <div
          v-if="isInDockingRange"
          class="docking-panel__speed-check"
        >
          <span class="docking-panel__label">SPEED</span>
          <span 
            class="docking-panel__speed-value"
            :class="{ 'docking-panel__speed-value--ok': shipStore.speed <= 5 }"
          >
            {{ shipStore.speed.toFixed(0) }} u/s
            <span
              v-if="shipStore.speed > 5"
              class="docking-panel__speed-warning"
            >
              (MAX 5)
            </span>
          </span>
        </div>
      </template>

      <LcarsButton 
        label="DOCK" 
        color="success" 
        full-width 
        :disabled="!canDock"
        @click="handleDock" 
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.docking-panel {
  display: flex;
  flex-direction: column;
  gap: $space-md;

  &__status {
    font-family: $font-display;
    font-size: $font-size-sm;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: $space-sm;
    border-radius: $radius-sm;

    &--warning {
      background-color: rgba($color-warning, 0.1);
      color: $color-warning;
    }

    &--ready {
      background-color: rgba($color-success, 0.1);
      color: $color-success;
    }

    &--success {
      background-color: rgba($color-success, 0.2);
      color: $color-success;
    }
  }

  &__docked {
    display: flex;
    flex-direction: column;
    gap: $space-md;
  }

  &__station-info,
  &__nearest,
  &__distance,
  &__speed-check,
  &__services {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__station-name {
    font-family: $font-mono;
    font-size: $font-size-md;
    color: $color-gold;
  }

  &__distance-value {
    font-family: $font-mono;
    font-size: $font-size-md;
    color: $color-warning;

    &--in-range {
      color: $color-success;
    }
  }

  &__speed-value {
    font-family: $font-mono;
    font-size: $font-size-md;
    color: $color-danger;

    &--ok {
      color: $color-success;
    }
  }

  &__speed-warning {
    font-size: $font-size-xs;
    color: $color-danger;
  }

  &__service-list {
    display: flex;
    flex-wrap: wrap;
    gap: $space-xs;
  }

  &__service {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gold;
    padding: $space-xs $space-sm;
    background-color: rgba($color-gold, 0.1);
    border-radius: $radius-sm;
  }
}
</style>
