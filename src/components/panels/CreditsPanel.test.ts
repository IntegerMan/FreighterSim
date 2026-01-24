import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores';
import CreditsPanel from './CreditsPanel.vue';

describe('CreditsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should display formatted credits after initialization', () => {
    const store = useGameStore();
    store.initialize('sol');

    const wrapper = mount(CreditsPanel);
    expect(wrapper.text()).toContain('10,000');
    expect(wrapper.text()).toContain('BALANCE');
  });

  it('should display zero credits correctly', () => {
    const store = useGameStore();
    // Don't initialize, credits should be 0

    const wrapper = mount(CreditsPanel);
    expect(wrapper.text()).toContain('0');
    expect(wrapper.text()).toContain('BALANCE');
  });

  it('should update when credits change', async () => {
    const store = useGameStore();
    store.initialize('sol');

    const wrapper = mount(CreditsPanel);
    expect(wrapper.text()).toContain('10,000');

    store.credits = 50_000;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('50,000');
  });

  it('should have status panel styling classes', () => {
    const store = useGameStore();
    store.initialize('sol');

    const wrapper = mount(CreditsPanel);
    expect(wrapper.find('.status-panel__value').exists()).toBe(true);
    expect(wrapper.find('.status-panel__label').exists()).toBe(true);
  });
});
