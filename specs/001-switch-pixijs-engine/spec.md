# Feature Specification: Switch to PixiJS Rendering Engine

**Feature Branch**: `001-switch-pixijs-engine`  
**Created**: 2026-01-24  
**Status**: Draft  
**Input**: User description: "I want to switch to Pixi.JS as detailed by 0013-pixijs-rendering-engine.md so that I have a good solid technical backbone for building a game with good performance and acceptable graphics and effects. This will help establish a technical basis as we layer on new effects."

## Clarifications

### Session 2026-01-24

- Q: What is the throttling/scaling priority when performance dips? → A: Combination priority: particles → effects intensity → resolution (last resort)
- Q: What triggers auto-throttling activation? → A: Avg FPS <58 for 2s OR 95th percentile frame time >25 ms for 5s
- Q: Which PixiJS version should production target? → A: PixiJS v8.15.0 (latest stable)
- Q: What is the runtime fallback policy (WebGL2/WebGL1/Canvas)? → A: Prefer WebGL2; fallback to WebGL1; if no WebGL available, halt with clear, actionable error message.
- Q: How should WebGL context loss be handled mid-session? → A: One automatic recovery attempt with state restore; if recovery fails or repeats within 30 seconds, halt with a clear message.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Smooth visuals in busy scenes (Priority: P1)

Players experience smooth visuals and responsive controls even in the busiest scenes (multiple ships, stations, particles) using the new renderer.

**Why this priority**: Core gameplay relies on readable, responsive visuals; performance regressions block all downstream features.

**Independent Test**: Load the densest scene available, run the new renderer, and verify sustained target frame rate with normal camera interactions.

**Acceptance Scenarios**:

1. **Given** a scene with 500+ renderable objects and UI overlays, **When** panning or zooming the camera for 5 minutes, **Then** frame rate holds at target and controls remain responsive.
2. **Given** effects such as selection highlights and engine trails are active, **When** the player issues navigation inputs, **Then** input latency stays below the acceptable threshold and no stutter occurs.

---

### User Story 2 - Cutover confidence without legacy toggle (Priority: P2)

QA can validate the Pixi-only renderer meets visual and interaction parity through test harnesses and visual comparisons, without runtime fallback to legacy code.

**Why this priority**: Clean cutover demands high confidence before removing legacy paths; validation must not depend on dual renderers at runtime.

**Independent Test**: Run automated and manual parity checks against captured baselines to confirm the Pixi-only build is production-ready.

**Acceptance Scenarios**:

1. **Given** a baseline capture set from pre-cutover visuals, **When** executing the Pixi-only build, **Then** parity checks confirm expected layers and elements are present for core screens (navigation/map, cargo, bridge overlays, selections, tooltips).
2. **Given** Pixi fails to initialize (e.g., no WebGL), **When** the app starts, **Then** the user receives a clear, actionable message explaining WebGL requirement and the app halts gracefully without rendering.

---

### User Story 3 - Showcasing enhanced effects (Priority: P3)

Designers can enable LCARS-style effects (glow, trails, particles) to improve polish without breaking performance budgets.

**Why this priority**: Visual differentiation is a brand goal; effects must be sustainable once performance headroom exists.

**Independent Test**: Enable enhanced effects presets and verify they run within agreed performance limits while preserving usability.

**Acceptance Scenarios**:

1. **Given** a core screen with effects enabled, **When** interacting with controls for 5 minutes, **Then** visuals remain stable and input latency stays within limits.
2. **Given** effect intensity is increased, **When** performance would dip below target, **Then** the system enforces caps or gracefully scales effects to protect responsiveness.

### Edge Cases

- Startup on browsers or environments without WebGL/GPU support; the app presents a clear, actionable error message and halts gracefully, avoiding partial launches or degraded rendering.
- Low-power or thermally throttled devices that cannot sustain target frame rates; effects density and resolution must scale down gracefully.
	The system reduces particle counts first, then effects intensity, and only lowers resolution as a last resort.
