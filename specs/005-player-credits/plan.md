# Implementation Plan: Player Credits System

**Branch**: `005-player-credits` | **Date**: January 23, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-player-credits/spec.md`

## Summary

Implement a player credits system that initializes with 10,000 Credits at game start and displays the balance on both Bridge and Cargo screens. The credits state will be stored in the existing `gameStore.ts` as session-level data, with a new reusable `CreditsPanel.vue` component following the LCARS design system. This establishes the foundation for future economy features (trading, contracts, repairs, upgrades).

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode  
**Primary Dependencies**: Vue 3 (Composition API), Pinia, Vite, SCSS  
**Storage**: In-memory via Pinia store (session-based, no persistence)  
**Testing**: Vitest (unit tests), Playwright (E2E tests)  
**Target Platform**: Web browser (desktop-first, responsive)  
**Project Type**: Single Vue.js web application  
**Performance Goals**: 60 FPS rendering, credits display visible within 1 second of screen load  
**Constraints**: Follow LCARS design system, maintain type safety, test-first development  
**Scale/Scope**: 2 screens (Bridge, Cargo), 1 shared component, 1 store extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game-First Architecture | ✅ PASS | Credits logic decoupled from UI via Pinia store; testable independently |
| II. Type Safety & Composition API | ✅ PASS | TypeScript strict mode; Composition API for store and component; Pinia for state |
| III. Test-First Development | ✅ PASS | Unit tests for gameStore credits logic; component tests for CreditsPanel |
| IV. Canvas Rendering Optimization | ✅ N/A | No canvas rendering involved; DOM-based UI panel only |
| V. LCARS Design System | ✅ PASS | Using LcarsFrame, gold color palette, existing SCSS variables |

**Gate Status**: ✅ ALL GATES PASS - Proceed with implementation

## Project Structure

### Documentation (this feature)

```text
specs/005-player-credits/
├── plan.md              # This file
├── research.md          # Phase 0 output - patterns and decisions
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - API contracts
│   └── credits-store-api.ts
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── stores/
│   ├── gameStore.ts           # MODIFY: Add credits state and actions
│   └── gameStore.test.ts      # CREATE: Tests for credits functionality
├── components/
│   └── panels/
│       ├── CreditsPanel.vue   # CREATE: Reusable credits display component
│       ├── CreditsPanel.test.ts # CREATE: Component tests
│       └── index.ts           # MODIFY: Export CreditsPanel
├── views/
│   ├── BridgeView.vue         # MODIFY: Add CreditsPanel above NavigationPanel
│   └── CargoView.vue          # MODIFY: Add CreditsPanel above CargoPanel
e2e/
└── credits.spec.ts            # CREATE: E2E tests for credits display
```

**Structure Decision**: Single Vue.js project structure matching existing codebase. Feature integrates into existing store (`gameStore.ts`) and follows the established component organization pattern (`src/components/panels/`). No new architectural patterns required.

## Complexity Tracking

> No constitution violations. Implementation follows all established patterns.
