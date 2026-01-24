# Implementation Plan: 2D Ship and Station Shape System

**Branch**: `005-2d-shape-system` | **Date**: January 23, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-2d-shape-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Implement a 2D polygon-based shape system for ships and stations to replace simple dot/circle rendering. The system will support:
- Serenity-inspired player ship with three engine mount points (center, port, starboard)
- Multiple NPC ship types (freighters, cutters, cruisers, destroyers, passenger transports)
- Modular station composition with docking ports
- Shape-based collision detection replacing radius-based checks
- Engine-origin particle traces via existing particleStore
- 2D raytracing for sensor occlusion

Technical approach uses normalized local coordinates (-1 to 1) scaled at runtime, polygon rendering via Canvas 2D API, and the Separating Axis Theorem (SAT) for collision detection.

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode  
**Primary Dependencies**: Vue 3 (Composition API), Pinia (state management), Vite (build)  
**Storage**: N/A (all shapes defined in code initially, static game data)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web browser (HTML5 Canvas rendering)  
**Project Type**: Single web application  
**Performance Goals**: 60 FPS with 20+ complex-shaped objects rendered simultaneously  
**Constraints**: Canvas rendering optimizations required; no DOM mutations in hot paths  
**Scale/Scope**: 5-7 ship types, 2-3 station types, polygon complexity 16-32 vertices per ship

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game-First Architecture | ✅ PASS | Shape definitions in `/src/models/`, rendering in `/src/core/rendering/`, decoupled from Vue components |
| II. Type Safety & Composition API | ✅ PASS | All shapes typed with TypeScript interfaces, Pinia stores for shape state |
| III. Test-First Development | ✅ PASS | Unit tests for collision detection, shape transforms, polygon math; E2E for visual rendering |
| IV. Canvas Rendering Optimization | ✅ PASS | Polygon rendering batched per frame, pre-calculated transforms, no DOM in hot paths |
| V. UI/UX Consistency: LCARS Design | ✅ PASS | Ships/stations rendered using LCARS color palette (Purple #9966FF, Gold #FFCC00, White #FFFFFF) |

**Gate Status**: PASSED - All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/005-2d-shape-system/
├── plan.md              # This file
├── research.md          # Phase 0 output - collision algorithms, polygon rendering
├── data-model.md        # Phase 1 output - shape, engine, docking port models
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - TypeScript interfaces
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── models/
│   ├── Shape.ts           # NEW: Shape, ShipTemplate, StationTemplate interfaces
│   ├── Engine.ts          # NEW: Engine, EngineMount interfaces
│   ├── DockingPort.ts     # NEW: DockingPort interface
│   ├── Ship.ts            # MODIFY: Add shape and engine references
│   └── Station.ts         # MODIFY: Add shape and docking port references
├── core/
│   ├── rendering/
│   │   ├── shapeRenderer.ts    # NEW: Polygon rendering utilities
│   │   └── mapUtils.ts         # MODIFY: Use shape renderer for ships/stations
│   └── physics/
│       └── collision.ts        # NEW: SAT-based collision detection
├── data/
│   └── shapes/
│       ├── playerShip.ts       # NEW: Serenity-inspired shape definition
│       ├── npcShips.ts         # NEW: Freighter, cutter, cruiser, etc.
│       └── stations.ts         # NEW: Station module and template definitions
├── stores/
│   └── particleStore.ts        # MODIFY: Support multiple engine mount origins
└── components/
    ├── map/
    │   └── SystemMap.vue       # MODIFY: Render shapes instead of icons
    └── sensors/
        └── RadarDisplay.vue    # MODIFY: Render shapes, implement raytracing
```

**Structure Decision**: Follows existing single-project structure with shapes in `/src/models/`, rendering utilities in `/src/core/rendering/`, and static shape data in `/src/data/shapes/`.

## Complexity Tracking

No constitution violations requiring justification.
