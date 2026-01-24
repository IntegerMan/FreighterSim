<!--
SYNC IMPACT REPORT - v1.1.0 (2026-01-23)

Version change: 1.0.0 → 1.1.0 (MINOR)
Rationale: Materially expanded guidance in existing principle

Modified principles:
- III. Test-First Development: Added "Feature Completion Gates" clause requiring
  E2E tests (Playwright) and lint checks (ESLint) to pass before marking features complete

Added sections: None
Removed sections: None

Templates verified:
- .specify/templates/plan-template.md ✅ (no updates needed - Constitution Check is dynamic)
- .specify/templates/spec-template.md ✅ (no updates needed - requirements agnostic)
- .specify/templates/tasks-template.md ✅ (no updates needed - task structure unchanged)

Follow-up TODOs: None
-->

# Space Freighter Sim Constitution

## Core Principles

### I. Game-First Architecture
The game loop, physics, and rendering are the foundation. All features must respect the core systems' constraints: frame timing, coordinate systems, and rendering performance. Game logic MUST be decoupled from UI components and testable independently.

### II. Type Safety & Composition API
TypeScript is mandatory with strict mode enabled. All state must use Vue 3 Composition API with reactive references. Pinia stores are the single source of truth for game state. No prop drilling; use stores for cross-component communication.

### III. Test-First Development (NON-NEGOTIABLE)
Unit tests written before implementation. Component and integration tests for complex interactions. Tests must verify game behavior, not implementation details. Coverage target: core game systems ≥90%, components ≥70%. **Feature Completion Gates**: E2E tests (Playwright) and lint checks (ESLint) MUST pass before any feature is marked complete. Failing tests gate PR merges.

### IV. Canvas Rendering Optimization
Canvas rendering for the system map MUST be performant at 60 FPS. All render operations batched per frame. Object transformations pre-calculated. No DOM mutations in hot paths. Rendering code isolated in dedicated systems separate from game logic.

### V. UI/UX Consistency: LCARS Design System
All UI components use LCARS-inspired design with strict color palette: Purple (#9966FF), Gold (#FFCC00), White (#FFFFFF), Black (#000000). Component reusability through base UI components (LcarsFrame, LcarsButton, LcarsGauge, etc.). Accessibility requirements: keyboard navigation, ARIA labels, high contrast ratios.

## Development Workflow

- **Branching**: Feature branches from `main` with descriptive names based on tasks (`feat/docking-mechanics`, `fix/radar-display`).
- **Code Review**: All PRs require review; constitution principles MUST be verified in review checklist
- **Commit Messages**: Format: `type(scope): description` (e.g., `feat(navigation): add waypoint autopilot`)
- **Architecture Decisions**: Non-trivial decisions recorded in ADRs in `/docs/adr/`

## Technology Stack (Non-Negotiable)

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript 5+ with strict mode
- **State Management**: Pinia
- **Build Tool**: Vite
- **Styling**: SCSS with design system variables
- **Rendering**: HTML5 Canvas (system map), Vue DOM (UI panels)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint + Prettier

## File Organization & Naming

- **`/src/core/`**: Game systems without Vue dependencies (game-loop, physics, rendering utils)
- **`/src/stores/`**: Pinia stores following composition pattern
- **`/src/components/`**: Vue components organized by feature domain (map, panels, sensors, ui)
- **`/src/models/`**: TypeScript interfaces and domain types
- **`/src/data/`**: Static game data (star systems, stations, planets)
- **Test files**: Colocated with implementation (`.test.ts` or `.spec.ts`)

## Governance

This constitution supersedes all other project guidelines. Non-compliance with core principles (Game-First Architecture, Type Safety, Test-First, Canvas Optimization, LCARS Design) requires documented justification.

**Amendment Procedure**: Significant changes to core principles require ADR and discussion. Version bumps: MAJOR for principle removals, MINOR for additions, PATCH for clarifications.

**Runtime Guidance**: See [ARCHITECTURE.md](ARCHITECTURE.md) and [STYLE_GUIDE.md](STYLE_GUIDE.md) for implementation details.

**Version**: 1.1.0 | **Ratified**: 2026-01-22 | **Last Amended**: 2026-01-23
