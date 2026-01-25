# Tasks: Switch to PixiJS Rendering Engine

**Feature Branch**: `001-switch-pixijs-engine`  
**Input**: Design documents from `/specs/001-switch-pixijs-engine/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Unit tests (Vitest) and E2E tests (Playwright) required per Constitution Principle III (Test-First Development). ESLint and Prettier must pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **Checkbox**: All tasks start with `- [ ]` (markdown checkbox)
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install PixiJS, create core data models, and establish renderer initialization structure

- [X] T001 Install PixiJS v8.15.0 dependency via npm/pnpm in package.json
- [X] T002 [P] Create RenderingLayer interface in src/models/RenderingLayer.ts
- [X] T003 [P] Create RenderableObject interface in src/models/RenderableObject.ts
- [X] T004 [P] Create PerformanceProfile interface in src/models/PerformanceProfile.ts
- [X] T005 Create capability detection module in src/core/rendering/capabilities.ts
- [X] T006 Create PixiJS renderer initialization module in src/core/rendering/pixiRenderer.ts
- [X] T007 Create Pinia store for renderer state in src/stores/rendererStore.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core rendering infrastructure that MUST be complete before ANY user story visual work can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Implement capability detection for WebGL2/WebGL1 fallback (halt if neither available) in src/core/rendering/capabilities.ts
- [X] T009 [P] Create unit tests for capability detection in src/core/rendering/capabilities.test.ts
- [X] T010 Implement PixiJS application initialization with fallback handling in src/core/rendering/pixiRenderer.ts
- [X] T011 Implement layer management system (background, game, effects, UI) in src/core/rendering/pixiRenderer.ts
- [X] T012 Create WebGL context loss detection and recovery handler in src/core/rendering/contextLossHandler.ts
- [X] T013 [P] Create unit tests for context loss handler in src/core/rendering/contextLossHandler.test.ts
- [X] T014 Initialize renderer state store with performance metrics tracking in src/stores/rendererStore.ts
- [X] T015 Create performance monitoring utilities (FPS, frame time, memory) in src/core/rendering/performanceMonitor.ts
- [X] T016 [P] Create unit tests for performance monitor in src/core/rendering/performanceMonitor.test.ts
- [X] T017 Export rendering utilities from src/core/rendering/index.ts

**Checkpoint**: Foundation ready with capability detection, layer management, context loss handling, and performance monitoring

---

## Phase 3: User Story 1 - Smooth Visuals in Busy Scenes (Priority: P1) 🎯 MVP

**Goal**: Achieve ≥60 fps with 500+ renderable objects using PixiJS renderer, replacing legacy Canvas paths

**Independent Test**: Load a scene with 500+ objects and active UI overlays, verify sustained ≥60 fps during 5 minutes of camera pan/zoom

### Auto-Throttling System

- [X] T018 [P] [US1] Create throttling controller state machine in src/core/rendering/throttlingController.ts
- [X] T019 [P] [US1] Create unit tests for throttling state machine in src/core/rendering/throttlingController.test.ts
- [X] T020 [US1] Implement FPS averaging window (2 seconds) in src/core/rendering/performanceMonitor.ts
- [X] T021 [US1] Implement 95th percentile frame time calculation (25ms threshold) in src/core/rendering/performanceMonitor.ts
- [X] T022 [US1] Implement throttling trigger detection (avg FPS <58 for 2s OR p95 frame time >25ms for 5s) in src/core/rendering/throttlingController.ts
- [X] T023 [US1] Implement particle count reduction strategy in src/core/rendering/throttlingController.ts
- [X] T024 [US1] Implement effects intensity reduction strategy in src/core/rendering/throttlingController.ts
- [X] T025 [US1] Implement resolution scaling reduction strategy (last resort) in src/core/rendering/throttlingController.ts
- [X] T026 [US1] Implement throttling recovery detection and state transitions in src/core/rendering/throttlingController.ts

### Map/Navigation Rendering Integration

- [X] T027 [US1] Convert SystemMap.vue from Canvas to PixiJS layers in src/components/map/SystemMap.vue
- [X] T028 [US1] Implement ship rendering using PixiJS sprites/graphics in src/components/map/SystemMap.vue
- [X] T029 [US1] Implement station rendering using PixiJS in src/components/map/SystemMap.vue
- [X] T030 [US1] Implement selection highlight effects using PixiJS in src/components/map/SystemMap.vue
- [X] T031 [US1] Implement camera pan/zoom controls for PixiJS scene in src/components/map/SystemMap.vue
- [X] T032 [US1] Remove legacy Canvas rendering code paths from SystemMap.vue

### Particle System Integration

- [X] T033 [US1] Convert particle rendering to PixiJS ParticleContainer in src/stores/particleStore.ts
- [X] T034 [US1] Implement particle emission for engine trails using PixiJS in src/stores/particleStore.ts
- [X] T035 [US1] Implement particle system throttling integration (cap at 5000 particles) in src/stores/particleStore.ts
- [X] T036 [US1] Test particle-heavy scene (5000+ particles) for ≥60 fps sustained for 60 seconds

### Performance Validation

- [X] T037 [US1] Create E2E test for busy scene (500+ objects) maintaining ≥60 fps in e2e/rendering-performance.spec.ts
- [X] T038 [US1] Create E2E test for particle-heavy scene (5000+ particles) in e2e/rendering-performance.spec.ts
- [X] T039 [US1] Verify input latency stays below 100ms threshold during high-load scenes in e2e/rendering-performance.spec.ts

**Checkpoint**: PixiJS renderer handles busy scenes at target frame rate with auto-throttling active

---

## Phase 4: User Story 2 - Cutover Confidence Without Legacy Toggle (Priority: P2)

**Goal**: Complete visual and interaction parity validation, remove all legacy Canvas rendering code

**Independent Test**: Run automated parity checks against baselines to confirm PixiJS-only build is production-ready

### Visual Parity Testing

- [ ] T040 [P] [US2] Create baseline capture utility for pre-cutover visuals in tests/parity/captureBaseline.ts
- [ ] T041 [P] [US2] Capture baselines for navigation/map screen in tests/parity/baselines/
- [ ] T042 [P] [US2] Capture baselines for cargo screen in tests/parity/baselines/
- [ ] T043 [P] [US2] Capture baselines for bridge overlays in tests/parity/baselines/
- [ ] T044 [US2] Create visual comparison utility for parity checks in tests/parity/compareVisuals.ts
- [ ] T045 [US2] Create E2E parity test for navigation/map screen (95% element match) in e2e/visual-parity.spec.ts
- [ ] T046 [US2] Create E2E parity test for cargo screen in e2e/visual-parity.spec.ts
- [ ] T047 [US2] Create E2E parity test for bridge overlays, selections, tooltips in e2e/visual-parity.spec.ts

### Graceful Degradation & Fallback

- [ ] T048 [US2] Implement startup error message for WebGL unavailable (halt with requirements) in src/core/rendering/capabilities.ts
- [ ] T049 [US2] Create user-facing error component for WebGL requirement message in src/components/CapabilityError.vue
- [ ] T050 [US2] Test WebGL1 fallback mode functionality in e2e/fallback-modes.spec.ts
- [ ] T051 [US2] Test WebGL unavailable halt behavior with clear error message in e2e/fallback-modes.spec.ts
- [ ] T052 [US2] Verify clear, actionable error message appears within 2 seconds of WebGL unavailability and app halts in e2e/fallback-modes.spec.ts

### Legacy Code Removal

- [ ] T053 [US2] Remove legacy Canvas rendering utilities from src/core/rendering/
- [ ] T054 [US2] Remove legacy Canvas code from HelmMap.vue in src/components/map/HelmMap.vue
- [ ] T055 [US2] Remove legacy Canvas code from RadarDisplay.vue in src/components/sensors/RadarDisplay.vue
- [ ] T056 [US2] Remove legacy Canvas assets and unused imports from src/assets/
- [ ] T057 [US2] Update build configuration to exclude legacy rendering code in vite.config.ts
- [ ] T058 [US2] Run full test suite to ensure no legacy dependencies remain

**Checkpoint**: Visual parity validated at 95%, legacy Canvas code completely removed, WebGL requirement enforced with graceful halt

---

## Phase 5: User Story 3 - Showcasing Enhanced Effects (Priority: P3)

**Goal**: Enable LCARS-style effects (glow, trails, particles) within performance budgets

**Independent Test**: Enable enhanced effects presets and verify they run within agreed performance limits

### LCARS Effects System

- [ ] T059 [P] [US3] Create glow filter utilities using PixiJS filters in src/core/rendering/effects/glowEffects.ts
- [ ] T060 [P] [US3] Create trail/streak effects using PixiJS graphics in src/core/rendering/effects/trailEffects.ts
- [ ] T061 [P] [US3] Create highlight effects for selection states in src/core/rendering/effects/highlightEffects.ts
- [ ] T062 [US3] Create effects intensity controller in src/core/rendering/effects/effectsController.ts
- [ ] T063 [US3] Integrate effects intensity with throttling system in src/core/rendering/throttlingController.ts

### UI Component Effects Integration

- [ ] T064 [US3] Apply LCARS glow effects to LCARS UI components in src/components/ui/LCARSButton.vue
- [ ] T065 [US3] Apply selection highlight effects to interactive map elements in src/components/map/SystemMap.vue
- [ ] T066 [US3] Apply engine trail effects to ship rendering in src/components/map/SystemMap.vue
- [ ] T067 [US3] Create effects preset configurations (low, medium, high) in src/core/rendering/effects/effectsPresets.ts

### Effects Performance Validation

- [ ] T068 [US3] Test effects-enabled scenes maintain ≥55 fps during 5 minutes of interaction in e2e/effects-performance.spec.ts
- [ ] T069 [US3] Test effects throttling correctly reduces intensity when performance dips in e2e/effects-performance.spec.ts
- [ ] T070 [US3] Verify input latency stays below 100ms with effects enabled in e2e/effects-performance.spec.ts
- [ ] T071 [US3] Test effects caps prevent frame rate drops below 55 fps threshold in e2e/effects-performance.spec.ts

**Checkpoint**: LCARS effects operational within performance budgets, throttling enforces caps gracefully

---

## Phase 6: Debug & QA Instrumentation

**Purpose**: Provide debug views and instrumentation for validation against success criteria

- [ ] T072 [P] Create debug overlay component showing FPS, frame time, memory in src/components/debug/PerformanceOverlay.vue
- [ ] T073 [P] Create debug view showing throttling state and particle count in src/components/debug/ThrottlingDebugView.vue
- [ ] T074 Create debug API endpoint for performance metrics (optional) per contracts/openapi.yaml
- [ ] T075 Add keyboard shortcut to toggle debug overlay (e.g., Ctrl+Shift+D) in src/views/layout/MainLayout.vue
- [ ] T076 [P] Create unit tests for performance overlay calculations in src/components/debug/PerformanceOverlay.test.ts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation, optimization, and validation

- [ ] T077 [P] Add JSDoc documentation to rendering interfaces in src/models/
- [ ] T078 [P] Add JSDoc documentation to renderer utilities in src/core/rendering/
- [ ] T079 Run ESLint and Prettier on all modified files
- [ ] T080 Update ARCHITECTURE.md with PixiJS rendering architecture in docs/
- [ ] T081 Create ADR documenting rendering engine cutover decision in docs/adr/
- [ ] T082 [P] Performance profiling on midrange hardware to validate ≥60 fps target
- [ ] T083 [P] Performance profiling on low-end hardware to test throttling effectiveness
- [ ] T084 Update Constitution IV to reflect PixiJS as standard renderer (pending ADR acceptance)
- [ ] T085 Run full quickstart.md validation workflow to verify implementation matches design

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - MVP delivery point
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - requires PixiJS rendering working
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) - requires base rendering + throttling
- **Debug & QA (Phase 6)**: Can start after Foundational (Phase 2), useful throughout all stories
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational only - MVP delivery, independently testable ✅
- **User Story 2 (P2)**: Requires US1 rendering working - validates parity and removes legacy ✅
- **User Story 3 (P3)**: Requires US1 rendering and throttling - adds effects layer ✅

### Within Each User Story

- **Setup**: Install dependencies before using them, models before renderer initialization
- **Foundational**: Capability detection → renderer init → layer management → context loss → performance monitoring
- **US1**: Throttling system → map rendering → particles → performance validation
- **US2**: Capture baselines → visual comparison → parity tests → legacy removal
- **US3**: Effects utilities → integration to components → performance testing

### Parallel Opportunities

**Phase 1 (Setup)**:

- T002, T003, T004 can run in parallel (different model files)

**Phase 2 (Foundational)**:

- T009, T013, T016 can run in parallel (different test files)

**Phase 3 (User Story 1)**:

- T018, T019 can be developed together (implementation + tests)
- T027-T032 must be done sequentially (modifying same component)

**Phase 4 (User Story 2)**:

- T040-T043 can run in parallel (capturing different baseline screens)
- T053-T056 can run in parallel (removing legacy code from different files)

**Phase 5 (User Story 3)**:

- T059, T060, T061 can run in parallel (different effects modules)

**Phase 6 (Debug)**:

- T072, T073, T076 can run in parallel (different components)

**Phase 7 (Polish)**:

- T077, T078, T082, T083 can run in parallel (different concerns)

---

## Parallel Example: User Story 1 Rendering Integration

```bash
# After throttling system is ready, convert rendering components:
Task: T027 - "Convert SystemMap.vue from Canvas to PixiJS layers"
Task: T033 - "Convert particle rendering to PixiJS ParticleContainer"

