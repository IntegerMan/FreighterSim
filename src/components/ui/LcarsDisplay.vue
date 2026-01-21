<script setup lang="ts">
interface Props {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  size: 'md',
});
</script>

<template>
  <div class="lcars-display" :class="`lcars-display--${size}`">
    <span class="lcars-display__label">{{ label }}</span>
    <span class="lcars-display__value">
      {{ value }}<span v-if="unit" class="lcars-display__unit">{{ unit }}</span>
    </span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.lcars-display {
  display: flex;
  flex-direction: column;
  gap: $space-xs;

  &__label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__value {
    font-family: $font-mono;
    color: $color-gold;
    letter-spacing: 0.05em;
  }

  &__unit {
    font-size: 0.75em;
    color: $color-gray;
    margin-left: $space-xs;
  }

  // Sizes
  &--sm {
    .lcars-display__value {
      font-size: $font-size-md;
    }
  }

  &--md {
    .lcars-display__value {
      font-size: $font-size-lg;
    }
  }

  &--lg {
    .lcars-display__value {
      font-size: $font-size-xl;
    }
  }
}
</style>
