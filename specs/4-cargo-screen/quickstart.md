# Quickstart: Cargo Screen Feature

**Feature Branch**: `SKY-4-CargoScreen`  
**Date**: January 22, 2026

## Overview

This feature adds a Cargo Screen to the Space Freighter Sim, allowing players to view their cargo bay inventory and available capacity through a visual 2D grid interface.

## Prerequisites

- Node.js 18+
- pnpm (or npm)
- VS Code with Volar extension

## Getting Started

```bash
# Clone and checkout feature branch
git clone https://github.com/IntegerMan/TakeTheSky.git
cd TakeTheSky
git checkout SKY-4-CargoScreen

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Feature Components

### New Files to Create

| File | Purpose |
|------|---------|
| `src/models/CargoItem.ts` | Cargo item interface and types |
| `src/models/CargoBay.ts` | Cargo bay subsystem interface |
| `src/stores/cargoStore.ts` | Cargo state management |
| `src/stores/cargoStore.test.ts` | Unit tests for cargo store |
| `src/components/panels/CargoPanel.vue` | Cargo info display panel |
| `src/views/CargoView.vue` | Main cargo screen view |
| `e2e/cargo.spec.ts` | End-to-end tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/models/Ship.ts` | Add cargoBay subsystem |
| `src/models/index.ts` | Export new models |
| `src/stores/index.ts` | Export cargoStore |
| `src/stores/shipStore.ts` | Initialize cargoBay |
| `src/components/panels/index.ts` | Export CargoPanel |
| `src/views/index.ts` | Export CargoView |
| `src/router/index.ts` | Add /cargo route |

## Key Patterns

### 1. Ship Subsystem Pattern (ADR-0008)

```typescript
// CargoBay follows existing subsystem pattern
export interface CargoBay {
  width: number;
  depth: number;
  items: CargoItem[];
}

// Add to Ship interface
export interface Ship {
  // ... existing fields
  cargoBay: CargoBay;
}
```

### 2. Pinia Store Pattern

```typescript
// cargoStore provides computed access to shipStore.cargoBay
export const useCargoStore = defineStore('cargo', () => {
  const shipStore = useShipStore();
  
  const items = computed(() => shipStore.cargoBay.items);
  const totalSlots = computed(() => 
    shipStore.cargoBay.width * shipStore.cargoBay.depth
  );
  
  // ... actions mutate shipStore.cargoBay.items
});
```

### 3. Canvas Grid Rendering

```typescript
// Draw cargo grid on Canvas
function drawGrid(ctx: CanvasRenderingContext2D, items: CargoItem[], width: number, depth: number) {
  const slotSize = 40;
  const padding = 2;
  
  // Draw empty slots
  for (let row = 0; row < depth; row++) {
    for (let col = 0; col < width; col++) {
      drawSlot(ctx, col, row, slotSize, padding, null);
    }
  }
  
  // Draw cargo items
  items.forEach((item, index) => {
    const col = index % width;
    const row = Math.floor(index / width);
    drawSlot(ctx, col, row, slotSize, padding, item);
  });
}
```

### 4. Route Integration

```typescript
// Add to router/index.ts
{ 
  path: '/cargo', 
  name: 'cargo', 
  component: () => import('@/views/CargoView.vue'),
  meta: { title: 'Cargo', order: 4 }
}
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run cargo-specific tests
pnpm test -- cargoStore

# Watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Run Playwright tests
pnpm test:e2e

# Run cargo-specific E2E
pnpm test:e2e -- cargo
```

### Manual Testing Checklist

- [ ] Navigate to /cargo from stations list
- [ ] Empty cargo bay shows "NO CARGO LOADED"
- [ ] Loaded cargo displays in grid
- [ ] Capacity indicator shows correct percentage
- [ ] Multiple cargo types have distinct colors
- [ ] Grid updates when cargo changes

## LCARS Design Guidelines

Follow ADR-0005 for visual consistency:

```scss
// Cargo type colors
$cargo-mineral: $color-gold;
$cargo-supply: $color-white;
$cargo-hazmat: $color-danger;
$cargo-equipment: $color-purple;
$cargo-luxury: $color-success;
```

## Architecture Decisions

- **ADR-0005**: LCARS design system for all UI components
- **ADR-0008**: Ship composition pattern for subsystems

## Related Documentation

- [Feature Spec](spec.md)
- [Implementation Plan](plan.md)
- [Research](research.md)
- [Data Model](data-model.md)
- [Store API Contract](contracts/cargo-store-api.ts)