# These can proceed in parallel since they affect different files
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → PixiJS installed, models defined
2. Complete Phase 2: Foundational → Renderer initialized, capability detection working
3. Complete Phase 3: User Story 1 → PixiJS rendering live with auto-throttling
4. **STOP and VALIDATE**: Test busy scenes sustain ≥60 fps with throttling active
5. **MVP COMPLETE** - PixiJS rendering operational

### Incremental Delivery (Recommended Priority Order)

1. **Foundation** (Phase 1 + 2): ~17 tasks → Core renderer infrastructure ready
2. **MVP - User Story 1** (Phase 3): ~22 tasks → PixiJS rendering at target performance ✅ DEMO
3. **User Story 2** (Phase 4): ~19 tasks → Visual parity validated, legacy removed ✅ PRODUCTION READY
4. **User Story 3** (Phase 5): ~13 tasks → LCARS effects enabled ✅ POLISH DEMO
5. **Debug & QA** (Phase 6): ~5 tasks → Instrumentation for validation
6. **Polish** (Phase 7): ~9 tasks → Documentation, optimization, final validation

### Validation Gates

- **After Phase 2**: Verify capability detection works, renderer initializes on all browser configurations
- **After Phase 3**: Verify SC-001 (500+ objects at ≥60 fps) and SC-002 (5000+ particles at ≥60 fps)
- **After Phase 4**: Verify SC-003 (95% visual parity) and SC-004 (clear fallback messages)
- **After Phase 5**: Verify SC-005 (effects at ≥55 fps with ≤100ms input latency)
- **Before Merge**: All E2E tests pass, ESLint clean, performance targets met

