# Tasks: Cargo Screen

**Input**: Design documents from `/specs/4-cargo-screen/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not explicitly requested in the feature specification. Test tasks included for E2E only per existing project patterns.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and model creation for cargo feature

- [ ] T001 [P] Create CargoItem model with CargoType union type in src/models/CargoItem.ts
- [ ] T002 [P] Create CargoBay interface and DEFAULT_CARGO_BAY constant in src/models/CargoBay.ts
- [ ] T003 Export new models from src/models/index.ts
- [ ] T004 Modify Ship interface to add cargoBay subsystem in src/models/Ship.ts
- [ ] T005 Update DEFAULT_SHIP with cargoBay initialization in src/models/Ship.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state management that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create cargoStore with getters (items, bayDimensions, totalSlots, occupiedSlots, availableSlots, isFull, isEmpty) in src/stores/cargoStore.ts
- [ ] T007 Implement cargoStore actions (loadCargo, unloadCargo, clearCargo) in src/stores/cargoStore.ts
- [ ] T008 Add helper functions (getItemsOfType, hasItem, getCountByType, createCargoItem) in src/stores/cargoStore.ts
- [ ] T009 Export cargoStore from src/stores/index.ts
- [ ] T010 Initialize ship with cargoBay in shipStore (ensure DEFAULT_SHIP.cargoBay is used) in src/stores/shipStore.ts
- [ ] T011 Add /cargo route with lazy-loaded CargoView (meta.order: 4) in src/router/index.ts
- [ ] T012 Create unit tests for cargoStore (load, unload, capacity calculations) in src/stores/cargoStore.test.ts (TEST-FIRST: write tests against contract before UI implementation)

**Checkpoint**: Foundation ready with test coverage - user story implementation can now begin

---

## Phase 3: User Story 1 - View Cargo Inventory (Priority: P1) 🎯 MVP

**Goal**: Display cargo items in cargo bay as a visual 2D grid so captains can see what cargo they're carrying

**Independent Test**: Navigate to /cargo screen, verify loaded cargo items display as colored rectangles in a grid matching the cargo bay dimensions, with empty bays showing "NO CARGO LOADED" message

### Implementation for User Story 1

- [ ] T013 [US1] Create CargoView.vue with LcarsFrame wrapper following existing view patterns in src/views/CargoView.vue
- [ ] T014 [US1] Export CargoView from src/views/index.ts
- [ ] T015 [US1] Create CargoGrid.vue component with Canvas element for 2D grid rendering in src/components/cargo/CargoGrid.vue
- [ ] T016 [US1] Implement grid slot drawing function (empty slots as dark rectangles with border) in src/components/cargo/CargoGrid.vue
- [ ] T017 [US1] Implement cargo item rendering with CargoType color mapping (mineral=gold, supply=white, hazmat=danger, equipment=purple, luxury=success) in src/components/cargo/CargoGrid.vue
- [ ] T018 [US1] Add cargo item name label rendering on hover or within grid cell (per FR-001: display item name) in src/components/cargo/CargoGrid.vue
- [ ] T019 [US1] Add empty state display showing "NO CARGO LOADED" message when cargo bay is empty in src/components/cargo/CargoGrid.vue
- [ ] T020 [US1] Wire CargoGrid to cargoStore with reactive watch for cargo changes in src/components/cargo/CargoGrid.vue
- [ ] T021 [US1] Create components/cargo/index.ts barrel export for CargoGrid
- [ ] T022 [US1] Integrate CargoGrid into CargoView layout in src/views/CargoView.vue

**Checkpoint**: User Story 1 complete - cargo items visible in grid with names, empty state handled

---

## Phase 4: User Story 2 - View Available Cargo Space (Priority: P1) 🎯 MVP

**Goal**: Display cargo capacity information (total slots, used slots, available slots) so captains know how much space remains

**Independent Test**: Navigate to /cargo screen, verify capacity numbers display correctly (total, used, available) and update when cargo is loaded/unloaded

### Implementation for User Story 2

- [ ] T023 [US2] Create CargoPanel.vue with LCARS styling for capacity display in src/components/panels/CargoPanel.vue
- [ ] T024 [US2] Display total capacity (totalSlots) with label in src/components/panels/CargoPanel.vue
- [ ] T025 [US2] Display occupied slots count (occupiedSlots) with label in src/components/panels/CargoPanel.vue
- [ ] T026 [US2] Display available slots count (availableSlots) with label in src/components/panels/CargoPanel.vue
- [ ] T027 [US2] Add full capacity indicator (warning style when isFull is true) in src/components/panels/CargoPanel.vue
- [ ] T028 [US2] Export CargoPanel from src/components/panels/index.ts
- [ ] T029 [US2] Integrate CargoPanel into CargoView layout alongside CargoGrid in src/views/CargoView.vue

**Checkpoint**: User Stories 1 AND 2 complete - cargo visible and capacity displayed

---

## Phase 5: User Story 3 - Visual Capacity Indicator (Priority: P2)

**Goal**: Provide a visual gauge/progress bar showing capacity usage percentage for quick at-a-glance status

**Independent Test**: Navigate to /cargo screen, verify visual indicator (gauge/progress bar) accurately represents capacity percentage and updates in real-time when cargo changes

### Implementation for User Story 3

- [ ] T030 [US3] Add capacityPercent getter to cargoStore (implements contract-defined getter) in src/stores/cargoStore.ts
- [ ] T031 [US3] Add itemsByType and uniqueTypeCount getters to cargoStore (implements contract-defined getters) in src/stores/cargoStore.ts
- [ ] T032 [US3] Create capacity gauge component using LcarsGauge in src/components/panels/CargoPanel.vue
- [ ] T033 [US3] Wire gauge to capacityPercent reactive getter in src/components/panels/CargoPanel.vue
- [ ] T034 [US3] Add cargo type breakdown display (count by type) in src/components/panels/CargoPanel.vue

**Checkpoint**: All user stories complete - full cargo screen functionality delivered

---

## Phase 6: Edge Cases & Validation

**Purpose**: Edge case handling, testing, and validation

### Edge Case Implementation (from spec.md Edge Cases section)

- [ ] T035 [P] Add validation in cargoStore.loadCargo to prevent exceeding capacity (return false, log warning) in src/stores/cargoStore.ts
- [ ] T036 [P] Add error state display in CargoGrid for inconsistent/corrupted cargo data (items.length > totalSlots) in src/components/cargo/CargoGrid.vue
- [ ] T037 [P] Add loading indicator for transient states during cargo load/unload operations in src/components/cargo/CargoGrid.vue

### Testing & Validation

- [ ] T038 [P] Create E2E test for cargo screen navigation, display, and real-time updates (include simulated NPC cargo change per FR-004) in e2e/cargo.spec.ts
- [ ] T039 Run quickstart.md manual testing checklist validation
- [ ] T040 Verify LCARS design consistency (colors, fonts, spacing) across cargo components

**Scope Note**: Responsive design testing is desktop-only for v1. Mobile/tablet viewport support deferred to future iteration.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories; includes unit tests per test-first principle
- **User Stories (Phase 3+)**: All depend on Foundational phase completion (including T012 unit tests)
  - User stories can proceed in priority order (P1 → P2)
  - US1 and US2 are both P1 but US2 depends on US1's CargoView
- **Edge Cases & Validation (Phase 6)**: Edge case tasks can run in parallel; E2E depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates CargoView and CargoGrid
- **User Story 2 (P1)**: Can start after T013 (CargoView exists) - Adds CargoPanel to existing view
- **User Story 3 (P2)**: Can start after US2 - Enhances CargoPanel with gauge

### Within Each User Story

- Models/store changes before components
- Components before view integration
- Core implementation before polish

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# Run in parallel - different files, no dependencies:
T001: Create CargoItem model in src/models/CargoItem.ts
T002: Create CargoBay interface in src/models/CargoBay.ts
```

