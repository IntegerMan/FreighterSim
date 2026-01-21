import { ref, onMounted, onUnmounted, readonly, type Ref } from 'vue';
import { getGameLoop } from './GameLoop';
import type { GameTime } from './GameTime';

/**
 * Composable for accessing the game loop in Vue components
 */
export function useGameLoop() {
  const gameLoop = getGameLoop();
  const gameTime = ref<GameTime>(gameLoop.getGameTime());
  const isRunning = ref(gameLoop.isRunning());
  const isPaused = ref(gameLoop.isPaused());
  const timeScale = ref(gameLoop.getTimeScale());

  let unsubscribe: (() => void) | null = null;

  function updateState(gt: GameTime) {
    gameTime.value = { ...gt };
    isPaused.value = gt.paused;
    timeScale.value = gt.timeScale;
  }

  onMounted(() => {
    unsubscribe = gameLoop.subscribe(updateState);
    isRunning.value = gameLoop.isRunning();
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function start() {
    gameLoop.start();
    isRunning.value = true;
  }

  function stop() {
    gameLoop.stop();
    isRunning.value = false;
  }

  function pause() {
    gameLoop.pause();
    isPaused.value = true;
  }

  function resume() {
    gameLoop.resume();
    isPaused.value = false;
  }

  function setTimeScale(scale: number) {
    gameLoop.setTimeScale(scale);
    timeScale.value = scale;
  }

  return {
    gameTime: readonly(gameTime) as Readonly<Ref<GameTime>>,
    isRunning: readonly(isRunning),
    isPaused: readonly(isPaused),
    timeScale: readonly(timeScale),
    start,
    stop,
    pause,
    resume,
    setTimeScale,
    subscribe: (callback: (gt: GameTime) => void) => gameLoop.subscribe(callback),
  };
}
