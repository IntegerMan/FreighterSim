# Tasks: 2D Ship and Station Shape System

**Input**: Design documents from `/specs/005-2d-shape-system/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Unit tests included per Constitution Principle III (Test-First Development - NON-NEGOTIABLE). Coverage targets: core physics/rendering ≥90%, component integration ≥70%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- Shape models: `src/models/`
- Shape data: `src/data/shapes/`
- Rendering utilities: `src/core/rendering/`
- Physics utilities: `src/core/physics/`
- Vue components: `src/components/`
- Pinia stores: `src/stores/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create core shape model interfaces and type definitions

- [X] T001 Create shape model interfaces in src/models/Shape.ts (Shape, EngineMount, ShipTemplate, ShipCategory)
- [X] T002 [P] Create docking port interfaces in src/models/DockingPort.ts (DockingPort, DockingPortSize)
- [X] T003 [P] Create station module interfaces in src/models/StationModule.ts (StationModule, StationModuleType, StationModulePlacement, StationTemplate)
- [X] T004 Export all new shape models from src/models/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core rendering and physics infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create shape rendering utilities in src/core/rendering/shapeRenderer.ts (transformVertex, renderShape functions)
- [X] T005a [P] Create unit tests for shapeRenderer.ts in src/core/rendering/shapeRenderer.test.ts (TEST-FIRST: vertex transforms at 0°, 90°, 180°, 270° rotations; scaling; world-to-screen mapping)
- [X] T006 [P] Create collision detection utilities in src/core/physics/collision.ts (projectPolygon, checkPolygonCollision, getBoundingBox functions)
- [X] T006a [P] Create unit tests for collision.ts in src/core/physics/collision.test.ts (TEST-FIRST: SAT algorithm correctness, AABB overlap, penetration depth, collision normals, non-colliding polygons)
- [X] T007 [P] Create vector math helpers in src/core/physics/vectorMath.ts (vec2Sub, vec2Normalize, vec2Dot, rotatePoint functions)
- [X] T007a [P] Create unit tests for vectorMath.ts in src/core/physics/vectorMath.test.ts (TEST-FIRST: rotatePoint at cardinal angles, normalize unit vectors, dot product edge cases)
- [X] T008 Export physics utilities from src/core/physics/index.ts
- [X] T009 Export rendering utilities from src/core/rendering/index.ts
- [X] T010 Extend Ship interface with templateId and size properties in src/models/Ship.ts
- [X] T011 [P] Extend Station interface with templateId and rotation properties in src/models/Station.ts

**Checkpoint**: Foundation ready with test coverage - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Detailed Ship and Station Shapes (Priority: P1) 🎯 MVP

**Goal**: Render ships and stations as detailed 2D polygon shapes instead of dots/circles on the sensor display

**Independent Test**: View the sensor/map display and verify that the player's ship appears as a Serenity-inspired silhouette, other ships have distinct shapes, and stations have recognizable modular structures

### Shape Data Definitions

- [X] T012 [P] [US1] Create player ship (Serenity) shape definition in src/data/shapes/playerShip.ts with 20-vertex polygon and 3 engine mounts
- [X] T013 [P] [US1] Create freighter ship shape definition in src/data/shapes/npcShips.ts (16-vertex boxy cargo hauler)
- [X] T014 [P] [US1] Create cutter ship shape definition in src/data/shapes/npcShips.ts (12-vertex sleek triangular patrol vessel)
- [X] T015 [P] [US1] Create cruiser ship shape definition in src/data/shapes/npcShips.ts (20-vertex elongated military vessel)
- [X] T016 [P] [US1] Create destroyer ship shape definition in src/data/shapes/npcShips.ts (24-vertex wedge-shaped military vessel)
- [X] T017 [P] [US1] Create liner ship shape definition in src/data/shapes/npcShips.ts (20-vertex rounded passenger transport)
- [X] T018 [P] [US1] Create station module shapes in src/data/shapes/stationModules.ts (core, docking-ring, habitat, cargo, solar-array, antenna, refinery, command)
- [X] T019 [US1] Create station templates in src/data/shapes/stations.ts (trading-hub, mining-outpost) using module composition
- [X] T020 [US1] Export all shape data from src/data/shapes/index.ts

### Template Registries

- [X] T021 [US1] Create ship template registry with lookup functions in src/data/shapes/shipRegistry.ts
- [X] T022 [P] [US1] Create station template registry with lookup functions in src/data/shapes/stationRegistry.ts

### Map Rendering Integration

- [X] T023 [US1] Integrate shape renderer into SystemMap.vue for player ship rendering in src/components/map/SystemMap.vue
- [X] T024 [US1] Add NPC ship shape rendering to SystemMap.vue with fallback to circle for ships without templateId
- [X] T025 [US1] Add station shape rendering to SystemMap.vue with module composition support
- [X] T026 [US1] Implement LOD (level of detail) system - render as dot when shape is sub-pixel sized in src/core/rendering/shapeRenderer.ts

