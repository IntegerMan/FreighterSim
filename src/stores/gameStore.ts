import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameTime, TimeScale } from '@/core/game-loop';
import { TIME_SCALES } from '@/core/game-loop';

/** Initial credit balance for new game sessions */
export const INITIAL_CREDITS = 10_000;

/**
 * Game state store - manages overall game state, time, and session
 */
export const useGameStore = defineStore('game', () => {
  // Time state
  const timeScale = ref<TimeScale>(1);
  const isPaused = ref(false);
  const elapsedTime = ref(0);

  // Session state
  const isInitialized = ref(false);
  const currentSystemId = ref<string | null>(null);

  // Credits state
  const credits = ref(0);

  // Computed
  const formattedTime = computed(() => {
    const hours = Math.floor(elapsedTime.value / 3600);
    const minutes = Math.floor((elapsedTime.value % 3600) / 60);
    const seconds = Math.floor(elapsedTime.value % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  const availableTimescales = computed(() => TIME_SCALES);

  const formattedCredits = computed(() =>
    new Intl.NumberFormat('en-US').format(credits.value)
  );

  // Actions
  function setTimeScale(scale: TimeScale) {
    timeScale.value = scale;
  }

  function cycleTimeScale() {
    const currentIndex = TIME_SCALES.indexOf(timeScale.value);
    const nextIndex = (currentIndex + 1) % TIME_SCALES.length;
    timeScale.value = TIME_SCALES[nextIndex] ?? 1;
  }

  function pause() {
    isPaused.value = true;
  }

  function resume() {
    isPaused.value = false;
  }

  function togglePause() {
    isPaused.value = !isPaused.value;
  }

  function update(gameTime: GameTime) {
    elapsedTime.value = gameTime.elapsed;
    isPaused.value = gameTime.paused;
    timeScale.value = gameTime.timeScale as TimeScale;
  }

  function initialize(systemId: string) {
    currentSystemId.value = systemId;
    isInitialized.value = true;
    elapsedTime.value = 0;
    credits.value = INITIAL_CREDITS;
  }

  function reset() {
    isInitialized.value = false;
    currentSystemId.value = null;
    elapsedTime.value = 0;
    timeScale.value = 1;
    isPaused.value = false;
    credits.value = 0;
  }

  return {
    // State
    timeScale,
    isPaused,
    elapsedTime,
    isInitialized,
    currentSystemId,
    credits,
    // Computed
    formattedTime,
    availableTimescales,
    formattedCredits,
    // Actions
    setTimeScale,
    cycleTimeScale,
    pause,
    resume,
    togglePause,
    update,
    initialize,
    reset,
  };
});
