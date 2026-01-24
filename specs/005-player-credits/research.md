# Research: Player Credits System

**Feature**: 005-player-credits  
**Date**: January 23, 2026

## Research Tasks & Findings

### 1. State Management Pattern for Credits

**Question**: Should credits extend `gameStore.ts` or have a dedicated `creditsStore.ts`?

**Decision**: Extend `gameStore.ts`

**Rationale**: 
- Credits are session-level state, same as `elapsedTime`, `isInitialized`, and `currentSystemId`
- Avoids proliferation of small stores for related session data
- Follows the spec clarification that credits belong with "session-level state alongside existing session data"
- Future economy features can still be added to `gameStore` or split out later if complexity warrants

**Alternatives Considered**:
- Dedicated `creditsStore.ts`: Rejected because credits are fundamentally session state, not a separate domain
- Storing in `shipStore.ts`: Rejected because credits belong to the player, not the ship (future multi-ship scenarios)

---

### 2. Number Formatting Best Practice

**Question**: How should large credit values be formatted for display?

**Decision**: Use `Intl.NumberFormat` with locale-aware thousands separators

**Rationale**:
- Built-in JavaScript API, no external dependencies
- Respects user's locale for proper number formatting
- Handles edge cases (0, negative values) gracefully
- Consistent with web standards

**Implementation**:
```typescript
const formatCredits = (amount: number): string => {
  return new Intl.NumberFormat('en-US').format(amount);
};
// 10000 → "10,000"
// 999999999 → "999,999,999"
```

**Alternatives Considered**:
- Manual regex replacement: Rejected due to complexity with edge cases
- External library (numeral.js): Rejected as overkill for simple formatting

---

### 3. Component Reusability Pattern

**Question**: How should `CreditsPanel.vue` be structured for reuse across screens?

**Decision**: Single component with computed formatting, using existing `LcarsFrame` wrapper

**Rationale**:
- Matches existing panel pattern (e.g., `CargoPanel.vue`, `NavigationPanel.vue`)
- `LcarsFrame` provides consistent header and border styling
- Component subscribes to `gameStore.credits` directly via composition API
- No props needed for the credit value (single source of truth from store)

**Implementation Pattern**:
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores';
import { LcarsFrame } from '@/components/ui';

const gameStore = useGameStore();
const formattedCredits = computed(() => 
  new Intl.NumberFormat('en-US').format(gameStore.credits)
);
</script>

<template>
  <LcarsFrame title="Credits" color="gold">
    <div class="credits-panel">
      <span class="credits-panel__amount">{{ formattedCredits }}</span>
      <span class="credits-panel__label">Credits</span>
    </div>
  </LcarsFrame>
</template>
```

---

### 4. LCARS Design Integration

**Question**: What styling should be applied to the credits display?

**Decision**: Gold color scheme with monospace numerals, consistent with existing financial/value displays

**Rationale**:
- Gold (`$color-gold`) is the established color for important values and status
- Monospace font (`$font-mono`) ensures consistent digit alignment
- Matches the styling used in `LcarsDisplay.vue` for values
- Spec explicitly requests "gold/amber color scheme for financial information"

**Styling Approach**:
- Frame color: `gold`
- Amount: `$color-gold`, `$font-mono`, `$font-size-xl`
- Label: `$color-gray`, `$font-display`, uppercase

---

### 5. Testing Strategy

**Question**: What tests are required to meet constitution requirements?

**Decision**: Unit tests for store + component tests + E2E tests

**Rationale**:
- Constitution requires test-first development
- Core game systems require ≥90% coverage (store logic)
- Components require ≥70% coverage

**Test Coverage Plan**:

| Layer | File | Coverage Target |
|-------|------|-----------------|
| Store | `gameStore.test.ts` | ≥90% for credits logic |
| Component | `CreditsPanel.test.ts` | ≥70% |
| E2E | `credits.spec.ts` | All acceptance scenarios |

**Key Test Cases**:
1. Store initializes with 10,000 credits
2. Credits persist across screen navigation (store state unchanged)
3. Formatter handles 0, negative, and large values
4. Component renders formatted value correctly
5. Component displays on both Bridge and Cargo screens

---

### 6. Edge Case Handling

**Question**: How should the system handle edge cases (zero, negative, overflow)?

**Decision**: Handle gracefully with appropriate display

**Rationale**:
- Spec mentions zero should display clearly
- Spec mentions negative as future debt feature
- Maximum value of 999,999,999 specified in requirements

**Implementation**:
- Zero: Display "0 Credits" (no special styling)
- Negative: Display with negative sign, could add warning styling (future)
- Large numbers: `Intl.NumberFormat` handles formatting automatically
- Type: Use `number` (JavaScript safely handles integers up to 2^53)

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| State location | Extend `gameStore.ts` |
| Number formatting | `Intl.NumberFormat('en-US')` |
| Component pattern | `CreditsPanel.vue` using `LcarsFrame` |
| Color scheme | Gold (`$color-gold`) for values |
| Font | Monospace (`$font-mono`) for digits |
| Testing | Unit (store) + Component + E2E |

## Open Items

None - all technical decisions resolved.