**Checkpoint**: Player ship displays as Serenity silhouette, NPC ships have distinct shapes, stations have modular structure visible

---

## Phase 4: User Story 2 - Identify Engine Locations via Sensor Noise (Priority: P2)

**Goal**: Particle traces emanate from specific engine mount locations on ships rather than ship centers

**Independent Test**: Observe that the player's ship shows three distinct engine trace origins (center, port, starboard) and other ships show traces from their designated engine points

### Particle System Extension

- [X] T027 [US2] Add registerShipEngines function to particleStore.ts in src/stores/particleStore.ts
- [X] T028 [US2] Add unregisterShipEngines function to particleStore.ts in src/stores/particleStore.ts
- [X] T029 [US2] Create localToWorld transform helper for engine mount positions in src/stores/particleStore.ts
- [X] T029a [US2] Create unit tests for engine particle emission in src/stores/particleStore.test.ts (TEST-FIRST: verify particles spawn at correct engine mount world positions for rotated ships, test 3 engines for player ship, test mount registration/unregistration)

### Ship Engine Integration

- [X] T030 [US2] Update shipStore to register player ship engines on initialization in src/stores/shipStore.ts
- [-] T031 [US2] Update shipStore to register NPC ship engines when ships are added in src/stores/shipStore.ts (DEFERRED: No NPC ship tracking system exists yet - useNPCShipEngines composable ready when needed)
- [-] T032 [US2] Update shipStore to unregister ship engines when ships are removed in src/stores/shipStore.ts (DEFERRED: No NPC ship tracking system exists yet)
- [X] T033 [US2] Remove legacy single-point particle emission for ships with templateId in src/stores/particleStore.ts

**Checkpoint**: Engine particle traces originate from defined engine mount points on all ships with templates

---

## Phase 5: User Story 3 - Collision Detection with Ship Shapes (Priority: P3)

**Goal**: Collision detection uses actual ship and station polygon boundaries instead of simple radius checks

**Independent Test**: Pilot the ship near obstacles and verify collision warnings trigger based on hull proximity, not center-point distance

### Collision System Implementation

- [X] T034 [US3] Create world-space vertex transformer for collision checks in src/core/physics/collision.ts
- [X] T035 [US3] Add AABB bounding box pre-check optimization in src/core/physics/collision.ts
- [X] T036 [US3] Implement getWorldVertices function to transform shape vertices to world coordinates in src/core/physics/collision.ts
- [X] T036a [US3] Create unit tests for world-space collision in src/core/physics/collision.test.ts (TEST-FIRST: verify getWorldVertices with rotation/translation, test collisions between rotated shapes at various positions, test near-miss scenarios)

### Navigation Store Integration

- [X] T037 [US3] Create shape-based collision check function in navigationStore in src/stores/navigationStore.ts
- [X] T038 [US3] Update proximity warning system to use shape collision instead of radius in src/stores/navigationStore.ts
- [X] T039 [US3] Add swept collision detection for high-speed movement in src/core/physics/collision.ts
- [X] T039a [US3] Create unit tests for swept collision in src/core/physics/collision.test.ts (TEST-FIRST: verify collision detection for fast-moving ships that would tunnel through obstacles, test movement vectors at various speeds)
- [X] T040 [US3] Implement collision response with penetration normal for push-out in src/stores/useShipCollision.ts
- [X] T040a [US3] Create unit tests for navigationStore collision in src/stores/navigationStore.test.ts (TEST-FIRST: verify shape-based proximity warnings, test collision response push-out direction, test ship movement blocked by obstacles)

### Helm Integration

- [X] T041 [US3] Update HelmMap.vue to display collision warnings based on shape proximity in src/components/map/HelmMap.vue
- [X] T042 [US3] Add visual indicator for collision contact points in src/components/map/HelmMap.vue

**Checkpoint**: Collision detection accurately reflects actual hull boundaries, not bounding circles

---

## Phase 6: User Story 4 - Docking at Designated Docking Areas (Priority: P4)

**Goal**: Ships can only dock at designated docking ports on stations, requiring proper approach and alignment

**Independent Test**: Approach a station's docking port, align correctly, and verify docking is only available when properly positioned at a designated port

### Docking Port System

- [X] T043 [US4] Create docking port availability check function in src/stores/navigationStore.ts
- [X] T044 [US4] Implement approach vector alignment validation in src/stores/navigationStore.ts
- [X] T045 [US4] Implement heading alignment tolerance check in src/stores/navigationStore.ts
- [X] T046 [US4] Implement docking range distance check in src/stores/navigationStore.ts

### Docking UI Integration

