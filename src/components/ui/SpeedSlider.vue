<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  currentSpeed: number;
  targetSpeed: number;
  maxSpeed: number;
  minSpeed?: number;
  disabled?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  minSpeed: -25,
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  setSpeed: [speed: number];
}>();

const sliderRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);

// Total range from min to max
const totalRange = computed(() => props.maxSpeed - props.minSpeed);

// Position of current speed as percentage (0-100)
const currentSpeedPercent = computed(() => {
  return ((props.currentSpeed - props.minSpeed) / totalRange.value) * 100;
});

// Position of target speed as percentage (0-100)
const targetSpeedPercent = computed(() => {
  return ((props.targetSpeed - props.minSpeed) / totalRange.value) * 100;
});

// Zero point position as percentage
const zeroPercent = computed(() => {
  return ((0 - props.minSpeed) / totalRange.value) * 100;
});

// Whether reversing
const isReversing = computed(() => props.targetSpeed < 0 || props.currentSpeed < 0);

// Color based on direction
const speedColor = computed(() => isReversing.value ? '#9966FF' : '#FFCC00');

function getSpeedFromPosition(clientX: number) {
  if (!sliderRef.value) return 0;
  
  const rect = sliderRef.value.getBoundingClientRect();
  const x = clientX - rect.left;
  const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const speed = props.minSpeed + (percent / 100) * totalRange.value;
  
  // Snap to zero if close
  if (Math.abs(speed) < 3) return 0;
  
  return Math.round(speed);
}

function handleClick(event: MouseEvent) {
  if (props.disabled || props.readonly) return;
  const speed = getSpeedFromPosition(event.clientX);
  emit('setSpeed', speed);
}

function handleMouseDown(event: MouseEvent) {
  if (props.disabled || props.readonly) return;
  isDragging.value = true;
  handleClick(event);
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || props.disabled || props.readonly) return;
  const speed = getSpeedFromPosition(event.clientX);
  emit('setSpeed', speed);
}

function handleMouseUp() {
  isDragging.value = false;
}

onMounted(() => {
  globalThis.addEventListener('mousemove', handleMouseMove);
  globalThis.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  globalThis.removeEventListener('mousemove', handleMouseMove);
  globalThis.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div class="speed-slider" :class="{ 'speed-slider--disabled': disabled, 'speed-slider--readonly': readonly, 'speed-slider--reversing': isReversing }">
    <!-- Speed value display -->
    <div class="speed-slider__value">
      <span class="speed-slider__current" :style="{ color: speedColor }">
        {{ currentSpeed.toFixed(0) }}
      </span>
      <span class="speed-slider__unit">u/s</span>
    </div>

    <!-- Slider track -->
    <div 
      ref="sliderRef"
      class="speed-slider__track"
      @mousedown="handleMouseDown"
    >
      <!-- Fill from zero to current speed -->
      <div 
        v-if="currentSpeed >= 0"
        class="speed-slider__fill speed-slider__fill--current"
        :style="{ 
          left: `${zeroPercent}%`, 
          width: `${currentSpeedPercent - zeroPercent}%`,
          backgroundColor: speedColor
        }"
      />
      <div 
        v-else
        class="speed-slider__fill speed-slider__fill--current speed-slider__fill--reverse"
        :style="{ 
          left: `${currentSpeedPercent}%`, 
          width: `${zeroPercent - currentSpeedPercent}%`,
          backgroundColor: speedColor
        }"
      />

      <!-- Target speed marker -->
      <div 
        class="speed-slider__target-marker"
        :style="{ left: `${targetSpeedPercent}%`, borderColor: speedColor }"
      />

      <!-- Zero line -->
      <div class="speed-slider__zero" :style="{ left: `${zeroPercent}%` }" />

      <!-- Tick marks at 0 and 100 -->
      <div class="speed-slider__tick speed-slider__tick--zero" :style="{ left: `${zeroPercent}%` }">0</div>
      <div class="speed-slider__tick speed-slider__tick--max" :style="{ left: '100%' }">{{ maxSpeed }}</div>
      <div class="speed-slider__tick speed-slider__tick--min" :style="{ left: '0%' }">{{ minSpeed }}</div>
    </div>

    <!-- Target display -->
    <div class="speed-slider__target-value">
      Target: <span :style="{ color: speedColor }">{{ targetSpeed.toFixed(0) }}</span> u/s
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.speed-slider {
  display: flex;
  flex-direction: column;
  gap: $space-xs;

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: $space-xs;
  }

  &__current {
    font-family: $font-mono;
    font-size: $font-size-xl;
    font-weight: bold;
    color: $color-gold;
    transition: color 0.2s ease;
  }

  &__unit {
    font-family: $font-mono;
    font-size: $font-size-sm;
    color: $color-gray;
  }

  &__track {
    position: relative;
    height: 24px;
    background-color: $color-gray-dark;
    border-radius: $radius-sm;
    cursor: pointer;
    margin: $space-sm 0;

    &:hover {
      background-color: #4a4a4a;
    }
  }

  &--readonly &__track {
    cursor: default;

    &:hover {
      background-color: $color-gray-dark;
    }
  }

  &__fill {
    position: absolute;
    top: 4px;
    height: 16px;
    border-radius: $radius-sm;
    transition: width 0.1s ease, background-color 0.2s ease;
    pointer-events: none;

    &--current {
      opacity: 0.7;
    }
  }

  &__target-marker {
    position: absolute;
    top: 2px;
    width: 4px;
    height: 20px;
    background-color: transparent;
    border: 2px solid $color-gold;
    border-radius: 2px;
    transform: translateX(-50%);
    transition: left 0.1s ease, border-color 0.2s ease;
    pointer-events: none;
  }

  &__zero {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: $color-white;
    opacity: 0.5;
    transform: translateX(-50%);
    pointer-events: none;
  }

  &__tick {
    position: absolute;
    top: 100%;
    margin-top: 4px;
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
    transform: translateX(-50%);
    pointer-events: none;

    &--zero {
      color: $color-white;
      opacity: 0.8;
    }

    &--max {
      transform: translateX(-100%);
    }

    &--min {
      transform: translateX(0);
    }
  }

  &__target-value {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gray;
    margin-top: $space-xs;
  }
}
</style>
