# ADR-0001: Use Vue 3 + TypeScript + Vite

## Status

Accepted

## Context

We need to choose a frontend framework and build tooling for a single-player space freighter simulation game. The application requires:

- Complex, reactive UI with multiple control panels
- Integration with a custom game loop
- Strong typing for game entities and state
- Fast development iteration
- Good testing support

The main candidates considered were:
- **Angular** - Full framework with RxJS
- **Vue 3** - Progressive framework with Composition API
- **React** - Library with ecosystem choices

## Decision

We will use **Vue 3** with the **Composition API**, **TypeScript**, and **Vite** as the build tool.

### Rationale

1. **Vue 3 Composition API** provides excellent TypeScript support with type inference that works naturally with reactive state.

2. **Flexibility for game development**: Vue's reactivity system integrates well with custom game loops without fighting the framework. We can mix imperative game logic with declarative UI.

3. **Lighter weight**: Vue's core is smaller (~30kb gzipped) compared to Angular (~130kb+), which matters for a game that may need to load quickly.

4. **Vite integration**: Vite provides near-instant HMR during development and is maintained by the Vue team, ensuring excellent compatibility.

5. **Learning curve**: Vue has a gentler learning curve, allowing faster prototyping and iteration.

## Consequences

### Positive

- Fast development with Vite's HMR
- Clean integration between reactive UI and game state
- Strong TypeScript support with minimal configuration
- Smaller bundle size
- Single-file components keep related code together

### Negative

- Smaller ecosystem than React (though sufficient for our needs)
- Team members familiar only with Angular/React will need to learn Vue patterns
- Some game-specific patterns may need custom solutions (not as many game-focused libraries as React)

## Alternatives Considered

### Angular

- **Pros**: Full framework, excellent TypeScript support, RxJS for complex async patterns
- **Cons**: Heavier, more opinionated, steeper learning curve, RxJS complexity may be overkill

### React

- **Pros**: Largest ecosystem, many game-focused libraries
- **Cons**: More decisions required (state management, routing), less opinionated can lead to inconsistency

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vue Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