- [X] T047 [US4] Add visual docking port indicators to station rendering in src/components/map/SystemMap.vue
- [X] T048 [US4] Create docking approach guidance overlay in src/components/map/HelmMap.vue
- [X] T049 [US4] Add docking status indicator to HelmView showing alignment/distance in src/views/HelmView.vue
- [X] T050 [US4] Update docking action to validate port alignment before allowing dock in src/stores/navigationStore.ts

### Tractor Beam Docking Enhancement

- [X] T050a [US4] Implement tractor beam state and movement control in src/stores/shipStore.ts
- [X] T050b [US4] Add tractor beam engage/disengage functions for docking assistance in src/stores/shipStore.ts
- [X] T050c [US4] Update HelmView docking to use tractor beam for guided docking in src/views/HelmView.vue
- [X] T050d [US4] Add tractor beam visual effect (animated beam) in src/components/map/HelmMap.vue
- [X] T050e [US4] Add tractor beam UI status indicator in src/views/HelmView.vue
- [X] T050f [US4] Add dotted docking position indicator showing ship's target position in src/components/map/SystemMap.vue

**Checkpoint**: Docking only succeeds when properly aligned with a designated docking port, with tractor beam assistance

---

## Phase 7: User Story 5 - Raytracing for Complex Sensor Contacts (Priority: P5)

**Goal**: Sensor system uses 2D raytracing against polygon shapes for realistic occlusion and detection

**Independent Test**: Position objects between sensor origin and target, verify the target's sensor contact is affected by obstruction

### Raycasting Implementation

- [X] T051 [US5] Create ray-polygon intersection function in src/core/physics/raycasting.ts
- [X] T051a [US5] Create unit tests for ray-polygon intersection in src/core/physics/raycasting.test.ts (TEST-FIRST: ray hits polygon, ray misses polygon, ray origin inside polygon, ray tangent to edge, ray parallel to edge)
- [X] T052 [US5] Create raycast against all objects function with nearest-hit detection in src/core/physics/raycasting.ts
- [X] T052a [US5] Create unit tests for multi-object raycast in src/core/physics/raycasting.test.ts (TEST-FIRST: nearest hit returned, multiple hits ordered by distance, no hits returns null)
- [X] T053 [US5] Export raycasting utilities from src/core/physics/index.ts

### Sensor Integration

- [X] T054 [US5] Update sensorStore to use raytracing for contact detection in src/stores/sensorStore.ts
- [X] T055 [US5] Implement sensor occlusion calculation based on blocking objects in src/stores/sensorStore.ts
- [X] T056 [US5] Add partial occlusion detection for partially visible contacts in src/stores/sensorStore.ts
- [X] T056a [US5] Create unit tests for sensor occlusion in src/stores/sensorStore.test.ts (TEST-FIRST: verify full occlusion when object blocks sensor ray, partial occlusion for large objects, no occlusion for clear line of sight, verify sensors perceive ship shapes correctly at different orientations)

### Sensor Display Integration

- [X] T057 [US5] Update RadarDisplay.vue to show occluded contacts differently in src/components/sensors/RadarDisplay.vue
- [X] T058 [US5] Add sensor ray visualization option for debugging in src/components/sensors/RadarDisplay.vue
- [X] T059 [US5] Update contact shape rendering to reflect orientation-based profile in src/components/sensors/RadarDisplay.vue

**Checkpoint**: Sensor contacts are affected by occlusion from intervening objects

---

## Phase 8: Integration Testing & E2E

**Purpose**: End-to-end tests validating full feature integration

- [X] T060 [P] Create E2E test for ship shape rendering on SystemMap in e2e/shapes.spec.ts (verify player ship displays as polygon, NPC ships have distinct shapes)
- [X] T061 [P] Create E2E test for station shape rendering in e2e/shapes.spec.ts (verify modular station composition visible)
- [X] T062 Create E2E test for engine particle traces in e2e/shapes.spec.ts (verify 3 particle origins on player ship)
- [X] T063 Create E2E test for collision detection in e2e/navigation.spec.ts (verify collision warning triggers on hull proximity)
- [X] T064 Create E2E test for sensor raytracing in e2e/sensors.spec.ts (verify occlusion affects contact visibility)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, optimization, and final validation

