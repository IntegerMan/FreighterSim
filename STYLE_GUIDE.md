# Style Guide

This document defines the coding conventions and UI design patterns for Space Freighter Sim.

## Code Conventions

### TypeScript

#### Interfaces vs Types

- Use **interfaces** for object shapes that may be extended
- Use **types** for unions, intersections, and computed types

```typescript
// ✅ Interface for extendable shapes
interface Station {
  id: string;
  name: string;
  position: Vector2;
}

// ✅ Type for unions
type ContactType = 'station' | 'planet' | 'ship' | 'unknown';

// ✅ Type for computed types
type StationId = Station['id'];
```

#### Discriminated Unions

Use discriminated unions for variant types:

```typescript
// ✅ Good - discriminated union
type Contact = 
  | { type: 'station'; id: string; name: string; services: string[] }
  | { type: 'planet'; id: string; name: string; isScannable: boolean }
  | { type: 'ship'; id: string; faction: string; isHostile: boolean };

// Usage with type narrowing
function getContactLabel(contact: Contact): string {
  switch (contact.type) {
    case 'station': return `Station: ${contact.name}`;
    case 'planet': return `Planet: ${contact.name}`;
    case 'ship': return `Ship: ${contact.faction}`;
  }
}
```

#### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase | `ShipState`, `Vector2` |
| Types | PascalCase | `ContactType`, `StationType` |
| Functions | camelCase | `calculateDistance`, `formatBearing` |
| Constants | UPPER_SNAKE_CASE | `MAX_SPEED`, `DEFAULT_TURN_RATE` |
| Files | kebab-case | `ship-store.ts`, `movement-system.ts` |
| Vue components | PascalCase | `NavigationPanel.vue`, `LcarsButton.vue` |

### Vue Components

#### Composition API

Always use the Composition API with `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useShipStore } from '@/stores/shipStore';

// Props
const props = defineProps<{
  stationId: string;
}>();

// Emits
const emit = defineEmits<{
  dock: [stationId: string];
}>();

// Store
const shipStore = useShipStore();

// Local state
const isHovered = ref(false);

// Computed
const canDock = computed(() => !shipStore.isDocked && shipStore.speed < 5);

// Methods
function handleDock() {
  emit('dock', props.stationId);
}
</script>
```

#### Component Organization

Order sections consistently:

1. `<script setup>` - Logic
2. `<template>` - Markup
3. `<style>` - Styles (scoped)

Within `<script setup>`:

1. Imports
2. Props/Emits
3. Stores/Composables
4. Refs (local state)
5. Computed properties
6. Lifecycle hooks
7. Methods

### Pinia Stores

Use the setup store syntax:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useShipStore = defineStore('ship', () => {
  // State
  const position = ref<Vector2>({ x: 0, y: 0 });
  const heading = ref(0);
  const speed = ref(0);
  
  // Getters (computed)
  const isMoving = computed(() => speed.value > 0);
  
  // Actions
  function setPosition(newPosition: Vector2) {
    position.value = newPosition;
  }
  
  function update(deltaTime: number) {
    // Update logic
  }
  
  return {
    // State
    position,
    heading,
    speed,
    // Getters
    isMoving,
    // Actions
    setPosition,
    update,
  };
});
```

### Testing

#### Test File Naming

- Unit tests: `*.test.ts` (co-located with source)
- E2E tests: `*.spec.ts` (in `/e2e` folder)

#### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ShipStore', () => {
  beforeEach(() => {
    // Setup
  });

  describe('movement', () => {
    it('updates position based on heading and speed', () => {
      // Arrange
      const store = useShipStore();
      store.heading = 90;
      store.speed = 100;
      
      // Act
      store.update(1); // 1 second
      
      // Assert
      expect(store.position.x).toBeCloseTo(100);
      expect(store.position.y).toBeCloseTo(0);
    });
  });
});
```

## UI Design System

### Color Palette

