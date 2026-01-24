# Tasks: Parallax Starfield Background

**Input**: Design documents from `/specs/006-parallax-starfield/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Included - plan.md specifies test-first development (Constitution Principle III)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Core game logic: `src/core/starfield/`
- Type definitions: `src/models/`
- E2E tests: `e2e/`

---

## Phase 1: Setup

**Purpose**: Create project structure for starfield feature

- [ ] T001 Create directory structure at src/core/starfield/
- [ ] T002 [P] Create placeholder index.ts at src/core/starfield/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and deterministic algorithms that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create Star, StarfieldLayerConfig, StarfieldConfig, StarfieldLayer interfaces in src/models/Starfield.ts
- [ ] T004 [P] Implement mulberry32 seeded PRNG function in src/core/starfield/StarGenerator.ts
- [ ] T005 [P] Implement hashString deterministic hashing function in src/core/starfield/StarGenerator.ts
- [ ] T006 Export Starfield types from src/models/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Parallax Motion During Flight (Priority: P1)

**Goal**: Stars shift at different speeds based on depth layer, creating immersive depth perception during ship movement

**Independent Test**: Fly ship in any direction; observe near stars move faster than far stars

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] Unit test: starToScreen applies parallax factor correctly in src/core/starfield/StarGenerator.test.ts
- [ ] T008 [P] [US1] Unit test: getVisibleCells returns cells with buffer zone for smooth scrolling in src/core/starfield/StarGenerator.test.ts
- [ ] T009 [P] [US1] Unit test: Starfield.render draws all layers back-to-front in src/core/starfield/Starfield.test.ts

### Implementation for User Story 1

- [ ] T010 [US1] Implement starToScreen function with parallax factor in src/core/starfield/StarGenerator.ts
- [ ] T011 [US1] Implement getVisibleCells function with buffer zones and zoom-aware culling in src/core/starfield/StarGenerator.ts
- [ ] T012 [US1] Implement Starfield.render method for multi-layer parallax rendering in src/core/starfield/Starfield.ts

**Checkpoint**: Parallax effect works - near stars move faster than far stars during viewport changes

---

## Phase 4: User Story 2 - Consistent Star Positions (Priority: P2)

**Goal**: Stars appear in identical positions when returning to previously visited coordinates

**Independent Test**: Note star pattern at position (X,Y), fly away, return - pattern matches

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US2] Unit test: mulberry32 produces identical sequences from same seed in src/core/starfield/StarGenerator.test.ts
- [ ] T014 [P] [US2] Unit test: hashString produces consistent hashes for same input in src/core/starfield/StarGenerator.test.ts
- [ ] T015 [P] [US2] Unit test: generateStarsForCell returns identical stars for same coordinates in src/core/starfield/StarGenerator.test.ts

### Implementation for User Story 2

- [ ] T016 [US2] Implement generateStarsForCell with seeded PRNG using cell coordinates in src/core/starfield/StarGenerator.ts
- [ ] T017 [US2] Implement cell-based caching in Starfield class to store generated stars in src/core/starfield/Starfield.ts
- [ ] T018 [US2] Implement cache pruning for off-screen cells to manage memory in src/core/starfield/Starfield.ts

**Checkpoint**: Same coordinates always show same star patterns across sessions

---

## Phase 5: User Story 3 - Visual Depth Through Star Variation (Priority: P3)

**Goal**: Stars vary in size and brightness across 3+ distinct depth layers

**Independent Test**: Observe starfield while stationary; identify 3 visually distinct layers

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T019 [P] [US3] Unit test: DEFAULT_LAYER_CONFIGS defines 3 layers with distinct parallax factors in src/core/starfield/starfieldConfig.ts
- [ ] T020 [P] [US3] Unit test: Star radius and brightness fall within configured layer ranges in src/core/starfield/Starfield.test.ts

### Implementation for User Story 3

- [ ] T021 [US3] Create DEFAULT_LAYER_CONFIGS with near (1.0x), mid (0.5x), far (0.25x) layers and STAR_COLORS palette in src/core/starfield/starfieldConfig.ts
- [ ] T022 [US3] Implement createDefaultStarfieldConfig factory function in src/core/starfield/starfieldConfig.ts
- [ ] T023 [US3] Apply layer-specific radius and brightness ranges in star generation in src/core/starfield/StarGenerator.ts

**Checkpoint**: 3 distinct visual layers are distinguishable - near stars are larger/brighter than far stars

---

## Phase 6: Polish & Integration

**Purpose**: Vue component integration and E2E verification

- [ ] T024 [P] Export Starfield class and config utilities from src/core/starfield/index.ts
- [ ] T025 Integrate starfield rendering in src/components/map/HelmMap.vue (render after clear, before grid)
- [ ] T026 Integrate starfield rendering in src/components/map/SystemMap.vue (same pattern)
- [ ] T027 [P] Create E2E test for starfield visibility in Helm view in e2e/starfield.spec.ts
- [ ] T028 [P] Create E2E test for parallax effect during ship movement in e2e/starfield.spec.ts
- [ ] T030 [P] Unit test: starfield handles extreme coordinates without precision errors in src/core/starfield/Starfield.test.ts
- [ ] T031 [P] Unit test: parallax remains smooth at maximum ship velocity in src/core/starfield/Starfield.test.ts
- [ ] T032 [P] Unit test: star rendering scales appropriately at zoom extremes in src/core/starfield/Starfield.test.ts
- [ ] T029 Run full verification: npm run test:run && npm run test:e2e && npm run lint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Parallax): Core feature, can start after Phase 2
  - US2 (Consistency): Can start after Phase 2, independent of US1
  - US3 (Visual Depth): Can start after Phase 2, independent of US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Uses PRNG and types from Phase 2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on PRNG implementation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Builds on type definitions

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Functions before classes that use them
- Core logic before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002: Setup tasks can run in parallel
- T004, T005: PRNG functions can be implemented in parallel
- T007, T008, T009: US1 tests can be written in parallel
- T013, T014, T015: US2 tests can be written in parallel
- T019, T020: US3 tests can be written in parallel
- T024, T027, T028, T030, T031, T032: Export, E2E, and edge case tests can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together:
Task: "Unit test: starToScreen applies parallax factor correctly in src/core/starfield/StarGenerator.test.ts"
Task: "Unit test: getVisibleCells returns cells with buffer zone in src/core/starfield/StarGenerator.test.ts"
Task: "Unit test: Starfield.render draws all layers back-to-front in src/core/starfield/Starfield.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test parallax effect independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test parallax -> Deploy/Demo (MVP!)
3. Add User Story 2 -> Test consistency -> Deploy/Demo
4. Add User Story 3 -> Test visual depth -> Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Parallax)
   - Developer B: User Story 2 (Consistency)
   - Developer C: User Story 3 (Visual Depth)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
