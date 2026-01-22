<script setup lang="ts">
export type ButtonColor = 'purple' | 'gold' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  label?: string;
  color?: ButtonColor;
  size?: ButtonSize;
  disabled?: boolean;
  active?: boolean;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'purple',
  size: 'md',
  disabled: false,
  active: false,
  fullWidth: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    class="lcars-button"
    :class="[
      `lcars-button--${color}`,
      `lcars-button--${size}`,
      { 
        'lcars-button--disabled': disabled,
        'lcars-button--active': active,
        'lcars-button--full-width': fullWidth,
      }
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
@use 'sass:color';

.lcars-button {
  font-family: $font-display;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
  border-radius: $radius-pill;
  cursor: pointer;
  transition: all $transition-fast;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  white-space: nowrap;

  // Sizes
  &--sm {
    font-size: $font-size-xs;
    padding: $space-xs $space-md;
    min-height: 28px;
  }

  &--md {
    font-size: $font-size-sm;
    padding: $space-sm $space-lg;
    min-height: 36px;
  }

  &--lg {
    font-size: $font-size-md;
    padding: $space-md $space-xl;
    min-height: 44px;
  }

  // Colors
  &--purple {
    background-color: $color-purple;
    color: $color-black;

    &:hover:not(:disabled) {
      background-color: $color-purple-light;
    }

    &:active:not(:disabled),
    &.lcars-button--active {
      background-color: $color-purple-dark;
    }
  }

  &--gold {
    background-color: $color-gold;
    color: $color-black;

    &:hover:not(:disabled) {
      background-color: $color-gold-light;
    }

    &:active:not(:disabled),
    &.lcars-button--active {
      background-color: $color-gold-dark;
    }
  }

  &--danger {
    background-color: $color-danger;
    color: $color-black;

    &:hover:not(:disabled) {
      background-color: color.scale($color-danger, $lightness: 10%);
    }

    &:active:not(:disabled),
    &.lcars-button--active {
      background-color: $color-danger-dim;
    }
  }

  &--success {
    background-color: $color-success;
    color: $color-black;

    &:hover:not(:disabled) {
      background-color: color.scale($color-success, $lightness: 10%);
    }

    &:active:not(:disabled),
    &.lcars-button--active {
      background-color: $color-success-dim;
    }
  }

  &--warning {
    background-color: $color-warning;
    color: $color-black;

    &:hover:not(:disabled) {
      background-color: color.scale($color-warning, $lightness: 10%);
    }

    &:active:not(:disabled),
    &.lcars-button--active {
      background-color: $color-warning-dim;
    }
  }

  // States
  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--full-width {
    width: 100%;
  }

  &:focus-visible {
    outline: 2px solid $color-white;
    outline-offset: 2px;
  }
}
</style>