**Phase 6 (Edge Cases)**:
```bash
# Run in parallel - different files:
T035: Capacity validation in src/stores/cargoStore.ts
T036: Error state display in src/components/cargo/CargoGrid.vue
T037: Loading indicator in src/components/cargo/CargoGrid.vue
T038: E2E tests in e2e/cargo.spec.ts
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012) - **includes unit tests per test-first principle**
3. Complete Phase 3: User Story 1 - View Cargo Inventory (T013-T022)
4. Complete Phase 4: User Story 2 - View Available Space (T023-T029)
5. **STOP and VALIDATE**: Test MVP independently - cargo visible with capacity info
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational (with unit tests) → Foundation ready with test coverage
2. Add User Story 1 → Test → Cargo grid displays items with names (MVP core)
3. Add User Story 2 → Test → Capacity information visible (MVP complete!)
4. Add User Story 3 → Test → Visual gauge enhancement
5. Edge Cases & Validation → E2E tests, edge case handling

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US1 and US2 are both P1 priority and together form the MVP
- US3 (P2) is an enhancement after MVP is complete
- Commit after each task or logical group
- Cargo store follows existing Pinia patterns (sensorStore, shipStore)
- Canvas rendering follows existing patterns (SystemMap, RadarDisplay)
- LCARS styling follows ADR-0005 guidelines
- **Test-First Compliance**: Unit tests (T012) are in Phase 2 before UI implementation per Constitution Principle III
- **Total Tasks**: 40 (was 36; added: T012 unit tests moved earlier, T018 cargo name display, T035-T037 edge cases)

