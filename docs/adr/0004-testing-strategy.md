# ADR-0004: Testing Strategy with Vitest and Playwright

## Status

Accepted

## Context

The game requires comprehensive testing to ensure:

- Core game logic (physics, movement) works correctly
- State management behaves as expected
- UI components render and respond correctly
- Critical user flows work end-to-end

We need a testing strategy that:

- Integrates well with Vue 3 and Vite
- Supports TypeScript
- Runs fast during development
- Catches regressions in game mechanics

## Decision

We will use a two-tier testing strategy:

1. **Vitest** for unit and component tests
2. **Playwright** for end-to-end tests

### Unit Tests (Vitest)

Test core logic in isolation:

- Game loop timing
- Physics calculations
- Store actions and getters
- Utility functions

### Component Tests (Vitest + Vue Test Utils)

Test Vue components with mocked stores:

```typescript
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

const wrapper = mount(NavigationPanel, {
  global: {
    plugins: [createTestingPinia({ initialState: { ship: { speed: 50 } } })],
  },
});
```

### E2E Tests (Playwright)

Test critical user flows:

- Game start and initialization
- Navigation to a station
- Docking sequence
- Time acceleration

## Consequences

### Positive

- **Vitest speed**: Native Vite integration means fast test runs
- **Familiar API**: Jest-compatible syntax, easy to learn
- **Pinia integration**: `@pinia/testing` makes store testing straightforward
- **Playwright reliability**: Modern E2E framework with auto-wait
- **Parallel execution**: Both frameworks support parallel test runs

### Negative

- **Two test runners**: Must maintain configuration for both
- **Canvas testing**: Canvas rendering is difficult to test automatically
- **Game loop mocking**: Requires careful setup with fake timers

### Testing Patterns for Game Code

```typescript
// Mock requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 16));

// Use fake timers for time-based tests
vi.useFakeTimers();
vi.advanceTimersByTime(1000); // Advance 1 second
```

## Alternatives Considered

### Jest

- **Pros**: Well-known, large ecosystem
- **Cons**: Slower than Vitest with Vite, requires additional configuration

### Cypress

- **Pros**: Great DX, time-travel debugging
- **Cons**: Slower than Playwright, less cross-browser support

### Testing Library only

- **Pros**: Encourages user-centric testing
- **Cons**: Sometimes need lower-level access for game logic

## References

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html)
- [Playwright Documentation](https://playwright.dev/)