```scss
// Primary colors
$color-purple: #9966FF;       // Labels, section headers within panels
$color-purple-light: #BB99FF; // Hover states
$color-purple-dark: #6633CC;  // Pressed states, dividers

// Secondary colors
$color-gold: #FFCC00;         // Panel headers (LcarsFrame), data values
$color-gold-light: #FFE066;   // Hover states
$color-gold-dark: #CC9900;    // Pressed states

// Neutral colors
$color-white: #FFFFFF;        // Primary text, large data displays
$color-gray: #888888;         // Secondary text, disabled, units
$color-black: #000000;        // Backgrounds
$color-black-light: #1A1A1A;  // Panel backgrounds

// Semantic colors
$color-success: #66FF66;      // Positive status
$color-warning: #FFAA00;      // Caution
$color-danger: #FF6666;       // Alert, critical
```

### Color Usage Convention

| Element | Color | Example |
|---------|-------|---------|
| Panel headers (LcarsFrame title) | Gold | "STATUS", "NAVIGATION", "SENSORS" |
| Labels within panels | Purple | "BALANCE", "HEADING", "SPEED" |
| Data values | Gold or White | "10,000", "045°" |
| Units | Gray | "u/s", "u" |
| Section headers | Gray | "Ship Telemetry", "Selected Target" |

### Typography

```scss
// Font families
$font-display: 'Orbitron', 'Segoe UI', sans-serif;  // Headers
$font-mono: 'Share Tech Mono', 'Consolas', monospace; // Data

// Font sizes
$font-size-xs: 0.75rem;   // 12px - Labels
$font-size-sm: 0.875rem;  // 14px - Secondary text
$font-size-md: 1rem;      // 16px - Body text
$font-size-lg: 1.25rem;   // 20px - Panel headers
$font-size-xl: 1.5rem;    // 24px - Section titles
$font-size-xxl: 2rem;     // 32px - Main title
```

### LCARS Panel Design

Panels follow the LCARS aesthetic with rounded corners and characteristic elbow shapes:

```
┌──────────────────────────────────────┐
│ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ │
│ █  NAVIGATION                      █ │
│ █                                  █ │
│ █  Heading: 045°                   █ │
│ █  Speed:   50 u/s                 █ │
│ █                                  █ │
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │
└──────────────────────────────────────┘
```

### Component Patterns

#### LcarsFrame

Reusable panel container:

```vue
<LcarsFrame title="NAVIGATION" color="purple">
  <template #content>
    <!-- Panel content -->
  </template>
</LcarsFrame>
```

#### LcarsButton

Styled button with states:

```vue
<LcarsButton 
  label="DOCK" 
  color="gold" 
  :disabled="!canDock"
  @click="handleDock" 
/>
```

#### LcarsGauge

Status indicator:

```vue
<LcarsGauge 
  label="FUEL" 
  :value="fuelPercent" 
  :max="100"
  :thresholds="{ warning: 25, danger: 10 }"
/>
```

### Spacing

Use consistent spacing units:

```scss
$space-xs: 0.25rem;  // 4px
$space-sm: 0.5rem;   // 8px
$space-md: 1rem;     // 16px
$space-lg: 1.5rem;   // 24px
$space-xl: 2rem;     // 32px
```

### Responsive Breakpoints

```scss
$breakpoint-sm: 640px;   // Mobile
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Desktop
$breakpoint-xl: 1280px;  // Large desktop
```

### Animation

```scss
// Transitions
$transition-fast: 150ms ease;
$transition-normal: 250ms ease;
$transition-slow: 400ms ease;

// Use for interactive elements
.lcars-button {
  transition: background-color $transition-fast;
}
```

### Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators: 2px solid outline
- Touch targets: minimum 44x44px
- Keyboard navigation: all interactive elements

## Git Conventions

### Branch Naming

- Feature: `feature/navigation-panel`
- Bugfix: `fix/docking-proximity`
- Refactor: `refactor/store-structure`

### Commit Messages

Follow conventional commits:

```
feat: add docking proximity detection
fix: correct heading calculation at 360°
refactor: extract movement logic to composable
docs: update architecture diagram
test: add sensor store unit tests
```
