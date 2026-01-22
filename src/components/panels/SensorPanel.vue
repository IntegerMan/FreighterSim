<script setup lang="ts">
import { computed } from 'vue';
import { useSensorStore, useNavigationStore } from '@/stores';
import { LcarsFrame } from '@/components/ui';
import { formatBearing, formatDistance, getContactSymbol } from '@/models';

const sensorStore = useSensorStore();
const navStore = useNavigationStore();

const sortedContacts = computed(() => sensorStore.sortedByDistance);

function selectContact(contactId: string) {
  sensorStore.selectContact(contactId);
  
  // Also select in navigation store
  const contact = sensorStore.contacts.find(c => c.id === contactId);
  if (contact) {
    switch (contact.type) {
      case 'station':
        navStore.selectStation(contactId);
        break;
      case 'planet':
        navStore.selectPlanet(contactId);
        break;
      case 'jump-gate':
        navStore.selectJumpGate(contactId);
        break;
    }
  }
}

function getContactClass(type: string): string {
  return `sensor-panel__contact--${type}`;
}
</script>

<template>
  <LcarsFrame
    title="Sensors"
    color="purple"
  >
    <div class="sensor-panel">
      <div class="sensor-panel__header">
        <span class="sensor-panel__count">{{ sensorStore.contactCount }} CONTACTS</span>
      </div>

      <div
        v-if="sortedContacts.length === 0"
        class="sensor-panel__empty"
      >
        NO CONTACTS DETECTED
      </div>

      <div
        v-else
        class="sensor-panel__list"
      >
        <div
          v-for="contact in sortedContacts"
          :key="contact.id"
          class="sensor-panel__contact"
          :class="[
            getContactClass(contact.type),
            { 'sensor-panel__contact--selected': contact.isSelected }
          ]"
          @click="selectContact(contact.id)"
        >
          <span class="sensor-panel__symbol">{{ getContactSymbol(contact.type) }}</span>
          <div class="sensor-panel__info">
            <span class="sensor-panel__name">{{ contact.name }}</span>
            <span class="sensor-panel__type">{{ contact.type.toUpperCase() }}</span>
          </div>
          <div class="sensor-panel__data">
            <span class="sensor-panel__bearing">{{ formatBearing(contact.bearing) }}</span>
            <span class="sensor-panel__distance">{{ formatDistance(contact.distance) }}</span>
          </div>
        </div>
      </div>
    </div>
  </LcarsFrame>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.sensor-panel {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  height: 100%;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__count {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__empty {
    font-family: $font-mono;
    font-size: $font-size-sm;
    color: $color-gray;
    text-align: center;
    padding: $space-lg;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
    overflow-y: auto;
    flex: 1;
  }

  &__contact {
    display: flex;
    align-items: center;
    gap: $space-sm;
    padding: $space-sm;
    background-color: $color-black-light;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background-color $transition-fast;
    border-left: 3px solid transparent;

    &:hover {
      background-color: $color-gray-dark;
    }

    &--selected {
      background-color: rgba($color-purple, 0.2);
      border-left-color: $color-purple;
    }

    &--station {
      .sensor-panel__symbol,
      .sensor-panel__name {
        color: $color-station;
      }
    }

    &--planet {
      .sensor-panel__symbol,
      .sensor-panel__name {
        color: $color-planet;
      }
    }

    &--ship {
      .sensor-panel__symbol,
      .sensor-panel__name {
        color: $color-ship;
      }
    }

    &--jump-gate {
      .sensor-panel__symbol,
      .sensor-panel__name {
        color: $color-jump-gate;
      }
    }
  }

  &__symbol {
    font-size: $font-size-lg;
    width: 24px;
    text-align: center;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-family: $font-mono;
    font-size: $font-size-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-gray;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__data {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  &__bearing,
  &__distance {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gold;
  }

  &__distance {
    color: $color-gray-light;
  }
}
</style>