- Very high-resolution or HiDPI displays; resolution scaling must avoid blurring while keeping frame times within targets.
- Stress scenes with extreme particle counts or object density; system must preserve responsiveness by throttling effects before failing.
- Migration artifacts such as missing assets or incorrect layering after legacy code removal; detection must occur before release.
 - WebGL context loss mid-session; the app attempts one automatic recovery with state restore, and halts with a clear message if recovery fails or repeats within 30 seconds.

## Assumptions

- Legacy Canvas rendering will be fully removed after validation; no runtime toggle or fallback is retained.
 - Runtime fallback policy: Prefer WebGL2; fallback to WebGL1; if no WebGL available, halt with clear error message. No dual-runtime toggle is exposed to users.
- Baseline captures from pre-cutover visuals are available for parity comparison during QA but are not shipped or used at runtime.
- Performance targets reference current QA midrange hardware; higher-end machines may exceed targets, lower-end may require effect scaling.
- Asset formats (PNG/SVG-derived textures) and visual design guidelines stay consistent with existing pipelines.
 - Target rendering engine: PixiJS v8.15.0 (latest stable).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide a GPU-accelerated rendering pipeline using PixiJS v8.15.0 aligned with ADR-0013 as the sole production renderer, replacing Canvas runtime paths.
- **FR-002**: Achieve visual and interaction parity for current core screens (navigation/map, cargo, bridge overlays, selections, tooltips) prior to removing legacy rendering code.
- **FR-003**: Implement startup capability checks and select renderer path: prefer WebGL2; fallback to WebGL1; if no WebGL available, halt with clear, actionable error message explaining WebGL requirement.
- **FR-004**: Expose performance indicators (frame rate, frame time, memory use) in a debug/test view to validate success criteria during QA.
- **FR-005**: Render particle and effect systems (engine trails, thrusters, starfield) at scale with configurable caps and auto-throttling to protect frame rate targets.
	Scaling priority: reduce particle counts first; then effects intensity; and lower resolution as a last resort.
	Auto-throttling triggers: average FPS <58 for 2 seconds OR 95th percentile frame time >25 ms for 5 seconds.
- **FR-006**: Support layered rendering suitable for LCARS visual treatments (glows, highlights) while keeping input latency within acceptable limits during heavy scenes.
- **FR-007**: Remove legacy rendering code paths, toggles, and assets from builds, ensuring automated tests and deployments target the Pixi-only renderer.
 - **FR-008**: On WebGL context loss mid-session, attempt a single automatic recovery with state restore; if recovery fails or repeats within 30 seconds, halt with a clear, actionable message.

### Key Entities *(include if feature involves data)*

- **Rendering Layer**: Background, game, effects, and UI layers that define ordering, visibility, and scaling rules.
- **Renderable Object**: Ships, stations, cargo, and overlays with position, rotation, selection state, and effect eligibility.
- **Performance Profile**: Target frame rate, particle caps, scaling behaviors, and halt criteria used to govern throttling and user messaging.
	- Scaling Priority: particles → effects intensity → resolution (last resort)
	- Auto-throttling Triggers: avg FPS <58 for 2s OR 95th percentile frame time >25 ms for 5s
	- Context Loss Policy: one auto recovery attempt; halt if repeats within 30 seconds

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Busy scenes with 500+ renderable objects and active UI overlays sustain an average of ≥60 fps with 95th percentile frame times under 25 ms during 5 minutes of continuous camera pan/zoom.
- **SC-002**: Particle-heavy scenes with at least 5,000 active particles sustain ≥60 fps for 60 seconds without visible stutter and without memory growth exceeding 5% over the session.
- **SC-003**: Visual parity checks show 95% of compared screens have no missing elements or incorrect layering relative to captured baselines; remaining discrepancies are documented and resolved before release.
- **SC-004**: When WebGL/GPU is unavailable at startup, the app presents a clear, actionable error message within 2 seconds explaining WebGL requirement and halts gracefully; no rendering occurs and no dual runtime toggle is exposed.
- **SC-005**: LCARS-style effects enabled on core screens do not increase input latency beyond 100 ms and do not allow frame rate to drop below 55 fps during normal interactions.
