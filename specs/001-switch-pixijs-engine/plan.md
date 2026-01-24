# Implementation Plan: Switch to PixiJS Rendering Engine

**Branch**: `001-switch-pixijs-engine` | **Date**: 2026-01-24 | **Spec**: specs/001-switch-pixijs-engine/spec.md
**Input**: Feature specification from specs/001-switch-pixijs-engine/spec.md

**Note**: Generated via /speckit.plan workflow.

## Summary

- Primary requirement: Replace Canvas runtime paths with PixiJS v8.15.0 as the sole production renderer per ADR-0013.
- Technical approach: Implement GPU-accelerated rendering with layered scene graph (background/game/effects/UI), capability detection (WebGL2→WebGL1→Canvas fallback), and auto-throttling to maintain ≥60 fps.

## Technical Context

**Language/Version**: TypeScript 5+  
**Primary Dependencies**: Vue 3 (Composition API), Pinia, Vite, PixiJS v8.15.0  
**Storage**: N/A (frontend-only feature)  
**Testing**: Vitest (unit), Playwright (E2E), ESLint + Prettier (lint/format)  
**Target Platform**: Modern web browsers (WebGL2 preferred; WebGL1 fallback; Canvas last resort)  
**Project Type**: Web application (SPA)  
**Performance Goals**: Sustain ≥60 fps in busy scenes; 95th percentile frame time ≤25 ms; input latency ≤100 ms  
**Constraints**: Auto-throttle with priority: particles → effects intensity → resolution; single auto recovery on WebGL context loss, then halt if repeats within 30s  
**Scale/Scope**: Parity for core screens (navigation/map, cargo, bridge overlays, selections, tooltips); handle 500+ objects and ≥5,000 particles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Test-First Development: Unit tests before implementation; E2E (Playwright) and ESLint must pass to mark feature complete. Plan aligns with III. Test-First Development.
- Rendering Technology: Constitution specifies HTML5 Canvas for system map (IV). ADR-0013 proposes PixiJS engine. This plan proceeds under ADR-0013 with documented justification; Constitution update pending. Gate allowed with justification.
- Type Safety & Composition API: Uses TypeScript strict mode and Vue 3 Composition API with Pinia, compliant with II.
- UI/UX Consistency: LCARS design preserved; effects implemented within performance budgets, compliant with V.

Result: Proceed with Phase 0. One justified divergence (Rendering engine per ADR-0013).

Post-Design Re-check: Phase 1 artifacts (research.md, data-model.md, contracts, quickstart) maintain compliance with all principles except the rendering technology clause, which remains justified by ADR-0013. Tests and lint gates will be enforced in Phase 2.

## Project Structure

### Documentation (this feature)

```text
specs/001-switch-pixijs-engine/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (decisions & rationale)
├── data-model.md        # Phase 1 output (entities & validations)
├── quickstart.md        # Phase 1 output (run & test instructions)
├── contracts/           # Phase 1 output (OpenAPI for debug endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created here)
```

### Source Code (repository root)

```text
src/
├── core/                # Rendering engine integration, capability checks
├── components/          # UI components (LCARS)
├── stores/              # Pinia stores (renderer state, performance)
├── views/               # Core screens (navigation/map, cargo, bridge)
└── assets/              # Textures, sprites

tests/
├── unit/                # Vitest unit tests
├── integration/         # Component/system interactions
└── e2e/                 # Playwright scenarios (existing)
```

**Structure Decision**: Web application (SPA) using existing Vue/TypeScript structure; renderer integration centered in src/core/, state in src/stores/, and UI in src/components/ and src/views/.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Rendering tech divergence from Constitution IV | ADR-0013 mandates PixiJS for GPU acceleration and effects | Canvas paths cannot meet performance/effects goals at scale; ADR accepted |
