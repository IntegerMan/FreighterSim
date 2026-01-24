# Quickstart: Player Credits System

**Feature**: 005-player-credits  
**Date**: January 23, 2026

## Overview

This guide covers implementing the Player Credits System - adding credits state to the game store and displaying it on Bridge and Cargo screens.

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- Familiarity with Vue 3 Composition API and Pinia

## Implementation Order

Follow this order to maintain test-first development:

1. **Store Tests** → Write tests for credits state
2. **Store Implementation** → Add credits to gameStore
3. **Component Tests** → Write tests for CreditsPanel
4. **Component Implementation** → Create CreditsPanel.vue
5. **View Integration** → Add CreditsPanel to BridgeView and CargoView
6. **E2E Tests** → Verify end-to-end behavior

---

## Step 1: Store Tests

Create tests in `src/stores/gameStore.test.ts`:

```typescript
describe('credits', () => {
  it('should initialize with 10,000 credits', () => {
    const store = useGameStore();
    store.initialize('sol');
    expect(store.credits).toBe(10_000);
  });

  it('should reset credits to 0', () => {
    const store = useGameStore();
    store.initialize('sol');
    store.reset();
    expect(store.credits).toBe(0);
  });

  it('should format credits with thousands separators', () => {
    const store = useGameStore();
    store.initialize('sol');
    expect(store.formattedCredits).toBe('10,000');
  });
});
```

---

## Step 2: Store Implementation

Add to `src/stores/gameStore.ts`:

```typescript
// Constants
const INITIAL_CREDITS = 10_000;

// In the store definition:
const credits = ref(0);

const formattedCredits = computed(() => 
  new Intl.NumberFormat('en-US').format(credits.value)
);

function initialize(systemId: string) {
  currentSystemId.value = systemId;
  isInitialized.value = true;
  elapsedTime.value = 0;
  credits.value = INITIAL_CREDITS; // ADD THIS
}

function reset() {
  isInitialized.value = false;
  currentSystemId.value = null;
  elapsedTime.value = 0;
  timeScale.value = 1;
  isPaused.value = false;
  credits.value = 0; // ADD THIS
}

// Export in return statement:
return {
  // ... existing exports
  credits,
  formattedCredits,
};
```

---

## Step 3: Component Tests

Create `src/components/panels/CreditsPanel.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores';
import CreditsPanel from './CreditsPanel.vue';

describe('CreditsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should display formatted credits', () => {
    const store = useGameStore();
    store.initialize('sol');
    
    const wrapper = mount(CreditsPanel);
    expect(wrapper.text()).toContain('10,000');
    expect(wrapper.text()).toContain('Credits');
  });

  it('should display zero credits correctly', () => {
    const store = useGameStore();
    store.credits = 0;
    
    const wrapper = mount(CreditsPanel);
    expect(wrapper.text()).toContain('0');
  });
});
```

---

## Step 4: Component Implementation

Create `src/components/panels/CreditsPanel.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores';
import { LcarsFrame } from '@/components/ui';

const gameStore = useGameStore();
const formattedCredits = computed(() => gameStore.formattedCredits);
</script>

<template>
  <LcarsFrame title="Credits" color="gold">
    <div class="credits-panel">
      <span class="credits-panel__amount">{{ formattedCredits }}</span>
      <span class="credits-panel__label">Credits</span>
    </div>
  </LcarsFrame>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.credits-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-md;
  gap: $space-xs;

  &__amount {
    font-family: $font-mono;
    font-size: $font-size-xl;
    color: $color-gold;
    letter-spacing: 0.05em;
  }

  &__label {
    font-family: $font-display;
    font-size: $font-size-xs;
    color: $color-gray;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
}
</style>
```

---

## Step 5: View Integration

### BridgeView.vue

Add import:
```typescript
import { CreditsPanel } from '@/components/panels';
```

Add component above NavigationPanel in left-panels:
```vue
<div class="bridge-view__left-panels">
  <div class="bridge-view__panel">
    <CreditsPanel />
  </div>
  <div class="bridge-view__panel">
    <NavigationPanel />
  </div>
</div>
```

### CargoView.vue

Add import:
```typescript
import { CreditsPanel } from '@/components/panels';
```

Add component above CargoPanel in left-panels:
```vue
<div class="cargo-view__left-panels">
  <div class="cargo-view__panel">
    <CreditsPanel />
  </div>
  <div class="cargo-view__panel cargo-view__panel--grow">
    <CargoPanel />
  </div>
</div>
```

---

## Step 6: E2E Tests

Create `e2e/credits.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Player Credits', () => {
  test('should display 10,000 credits on Bridge screen', async ({ page }) => {
    await page.goto('/bridge');
    await expect(page.getByText('10,000')).toBeVisible();
    await expect(page.getByText('Credits')).toBeVisible();
  });

  test('should display same credits on Cargo screen', async ({ page }) => {
    await page.goto('/cargo');
    await expect(page.getByText('10,000')).toBeVisible();
    await expect(page.getByText('Credits')).toBeVisible();
  });

  test('should maintain credits when navigating between screens', async ({ page }) => {
    await page.goto('/bridge');
    await expect(page.getByText('10,000')).toBeVisible();
    
    await page.goto('/cargo');
    await expect(page.getByText('10,000')).toBeVisible();
    
    await page.goto('/bridge');
    await expect(page.getByText('10,000')).toBeVisible();
  });
});
```

---

## Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Run specific test file
pnpm test src/stores/gameStore.test.ts
```

---

## Verification Checklist

- [ ] `pnpm test` passes all unit tests
- [ ] `pnpm test:e2e` passes all E2E tests
- [ ] Credits display shows "10,000 Credits" on Bridge
- [ ] Credits display shows "10,000 Credits" on Cargo
- [ ] Navigation between screens maintains credit value
- [ ] LCARS styling is consistent (gold color, proper fonts)
