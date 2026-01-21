import { createPinia, setActivePinia } from 'pinia';
import type { App } from 'vue';

/**
 * Creates a fresh Pinia instance and sets it as active.
 * Use in beforeEach() for store tests.
 */
export function setupTestPinia(): ReturnType<typeof createPinia> {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * Creates a Vue app plugin configuration for testing with Pinia.
 */
export function createTestPlugins(): { plugins: ReturnType<typeof createPinia>[] } {
  return {
    plugins: [createPinia()],
  };
}
