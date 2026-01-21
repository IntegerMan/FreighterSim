<script setup lang="ts">
export type LcarsColor = 'purple' | 'gold' | 'warning' | 'danger' | 'success';

interface Props {
  title: string;
  color?: LcarsColor;
  noPadding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'purple',
  noPadding: false,
});
</script>

<template>
  <div class="lcars-frame">
    <div class="lcars-frame__header" :class="`lcars-frame__header--${color}`">
      <span class="lcars-frame__title">{{ title }}</span>
      <slot name="header-actions" />
    </div>
    <div class="lcars-frame__content" :class="{ 'lcars-frame__content--no-padding': noPadding }">
      <slot />
    </div>
    <div v-if="$slots.footer" class="lcars-frame__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.lcars-frame {
  background-color: $color-black-panel;
  border: $panel-border-width solid $color-purple;
  border-radius: $radius-lcars-corner;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  &__header {
    background-color: $color-purple;
    color: $color-black;
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: $space-sm $space-md;
    min-height: $panel-header-height;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-md;

    &--gold {
      background-color: $color-gold;
    }

    &--purple {
      background-color: $color-purple;
    }

    &--warning {
      background-color: $color-warning;
    }

    &--danger {
      background-color: $color-danger;
    }

    &--success {
      background-color: $color-success;
    }
  }

  &__title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__content {
    padding: $space-md;
    flex: 1;
    overflow: auto;

    &--no-padding {
      padding: 0;
    }
  }

  &__footer {
    background-color: $color-purple-dim;
    padding: $space-sm $space-md;
    display: flex;
    justify-content: flex-end;
    gap: $space-sm;
  }
}
</style>
