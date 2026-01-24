# ADR-0014: Docking & Docking Lights (As‑Is)

## Status

Accepted

## Context

This ADR documents the *current* (as‑is) docking behaviour and visual signaling in the codebase so the project has a canonical, accepted reference point.

At present, docking operates as a simple proximity/threshold interaction around a station: when a ship comes within a configured radius of a station's center the game considers docking to be triggered. There is no authoritative concept of per‑port occupancy, no enforced alignment or strict speed checks, and no in‑world docking light system implemented. Autopilot and UI tooling navigate to station proximity rather than to discrete named ports.

Some shape metadata related to docking ports exists in shape/station data (from the 2D shape work), but it is not relied on for runtime docking decisions; docking logic continues to treat stations as single docking radii.

## Decision

We will accept and document the current behaviour as the project's canonical implementation for now:

- Docking is proximity‑based around the station center (radius check) and treated as a single logical "dock" per station.
- No port reservation, occupancy, or multi‑port allocation is enforced.
- No alignment/velocity gating is required to register a dock event unless a specific station implements custom checks.
- No dedicated in‑world docking light system is present; any visual feedback is provided via HUD/UI messages rather than persistent station lights.

This ADR is **Accepted** to make the present system explicit. Future changes (e.g., adding per‑port state machines, reservation models, or in‑world light guidance) should create new ADRs that explicitly supersede this record.

## Consequences

### Positive

- Simplicity: current behaviour is easy to reason about and maintain
- Low implementation cost: minimal state and no complex reservation/timeout logic
- Predictable for current autopilot/UI code that already relies on station proximity

### Negative

- Realism: docking feels less realistic—ships can "dock" without proper alignment or approach behavior
- UX: lack of explicit ports and light cues makes autopilot and player decision‑making less precise
- Conflict handling: without port occupancy, simultaneous docking attempts can clash or produce ambiguous results

## Alternatives Considered

1. Formalize ports and a docking state machine (per‑port reservations & approach constraints)

- Provides much better UX and predictable autopilot behaviour, but adds complexity and data authoring needs.
- Would require a new ADR and implementation work to replace this as‑is behaviour.

2. Add in‑world docking lights and guidance without changing the underlying docking model

- Improves user feedback quickly, but doesn't solve port occupancy or approach determinism.

Both alternatives are valid future directions; they should be pursued only via new ADRs that explicitly supersede this one.

## Implementation Notes

- Treat this ADR as documentation of the current code: tests and other docs should reference this behaviour until a replacement ADR is accepted.
- If/when a new ADR is accepted to replace this, mark this ADR as Superseded and point to the new ADR.

## References

- [ADR-0012: 2D Polygon Shape System](0012-2d-polygon-shape-system.md)
- Related work (proposals superseded by this as‑is acceptance): [ADR-0014 (previous draft)](0014-docking-ports-and-state-machine.md) and [ADR-0015 (previous draft)](0015-docking-light-guidance-system.md)

