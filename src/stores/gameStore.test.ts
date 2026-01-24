import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore, INITIAL_CREDITS } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('credits', () => {
    it('should start with 0 credits before initialization', () => {
      const store = useGameStore();
      expect(store.credits).toBe(0);
    });

    it('should initialize with 10,000 credits', () => {
      const store = useGameStore();
      store.initialize('sol');
      expect(store.credits).toBe(INITIAL_CREDITS);
      expect(store.credits).toBe(10_000);
    });

    it('should reset credits to 0', () => {
      const store = useGameStore();
      store.initialize('sol');
      expect(store.credits).toBe(10_000);
      store.reset();
      expect(store.credits).toBe(0);
    });

    it('should format credits with thousands separators', () => {
      const store = useGameStore();
      store.initialize('sol');
      expect(store.formattedCredits).toBe('10,000');
    });

    it('should format zero credits correctly', () => {
      const store = useGameStore();
      expect(store.formattedCredits).toBe('0');
    });

    it('should format large credit values correctly', () => {
      const store = useGameStore();
      store.initialize('sol');
      store.credits = 999_999_999;
      expect(store.formattedCredits).toBe('999,999,999');
    });

    it('should export INITIAL_CREDITS constant as 10,000', () => {
      expect(INITIAL_CREDITS).toBe(10_000);
    });
  });
});