- [X] T065 [P] Add JSDoc documentation to all shape model interfaces in src/models/Shape.ts
- [X] T066 [P] Add JSDoc documentation to collision functions in src/core/physics/collision.ts
- [X] T067 [P] Add JSDoc documentation to rendering functions in src/core/rendering/shapeRenderer.ts
- [X] T068 Implement graceful fallback to circle rendering when shape data is missing or corrupted
- [X] T069 [P] Performance optimization: Cache transformed vertices per frame in shapeRenderer.ts
- [X] T070 [P] Performance optimization: Spatial partitioning for collision checks with many objects
- [X] T071 Run quickstart.md validation to ensure all integration points work correctly
- [X] T072 [P] Refactor docking guidance rendering into `src/core/rendering/dockingGuidance.ts` and add unit tests in `dockingGuidance.test.ts` (improves testability and isolates runway geometry + active-port logic)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories; includes unit tests per test-first principle
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion (including unit tests)
  - User stories can proceed in priority order (P1 → P2 → P3 → P4 → P5)
  - US1 and US2 have no cross-dependencies and could run in parallel
  - US3 depends on US1 (needs shapes to check collision against)
  - US4 depends on US1 and US3 (needs shapes and collision)
  - US5 depends on US1 (needs shapes for raycasting)
- **Integration Testing (Phase 8)**: Depends on all user stories being implemented - E2E validation
- **Polish (Phase 9)**: Depends on E2E tests passing

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (can run parallel with US1)
- **User Story 3 (P3)**: Depends on User Story 1 (needs ship/station shapes defined)
- **User Story 4 (P4)**: Depends on User Stories 1 and 3 (needs shapes and collision detection)
- **User Story 5 (P5)**: Depends on User Story 1 (needs shapes for raycasting)

### Within Each User Story

- **TEST-FIRST**: Write unit tests before implementation code
- Models/interfaces before implementations
- Data definitions before registry lookups
- Core utilities before store integration
- Store logic before component integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:

- T002, T003 can run in parallel (different model files)

**Phase 2 (Foundational)**:

- T005a, T006a, T007a can run in parallel (different test files)
- T006, T007 can run in parallel (different utility files)
- T010, T011 can run in parallel (different model files)

**Phase 3 (US1)**:

- T012-T018 can all run in parallel (different shape data files)
- T021, T022 can run in parallel (different registry files)

**Phase 4 (US2)**:

- T029a (unit tests) before T027-T029 implementation

**Phase 5 (US3)**:

- T036a, T039a (unit tests) can run in parallel
- T034-T036 can run in parallel as utility functions

**Phase 6 (US4)**:

- T043-T046 can run in parallel as validation functions

**Phase 7 (US5)**:

- T051a, T052a (unit tests) before implementation
- T056a tests sensor integration

**Phase 7 (US5)**:

- T051, T052 are sequential (raycasting depends on intersection)

---

## Parallel Example: User Story 1 Shape Definitions

```bash
# Launch all shape data definitions together:
Task T012: "Create player ship (Serenity) shape definition in src/data/shapes/playerShip.ts"
Task T013: "Create freighter ship shape definition in src/data/shapes/npcShips.ts"
Task T014: "Create cutter ship shape definition in src/data/shapes/npcShips.ts"
Task T015: "Create cruiser ship shape definition in src/data/shapes/npcShips.ts"
Task T016: "Create destroyer ship shape definition in src/data/shapes/npcShips.ts"
Task T017: "Create liner ship shape definition in src/data/shapes/npcShips.ts"
Task T018: "Create station module shapes in src/data/shapes/stationModules.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: User Story 1 (T012-T026)
4. **STOP and VALIDATE**: Test that ships and stations render as polygon shapes
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test shape rendering → Deploy/Demo (MVP!)
3. Add User Story 2 → Test engine particle traces → Deploy/Demo
4. Add User Story 3 → Test shape-based collision → Deploy/Demo
5. Add User Story 4 → Test docking ports → Deploy/Demo
6. Add User Story 5 → Test sensor raytracing → Deploy/Demo
7. Each story adds value without breaking previous stories

### Suggested MVP Scope

**Minimum Viable Product = User Story 1 only**

- Ships and stations render as detailed 2D shapes
- Player ship appears as Serenity-inspired silhouette
- Distinct visual identity for different ship types
- Stations have modular structure visible
- Total tasks for MVP: 26 (T001-T026)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify visual rendering after each story phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Graceful degradation: ships/stations without templateId continue to render as circles
- **Test-First Compliance**: Unit tests (T005a, T006a, T007a, T029a, T036a, T039a, T040a, T051a, T052a, T056a) written before implementation per Constitution Principle III
- **Total Tasks**: 77 (includes 10 unit test tasks + 5 E2E test tasks + 6 tractor beam tasks)
- Graceful degradation: ships/stations without templateId continue to render as circles

### Additional Enhancements (Added during implementation)

- **World Scale**: Increased station/planet distances in kestrelReach.ts for better "space is vast" feeling
- **Station Visual Scale**: Station modules render at 60% of docking range with proper module scaling (0.25x)
- **Docking Range Scaling**: Station types have appropriate docking ranges (200 for trading hub, 150 for mining, 100 for fuel depot)
- **Tractor Beam System**: Ships are pulled to exact docking position with animated visual effect
- **Docking Position Indicator**: Dotted circle shows exactly where ship should position for docking
