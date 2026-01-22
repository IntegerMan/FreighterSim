<script setup lang="ts">
import { LcarsButton } from '@/components/ui';

export type SensorMode = 'radar' | 'particles';

const modelValue = defineModel<SensorMode>({ required: true });

function selectMode(mode: SensorMode) {
  modelValue.value = mode;
}
</script>

<template>
  <div class="sensor-mode-selector">
    <LcarsButton
      size="sm"
      :color="modelValue === 'radar' ? 'gold' : 'purple'"
      :active="modelValue === 'radar'"
      @click="selectMode('radar')"
    >
      RADAR
    </LcarsButton>
    <LcarsButton
      size="sm"
      :color="modelValue === 'particles' ? 'gold' : 'purple'"
      :active="modelValue === 'particles'"
      @click="selectMode('particles')"
    >
      PARTICLES
    </LcarsButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.sensor-mode-selector {
  display: flex;
  gap: $space-sm;
}
</style>
