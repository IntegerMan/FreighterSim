# Tasks: Player Credits System

**Input**: Design documents from `/specs/005-player-credits/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included as per constitution requirement for test-first development.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Vue.js project**: `src/` at repository root
- **Tests**: Unit tests co-located (`*.test.ts`), E2E in `e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - this feature extends existing project infrastructure

*All project infrastructure already exists. Proceed to Foundational phase.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core store extensions that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No user story UI work can begin until store credits functionality is complete

- [ ] T001 Add credits state field and INITIAL_CREDITS constant to src/stores/gameStore.ts
- [ ] T002 Add formattedCredits computed property to src/stores/gameStore.ts
- [ ] T003 Modify initialize() to set credits to INITIAL_CREDITS in src/stores/gameStore.ts
- [ ] T004 Modify reset() to set credits to 0 in src/stores/gameStore.ts
- [ ] T005 Export credits and formattedCredits from store return statement in src/stores/gameStore.ts

**Checkpoint**: Credits store functionality ready - UI component and view integration can now begin

---

## Phase 3: User Story 1 - View Starting Credits (Priority: P1) 🎯 MVP

**Goal**: Player can see initial 10,000 Credits displayed on Bridge and Cargo screens

**Independent Test**: Start a new game and verify the credit display shows "10,000 Credits" on both Bridge and Cargo screens

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Write unit tests for credits initialization in src/stores/gameStore.test.ts
- [ ] T007 [P] [US1] Write unit tests for formattedCredits computed in src/stores/gameStore.test.ts
- [ ] T008 [P] [US1] Create component test file src/components/panels/CreditsPanel.test.ts with display tests

### Implementation for User Story 1

- [ ] T009 [US1] Create CreditsPanel.vue component in src/components/panels/CreditsPanel.vue
- [ ] T010 [US1] Add LCARS styling to CreditsPanel using gold color scheme per STYLE_GUIDE.md
- [ ] T011 [US1] Export CreditsPanel from src/components/panels/index.ts
- [ ] T012 [P] [US1] Add CreditsPanel import and usage to src/views/BridgeView.vue above NavigationPanel
- [ ] T013 [P] [US1] Add CreditsPanel import and usage to src/views/CargoView.vue above CargoPanel

**Checkpoint**: User Story 1 complete - credits visible on both screens with initial 10,000 value

---

## Phase 4: User Story 2 - Credits Persist Across Screen Navigation (Priority: P1)

**Goal**: Credit balance remains consistent when navigating between Bridge and Cargo screens

**Independent Test**: Navigate between Bridge and Cargo screens multiple times and verify the credit display remains consistent at 10,000 Credits

### Tests for User Story 2

> **NOTE: Pinia store state naturally persists - this is validation testing**

- [ ] T014 [P] [US2] Create E2E test file e2e/credits.spec.ts with navigation persistence tests

### Implementation for User Story 2

*No additional implementation required - Pinia store state automatically persists across Vue Router navigation. The tests validate this behavior works correctly.*

**Checkpoint**: User Story 2 validated - credits persist across all navigation

---

## Phase 5: User Story 3 - Credits Display Formatting (Priority: P2)

**Goal**: Credit balance displays with proper thousands separators and "Credits" label in LCARS styling

**Independent Test**: View credit display and verify it shows "10,000 Credits" with gold styling consistent with LCARS design

### Tests for User Story 3

- [ ] T015 [P] [US3] Add formatting tests to src/stores/gameStore.test.ts for edge cases (0, large numbers)
- [ ] T016 [P] [US3] Add E2E test for formatting validation in e2e/credits.spec.ts

### Implementation for User Story 3

*Formatting implementation is included in Phase 3 tasks (T009, T010). This phase validates proper formatting.*

**Checkpoint**: User Story 3 validated - formatting meets all acceptance criteria

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T017 Run all unit tests via `pnpm test` and verify passing
- [ ] T018 Run E2E tests via `pnpm test:e2e` and verify passing
- [ ] T019 Validate quickstart.md verification checklist in specs/005-player-credits/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - existing infrastructure used
- **Foundational (Phase 2)**: No dependencies - can start immediately - BLOCKS all UI work
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Can start after User Story 1 (E2E tests need UI)
- **User Story 3 (Phase 5)**: Can start after User Story 1 (validation of existing work)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational - Core MVP deliverable
- **User Story 2 (P1)**: Depends on User Story 1 - Tests navigation behavior
- **User Story 3 (P2)**: Depends on User Story 1 - Validates formatting quality

### Within Each Phase

```
Phase 2 (Foundational):
  T001 → T002 → T003 → T004 → T005 (sequential - same file)

Phase 3 (User Story 1):
  Tests (parallel): T006, T007, T008
  Then: T009 → T010 → T011
  Then (parallel): T012, T013

Phase 4 (User Story 2):
  T014 (E2E tests)

Phase 5 (User Story 3):
  Tests (parallel): T015, T016

Phase 6 (Polish):
  T017 → T018 → T019 (sequential validation)
```

### Parallel Opportunities

**Within Phase 3 (User Story 1):**
```
# Tests can run in parallel:
T006: Unit tests for credits initialization
T007: Unit tests for formattedCredits
T008: Component tests for CreditsPanel

# View integrations can run in parallel:
T012: Add CreditsPanel to BridgeView
T013: Add CreditsPanel to CargoView
```

**Within Phase 5 (User Story 3):**
```
# Validation tests can run in parallel:
T015: Store formatting edge case tests
T016: E2E formatting validation tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (store changes)
2. Complete Phase 3: User Story 1 (component + views)
3. **STOP and VALIDATE**: Test credits display independently
4. Demo: Show 10,000 Credits on Bridge and Cargo screens

### Incremental Delivery

1. Complete Foundational → Store ready
2. Add User Story 1 → Test independently → **MVP Ready!**
3. Add User Story 2 tests → Validates persistence → Demo
4. Add User Story 3 tests → Validates formatting → Complete

### Test-First Workflow (Constitution Requirement)

For each phase:
1. Write tests (T006-T008, T014, T015-T016)
2. Verify tests FAIL
3. Implement feature
4. Verify tests PASS
5. Commit

---

## Task Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Setup | 0 | - |
| Foundational | 5 | 0 |
| User Story 1 | 8 | 5 (T006-T008, T012-T013) |
| User Story 2 | 1 | 1 |
| User Story 3 | 2 | 2 |
| Polish | 3 | 0 |
| **Total** | **19** | **8** |

---

## Notes

- All store modifications (T001-T005) are in the same file and must be sequential
- Test-first development per ADR-0004: Write tests, verify fail, implement, verify pass
- CreditsPanel follows existing panel patterns (CargoPanel, NavigationPanel, SensorPanel)
- LCARS styling uses existing variables from `src/assets/styles/_variables.scss`
- No new dependencies required - uses existing Vue 3, Pinia, Vitest, Playwright stack
