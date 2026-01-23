# Research: Cargo Screen Feature

**Feature Branch**: `SKY-4-CargoScreen`  
**Date**: January 22, 2026  
**Phase**: 0 - Outline & Research

## Research Tasks

### 1. Ship Composition Pattern for Cargo Bay

**Question**: How should CargoBay integrate with the existing Ship composition architecture?

**Decision**: CargoBay follows the established subsystem pattern from ADR-0008

**Rationale**: 
- ADR-0008 explicitly anticipates CargoBay as a future subsystem (`Ship *-- CargoBay : cargo (future)`)
- Existing patterns show subsystems are defined as separate interfaces (ShipEngines, ShipSensors)
- Each subsystem has default constants (DEFAULT_ENGINES, DEFAULT_SENSORS)
- Ship interface includes subsystem references that are spread in createShip()

**Alternatives Considered**:
- Separate cargoStore managing cargo independently: Rejected because cargo bay is intrinsically a ship property
- Flat properties on Ship: Rejected per ADR-0008 rationale against flat properties

---

### 2. Canvas Grid Rendering Best Practices

**Question**: What is the best approach for rendering a 2D cargo grid using Canvas?

**Decision**: Create a dedicated CargoGrid.vue component using a single Canvas element with draw-on-update pattern

**Rationale**:
- Existing SystemMap.vue and RadarDisplay.vue demonstrate Canvas usage in Vue components
- Grid is relatively static (changes only on load/unload events), no continuous animation needed
- Canvas avoids DOM manipulation overhead for potentially large grids
- Single Canvas element batches all slot rendering per constitution principle IV

**Implementation Pattern**:
```typescript
// On cargo change, trigger redraw
watch([cargo, bayDimensions], () => {
  drawGrid(ctx, cargo.value, width.value, depth.value);
});
```

**Alternatives Considered**:
- SVG-based grid: Would create many DOM elements, less performant for large bays
- CSS Grid with div boxes: DOM manipulation in hot path, contradicts constitution

---

### 3. Pinia Store Pattern for Cargo State

**Question**: Should cargo state live in shipStore or a dedicated cargoStore?

**Decision**: Create dedicated `cargoStore` that references ship's cargo bay configuration

**Rationale**:
- Follows separation of concerns (shipStore handles movement/position, cargoStore handles inventory)
- Mirrors pattern: sensorStore reads from ship.sensors but manages contact state separately
- Allows cargo-specific computed properties and actions without bloating shipStore
- Ship's `cargoBay` defines capacity; `cargoStore` manages items within that capacity

**Alternatives Considered**:
- All cargo logic in shipStore: Would bloat shipStore with unrelated concerns
- Cargo items stored on Ship model: Ship interface should define structure, not mutable state

---

### 4. Real-time Update Pattern

**Question**: How to implement <100ms updates for cargo changes (FR-005)?

**Decision**: Use Vue's reactivity with Pinia store watchers

**Rationale**:
- Pinia stores are reactive; UI components automatically re-render on state change
- No polling needed - direct store mutations trigger Vue's reactivity system
- Canvas redraw can be triggered via `watch()` on cargo array
- Matches existing patterns (e.g., shipStore.position changes trigger SystemMap updates)

**Alternatives Considered**:
- Event bus for cargo updates: Adds unnecessary complexity
- Manual component refresh: Contradicts Vue's reactive paradigm

---

### 5. Route and Navigation Integration

**Question**: How should Cargo screen integrate with existing navigation?

**Decision**: Add `/cargo` route as 4th station, following existing router pattern

**Rationale**:
- Spec requires "CARGO screen, navigable from main stations navigation list"
- Existing routes use lazy-loaded components with meta.order for display order
- Cargo should be order: 4 to appear last per spec

**Implementation**:
```typescript
{ 
  path: '/cargo', 
  name: 'cargo', 
  component: () => import('@/views/CargoView.vue'),
  meta: { title: 'Cargo', order: 4 }
}
```

---

### 6. Cargo Type System

**Question**: What cargo types should be supported initially?

**Decision**: Define enum or union type for cargo classification

**Rationale**:
- Spec mentions type examples: "mineral", "supply", "hazmat"
- Type enables future filtering, sorting, and color-coding in grid
- Simple string union sufficient for v1, can expand to full enum later

**Types for v1**:
- `mineral` - Raw materials (Dilithium Crystals, Iron Ore)
- `supply` - General supplies (Medical Supplies, Food Rations)
- `hazmat` - Hazardous materials (Radioactive Waste, Volatile Compounds)
- `equipment` - Ship equipment and parts
- `luxury` - High-value trade goods

---

### 7. Empty State and Edge Cases

**Question**: How to handle edge cases per spec requirements?

**Decisions**:

| Edge Case | Handling |
|-----------|----------|
| Empty cargo bay | Show empty grid with "NO CARGO LOADED" message |
| Capacity exceeded | Prevent via store validation; display warning if data inconsistent |
| Large quantities | Grid scrolls if needed; summary shows totals |
| Transient states (loading) | Brief loading indicator; reactive update completes <100ms |
| Corrupted data | Validate on load; show error state if invalid |

---

## Technology Choices Summary

| Component | Choice | Reference |
|-----------|--------|-----------|
| State Management | Pinia cargoStore | Constitution II |
| UI Framework | Vue 3 Composition API | Constitution II |
| Grid Rendering | HTML5 Canvas | Constitution IV, ADR-0003 |
| Styling | SCSS with LCARS variables | ADR-0005 |
| Testing | Vitest (unit), Playwright (E2E) | Constitution III |

## Unknowns Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved:

- ✅ Ship composition pattern documented in ADR-0008
- ✅ Canvas rendering patterns established in existing components
- ✅ Pinia store patterns consistent across project
- ✅ Route integration straightforward
- ✅ Cargo types defined for v1

## References

- [ADR-0005: LCARS Design System](../../docs/adr/0005-lcars-design-system.md)
- [ADR-0008: Ship Composition](../../docs/adr/0008-ship-composition.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [Constitution](../../.specify/memory/constitution.md)
