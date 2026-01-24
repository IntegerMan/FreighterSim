# Research Summary: Switch to PixiJS Rendering Engine

## Renderer Selection
- Decision: Use PixiJS v8.15.0 as the sole production renderer.
- Rationale: GPU-accelerated scene graph with mature effects support (particles, glows), strong performance on modern browsers; aligns with ADR-0013.
- Alternatives considered: Continue with HTML5 Canvas (rejected due to limited effect capabilities and scaling), Three.js (overkill for 2D map, higher complexity), pure DOM/SVG (performance constraints at required scales).

## Capability Detection & Fallback
- Decision: Prefer WebGL2; fallback to WebGL1; if unavailable, fallback to Canvas with degraded features.
- Rationale: Maximize performance/features while guaranteeing operability on constrained environments.
- Alternatives considered: Hard fail on no WebGL (rejected for accessibility), dual-runtime toggle (rejected to avoid complexity and ensure clean cutover).

## Auto-Throttling & Performance Targets
- Decision: Maintain ≥60 fps; enforce auto-throttling with priority: particles → effects intensity → resolution (last resort).
- Triggers: Average FPS <58 for 2 seconds OR 95th percentile frame time >25 ms for 5 seconds.
- Rationale: Protect responsiveness while preserving visual quality; clear thresholds simplify QA.
- Alternatives considered: Manual-only tuning (rejected; non-deterministic), aggressive resolution scaling first (rejected; degrades UX on HiDPI).

## Layering & LCARS Effects
- Decision: Establish layers: background, game, effects, UI; apply LCARS-style glows/highlights within performance budgets.
- Rationale: Clear ordering for visuals and interaction; isolates effects for scaling.
- Alternatives considered: Single-layer composition (rejected; mixing concerns and harder caps).

## Context Loss Handling
- Decision: Attempt one automatic WebGL context recovery with state restore; halt with message if recovery fails or repeats within 30 seconds.
- Rationale: Avoid silent failures; maintain stability under GPU constraints.
- Alternatives considered: Infinite retries (rejected; can cause loops), immediate halt (rejected; reduces resilience).

## Debug/QA Instrumentation
- Decision: Expose performance indicators (fps, frame time, memory) in debug/test view; provide endpoints/contracts for instrumentation.
- Rationale: Supports validation against Success Criteria and automated checks.
- Alternatives considered: Ad-hoc logging only (rejected; insufficient for parity checks).

## Constitution Alignment
- Decision: Proceed despite Constitution IV Canvas clause; justified by ADR-0013. Plan requires Constitution update to reflect PixiJS.
- Rationale: Canvas paths insufficient for required effects and scale; ADR documents governance and technical basis.

---
Status: All NEEDS CLARIFICATION items from Technical Context resolved.