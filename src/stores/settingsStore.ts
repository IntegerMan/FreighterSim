import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'spacefreighter-settings';

/**
 * Proximity radar UI options
 */
export interface ProximityUIOptions {
  showOverlay: boolean;
  displayScale: number; // fraction of sensor range shown on radar (0-1)
}

interface SettingsData {
  showRadarOverlay: boolean;
  proximityDisplayScale: number;
}

/**
 * Settings store - manages persistent UI preferences
 */
export const useSettingsStore = defineStore('settings', () => {
  // Proximity radar UI options
  const showRadarOverlay = ref(false);
  const proximityDisplayScale = ref(0.25); // 25% of sensor range by default

  /**
   * Load settings from localStorage
   */
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: SettingsData = JSON.parse(saved);
        showRadarOverlay.value = data.showRadarOverlay ?? false;
        proximityDisplayScale.value = data.proximityDisplayScale ?? 0.25;
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
  }

  /**
   * Save settings to localStorage
   */
  function saveSettings() {
    try {
      const data: SettingsData = {
        showRadarOverlay: showRadarOverlay.value,
        proximityDisplayScale: proximityDisplayScale.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }

  /**
   * Toggle radar overlay visibility
   */
  function toggleRadarOverlay() {
    showRadarOverlay.value = !showRadarOverlay.value;
    saveSettings();
  }

  /**
   * Set radar overlay visibility
   */
  function setRadarOverlay(value: boolean) {
    showRadarOverlay.value = value;
    saveSettings();
  }

  /**
   * Set proximity display scale
   */
  function setProximityDisplayScale(value: number) {
    proximityDisplayScale.value = Math.max(0.1, Math.min(1.0, value));
    saveSettings();
  }

  // Load settings on store initialization
  loadSettings();

  // Watch for changes and auto-save
  watch(showRadarOverlay, () => {
    saveSettings();
  });

  watch(proximityDisplayScale, () => {
    saveSettings();
  });

  return {
    // State
    showRadarOverlay,
    proximityDisplayScale,
    // Actions
    loadSettings,
    saveSettings,
    toggleRadarOverlay,
    setRadarOverlay,
    setProximityDisplayScale,
  };
});
