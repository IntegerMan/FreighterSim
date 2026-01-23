````markdown
# Implementation Plan: Cargo Screen

**Branch**: `SKY-4-CargoScreen` | **Date**: January 22, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/4-cargo-screen/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a Cargo Screen that displays cargo bay inventory and available capacity using a 2D grid visualization. Cargo items are rendered as Canvas rectangles in a grid layout determined by cargo bay dimensions (Width × Depth). The feature requires new CargoItem and CargoBay models, a cargoStore for state management, and a CargoView/CargoPanel following existing LCARS UI patterns.

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode  
**Primary Dependencies**: Vue 3 (Composition API), Pinia, Vite, SCSS  
**Storage**: N/A (in-memory game state via Pinia stores)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Modern browsers (desktop-first, web)  
**Project Type**: Single Vue SPA  
**Performance Goals**: 60 FPS rendering, <100ms UI updates per FR-005  
**Constraints**: Follow LCARS design system (ADR-0005), composition pattern for ship subsystems (ADR-0008)  
**Scale/Scope**: Single new view, 1 new store, 2 new models, 1 panel component, 1 grid canvas component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game-First Architecture | ✅ PASS | Cargo logic decoupled in models/store, testable independently from UI |
| II. Type Safety & Composition API | ✅ PASS | TypeScript strict mode, Composition API, Pinia store as source of truth |
| III. Test-First Development | ✅ PASS | Unit tests for CargoItem/CargoBay models, cargoStore; E2E for CargoView |
| IV. Canvas Rendering Optimization | ✅ PASS | Grid canvas renders static rectangles, no hot-path DOM mutations |
| V. UI/UX Consistency: LCARS Design | ✅ PASS | Uses LcarsFrame, LCARS colors, existing panel patterns |

**Gate Result**: PASS - Proceed to Phase 0

### Post-Design Re-evaluation (Phase 1 Complete)

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Game-First Architecture | ✅ PASS | CargoBay/CargoItem models pure TypeScript, cargoStore independent of Vue components |
| II. Type Safety & Composition API | ✅ PASS | Strict interfaces defined in data-model.md, cargoStore uses Composition API pattern |
| III. Test-First Development | ✅ PASS | Test file locations specified in project structure, contract API enables TDD |
| IV. Canvas Rendering Optimization | ✅ PASS | CargoGrid uses single Canvas, batch rendering per research.md |
| V. UI/UX Consistency: LCARS Design | ✅ PASS | Color mappings defined, LcarsFrame usage specified, follows existing panel patterns |

**Post-Design Gate Result**: PASS - Ready for task generation

## Project Structure

### Documentation (this feature)

```text
specs/4-cargo-screen/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── cargo-store-api.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   ├── CargoItem.ts         # NEW: Cargo item interface
│   ├── CargoBay.ts          # NEW: Cargo bay interface (ship subsystem)
│   ├── Ship.ts              # MODIFY: Add cargo bay to ship composition
│   └── index.ts             # MODIFY: Export new models
├── stores/
│   ├── cargoStore.ts        # NEW: Cargo state management
│   ├── cargoStore.test.ts   # NEW: Unit tests for cargo store
│   ├── shipStore.ts         # MODIFY: Integrate cargo bay subsystem
│   └── index.ts             # MODIFY: Export new store
├── components/
│   └── panels/
│       ├── CargoPanel.vue   # NEW: Cargo info panel (capacity, counts)
│       └── index.ts         # MODIFY: Export new panel
├── views/
│   ├── CargoView.vue        # NEW: Main cargo screen view
│   └── index.ts             # MODIFY: Export new view
├── router/
│   └── index.ts             # MODIFY: Add /cargo route
└── e2e/
    └── cargo.spec.ts        # NEW: E2E tests for cargo screen
```

**Structure Decision**: Single Vue SPA structure following existing project conventions. New files colocated with related domain modules. Tests colocated per constitution guidelines.

## Complexity Tracking

> **No violations - design follows all constitution principles**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

````