---

## Notes

- **[P] marker**: Tasks in different files with no dependencies - safe to parallelize
- **[US#] marker**: Maps each task to its user story for traceability and independent validation
- **Checkpoint**: After each user story phase, stop and validate success criteria before proceeding
- **MVP Scope**: Phase 1 + 2 + 3 delivers PixiJS rendering at target performance
- **Production Ready**: Phase 4 completion (legacy removed, parity validated) is merge-ready
- **Test Strategy**: Unit tests for core utilities, E2E (Playwright) for visual/performance validation
- **Performance**: Monitor FPS/frame time throughout; throttling should maintain targets
- **Constitution**: Rendering divergence justified by ADR-0013; Constitution update pending
- **Context Loss**: Single auto-recovery attempt; halt if repeat within 30 seconds

---

## Summary Statistics

- **Total Tasks**: 85
- **Setup Phase**: 7 tasks
- **Foundational Phase**: 10 tasks (BLOCKS all user stories)
- **User Story 1 (P1)**: 22 tasks - MVP delivery (rendering at target performance)
- **User Story 2 (P2)**: 19 tasks - Production ready (parity validated, legacy removed)
- **User Story 3 (P3)**: 13 tasks - Enhanced effects
- **Debug & QA Phase**: 5 tasks
- **Polish Phase**: 9 tasks
- **Parallel Opportunities**: 18 tasks marked [P] for potential parallelization
- **Estimated MVP Scope**: Tasks T001-T039 (39 tasks) for PixiJS rendering operational
- **Production Ready Scope**: Tasks T001-T058 (58 tasks) for legacy removed and parity validated
