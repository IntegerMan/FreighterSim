/**
 * Pinia store for renderer state and performance metrics.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RendererCapability } from '../core/rendering/capabilities';
import type { PerformanceProfile } from '../models/PerformanceProfile';
import { DEFAULT_PERFORMANCE_PROFILE } from '../models/PerformanceProfile';

export type ThrottlingStage = 'none' | 'particles' | 'effects' | 'resolution';

export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  
  /** 95th percentile frame time in milliseconds */
  frameTimeP95Ms: number;
  
  /** Memory usage in megabytes */
  memoryMB: number;
  
  /** Current particle count */
  particleCount: number;
  
  /** Current effects intensity (0-1) */
  effectsIntensity: number;
  
  /** Current throttling stage */
  throttlingStage: ThrottlingStage;
}

export const useRendererStore = defineStore('renderer', () => {
  // Renderer capability
  const capability = ref<RendererCapability>('None');
  const fallbackReason = ref<string | null>(null);

  // Performance profile
  const performanceProfile = ref<PerformanceProfile>({ ...DEFAULT_PERFORMANCE_PROFILE });

  // Performance metrics
  const metrics = ref<PerformanceMetrics>({
    fps: 0,
    frameTimeP95Ms: 0,
    memoryMB: 0,
    particleCount: 0,
    effectsIntensity: 1,
    throttlingStage: 'none',
  });

  // Renderer state
  const initialized = ref(false);
  const contextLost = ref(false);
  const contextLossCount = ref(0);
  const lastContextLossTime = ref<number | null>(null);

  // Computed
  const isWebGL = computed(() => 
    capability.value === 'WebGL2' || capability.value === 'WebGL1'
  );

  const isThrottling = computed(() => 
    metrics.value.throttlingStage !== 'none'
  );

  const canRecover = computed(() => {
    if (!lastContextLossTime.value) return true;
    
    const now = Date.now();
    const elapsed = (now - lastContextLossTime.value) / 1000;
    
    return (
      contextLossCount.value < performanceProfile.value.contextLossPolicy.autoRecoveryAttempts ||
      elapsed > performanceProfile.value.contextLossPolicy.repeatWindowSec
    );
  });

  // Actions
  function setCapability(cap: RendererCapability, reason: string | null = null) {
    capability.value = cap;
    fallbackReason.value = reason;
  }

  function setInitialized(value: boolean) {
    initialized.value = value;
  }

  function updateMetrics(newMetrics: Partial<PerformanceMetrics>) {
    metrics.value = { ...metrics.value, ...newMetrics };
  }

  function setThrottlingStage(stage: ThrottlingStage) {
    metrics.value.throttlingStage = stage;
  }

  function reportContextLoss() {
    contextLost.value = true;
    contextLossCount.value++;
    lastContextLossTime.value = Date.now();
  }

  function reportContextRestored() {
    contextLost.value = false;
  }

  function resetContextLossTracking() {
    contextLossCount.value = 0;
    lastContextLossTime.value = null;
  }

  function updatePerformanceProfile(profile: Partial<PerformanceProfile>) {
    performanceProfile.value = { ...performanceProfile.value, ...profile };
  }

  return {
    // State
    capability,
    fallbackReason,
    performanceProfile,
    metrics,
    initialized,
    contextLost,
    contextLossCount,
    lastContextLossTime,
    
    // Computed
    isWebGL,
    isThrottling,
    canRecover,
    
    // Actions
    setCapability,
    setInitialized,
    updateMetrics,
    setThrottlingStage,
    reportContextLoss,
    reportContextRestored,
    resetContextLossTracking,
    updatePerformanceProfile,
  };
});
