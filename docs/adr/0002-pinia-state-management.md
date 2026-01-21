# ADR-0002: Use Pinia for State Management

## Status

Accepted

## Context

The game requires centralized state management for:

- Ship state (position, heading, speed, docking status)
- Navigation state (current system, waypoints)
- Sensor contacts (nearby objects, scan data)
- Game state (time, pause, settings)

Multiple components need to read and react to this state, and the game loop needs to update it on each tick. We need a solution that:

- Integrates well with Vue 3's Composition API
- Supports TypeScript with good type inference
- Allows easy testing with mocked state
- Provides devtools for debugging

## Decision

We will use **Pinia** as the state management solution, using the **setup store** syntax (composition API style).

### Store Pattern

```typescript
export const useShipStore = defineStore('ship', () => {
  // Reactive state
  const position = ref<Vector2>({ x: 0, y: 0 });
  
  // Computed (getters)
  const isMoving = computed(() => speed.value > 0);
  
  // Actions
  function update(deltaTime: number) { /* ... */ }
  
  return { position, isMoving, update };
});
```

## Consequences

### Positive

- **Official Vue solution**: Pinia is the recommended state management for Vue 3
- **TypeScript-first**: Excellent type inference without verbose annotations
- **Composition API alignment**: Setup stores use the same patterns as components
- **Testing support**: `@pinia/testing` provides easy mocking for tests
- **Devtools**: Full Vue Devtools integration for state inspection
- **Modular**: Each store is independent, no monolithic store file
- **Hot Module Replacement**: Stores can be hot-reloaded during development

### Negative

- Game loop integration requires manual subscription pattern (stores don't have built-in tick mechanism)
- Serialization for save/load requires manual implementation

## Alternatives Considered

### Vuex 4

- **Pros**: Mature, well-documented
- **Cons**: Mutations/actions pattern is verbose, worse TypeScript support, Pinia is now the official recommendation

### Custom reactive state

- **Pros**: Full control, no dependencies
- **Cons**: No devtools, reinventing tested patterns, more maintenance

### RxJS-based state

- **Pros**: Powerful for complex async flows
- **Cons**: Steep learning curve, overkill for this use case, doesn't integrate as naturally with Vue

## References

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html)
