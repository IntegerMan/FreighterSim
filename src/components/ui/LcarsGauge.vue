<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  value: number;
  max?: number;
  min?: number;
  showValue?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  min: 0,
  showValue: true,
  warningThreshold: 25,
  dangerThreshold: 10,
  unit: '',
});

const percentage = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((props.value - props.min) / range) * 100;
});

const statusClass = computed(() => {
  const pct = percentage.value;
  if (pct <= props.dangerThreshold) return 'danger';
  if (pct <= props.warningThreshold) return 'warning';
  return 'normal';
});

const displayValue = computed(() => {
  return props.value.toFixed(0) + (props.unit ? ` ${props.unit}` : '');
});
</script>

<template>
  <div class="lcars-gauge">
    <div class="lcars-gauge__header">
      <span class="lcars-gauge__label">{{ label }}</span>
      <span v-if="showValue" class="lcars-gauge__value" :class="`lcars-gauge__value--${statusClass}`">
        {{ displayValue }}
      </span>
    </div>
    <div class="lcars-gauge__track">
      <div 
        class="lcars-gauge__fill" 
        :class="`lcars-gauge__fill--${statusClass}`"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.lcars-gauge {
  display: flex;
  flex-direction: column;
  gap: $space-xs;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__value {
    font-family: $font-mono;
    font-size: $font-size-sm;
    
    &--normal {
      color: $color-gold;
    }

    &--warning {
      color: $color-warning;
    }

    &--danger {
      color: $color-danger;
    }
  }

  &__track {
    height: 8px;
    background-color: $color-gray-dark;
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: $radius-pill;
    transition: width $transition-normal, background-color $transition-fast;

    &--normal {
      background-color: $color-gold;
    }

    &--warning {
      background-color: $color-warning;
    }

    &--danger {
      background-color: $color-danger;
    }
  }
}
</style>
