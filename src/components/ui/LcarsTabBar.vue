<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

interface Tab {
  name: string;
  path: string;
  title: string;
  order: number;
}

interface Props {
  maxVisibleTabs?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxVisibleTabs: 5,
});

const router = useRouter();
const route = useRoute();
const showOverflow = ref(false);

// Build tabs from router routes
const allTabs = computed<Tab[]>(() => {
  return router.getRoutes()
    .filter(r => r.meta?.title && r.meta?.order)
    .map(r => ({
      name: r.name as string,
      path: r.path,
      title: r.meta!.title as string,
      order: r.meta!.order as number,
    }))
    .sort((a, b) => a.order - b.order);
});

const visibleTabs = computed(() => allTabs.value.slice(0, props.maxVisibleTabs));
const overflowTabs = computed(() => allTabs.value.slice(props.maxVisibleTabs));
const hasOverflow = computed(() => overflowTabs.value.length > 0);

const currentRoute = computed(() => route.name);

function isActive(tabName: string): boolean {
  return currentRoute.value === tabName;
}

function navigateTo(path: string) {
  router.push(path);
  showOverflow.value = false;
}

function toggleOverflow() {
  showOverflow.value = !showOverflow.value;
}

function closeOverflow() {
  showOverflow.value = false;
}
</script>

<template>
  <nav class="lcars-tab-bar" @mouseleave="closeOverflow">
    <div class="lcars-tab-bar__left-cap"></div>
    
    <div class="lcars-tab-bar__tabs">
      <router-link
        v-for="tab in visibleTabs"
        :key="tab.name"
        :to="tab.path"
        class="lcars-tab-bar__tab"
        :class="{ 'lcars-tab-bar__tab--active': isActive(tab.name) }"
      >
        {{ tab.title }}
      </router-link>
      
      <!-- Overflow menu trigger -->
      <button
        v-if="hasOverflow"
        class="lcars-tab-bar__tab lcars-tab-bar__tab--overflow"
        :class="{ 'lcars-tab-bar__tab--active': showOverflow }"
        @click="toggleOverflow"
      >
        MORE ▼
      </button>
    </div>

    <div class="lcars-tab-bar__right-cap"></div>
    
    <!-- Overflow dropdown -->
    <div 
      v-if="showOverflow && hasOverflow" 
      class="lcars-tab-bar__overflow-menu"
    >
      <button
        v-for="tab in overflowTabs"
        :key="tab.name"
        class="lcars-tab-bar__overflow-item"
        :class="{ 'lcars-tab-bar__overflow-item--active': isActive(tab.name) }"
        @click="navigateTo(tab.path)"
      >
        {{ tab.title }}
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.lcars-tab-bar {
  display: flex;
  align-items: stretch;
  height: 48px;
  position: relative;

  &__left-cap {
    width: 40px;
    background-color: $color-purple;
    border-radius: $radius-lcars-corner 0 0 $radius-lcars-corner;
  }

  &__right-cap {
    width: 40px;
    background-color: $color-purple;
    border-radius: 0 $radius-lcars-corner $radius-lcars-corner 0;
  }

  &__tabs {
    display: flex;
    gap: 4px;
    background-color: $color-purple;
    padding: 0 4px;
    align-items: center;
  }

  &__tab {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 $space-lg;
    height: 36px;
    background-color: $color-purple-dark;
    color: $color-white;
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    border: none;
    border-radius: $radius-pill;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
    white-space: nowrap;

    &:hover {
      background-color: $color-gold;
      color: $color-black;
    }

    &--active {
      background-color: $color-gold;
      color: $color-black;
    }

    &--overflow {
      background-color: $color-purple-dim;
      
      &:hover,
      &.lcars-tab-bar__tab--active {
        background-color: $color-gold-dark;
      }
    }
  }

  &__overflow-menu {
    position: absolute;
    top: 100%;
    right: 40px;
    margin-top: $space-xs;
    background-color: $color-black-panel;
    border: 2px solid $color-purple;
    border-radius: $radius-md;
    padding: $space-xs;
    display: flex;
    flex-direction: column;
    gap: $space-xs;
    min-width: 150px;
    z-index: 100;
  }

  &__overflow-item {
    display: flex;
    align-items: center;
    padding: $space-sm $space-md;
    background-color: $color-purple-dark;
    color: $color-white;
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: $color-gold;
      color: $color-black;
    }

    &--active {
      background-color: $color-gold;
      color: $color-black;
    }
  }
}
</style>
