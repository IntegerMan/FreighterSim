# Data Model: Player Credits System

**Feature**: 005-player-credits  
**Date**: January 23, 2026

## Entities

### Credits (Session State)

**Description**: The player's available currency balance, used for purchasing cargo, ship upgrades, repairs, and contracts.

**Location**: `src/stores/gameStore.ts` (extends existing store)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `credits` | `number` | Min: 0, Max: 999,999,999, Default: 10,000 | Player's current credit balance |

**State Transitions**:

```
[New Game] → credits = 10,000 (via initialize())
[Spend]    → credits -= amount (via future spendCredits())
[Earn]     → credits += amount (via future earnCredits())
[Reset]    → credits = 0 (via reset())
```

**Validation Rules**:
- Credits MUST be a non-negative integer (future: may allow negative for debt)
- Credits MUST NOT exceed 999,999,999 (display formatting limit)
- Initial value MUST be exactly 10,000 for new sessions

---

### CreditsPanel (UI Component)

**Description**: A reusable Vue component that displays the current credit balance with LCARS styling.

**Location**: `src/components/panels/CreditsPanel.vue`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| N/A  | N/A  | N/A      | N/A     | No props - reads directly from gameStore |

**Computed Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `formattedCredits` | `string` | Credits formatted with thousands separators |

**Emits**: None

**Slots**: None

---

## Relationships

```
┌─────────────────┐         ┌─────────────────┐
│   gameStore     │◄────────│  CreditsPanel   │
│                 │  reads  │                 │
│  credits: number│         │  formattedCredits│
│  initialize()   │         │                 │
│  reset()        │         └────────┬────────┘
└─────────────────┘                  │
        ▲                            │
        │                   ┌────────┴────────┐
        │                   │                 │
┌───────┴───────┐   ┌───────┴───────┐  ┌──────┴──────┐
│  BridgeView   │   │   CargoView   │  │ Future Views│
│               │   │               │  │             │
│ <CreditsPanel>│   │ <CreditsPanel>│  │             │
└───────────────┘   └───────────────┘  └─────────────┘
```

---

## Type Definitions

```typescript
// Extends existing gameStore state
interface GameState {
  // Existing fields
  timeScale: TimeScale;
  isPaused: boolean;
  elapsedTime: number;
  isInitialized: boolean;
  currentSystemId: string | null;
  
  // NEW: Credits field
  credits: number;
}

// Constants
const INITIAL_CREDITS = 10_000;
const MAX_CREDITS = 999_999_999;
```

---

## Display Formatting

| Value | Formatted Output |
|-------|------------------|
| 10000 | "10,000 Credits" |
| 0 | "0 Credits" |
| 999999999 | "999,999,999 Credits" |
| -500 | "-500 Credits" (future debt feature) |

**Formatting Function**:
```typescript
function formatCredits(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}
```

---

## Persistence

**Current Implementation**: Session-based (in-memory via Pinia)
- Credits initialized on `gameStore.initialize()`
- Credits reset to 0 on `gameStore.reset()`
- No persistence between browser sessions

**Future Consideration**: When save/load is implemented, credits will be included in the serialized game state.
