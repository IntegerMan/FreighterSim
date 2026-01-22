# ADR-0006: Station Navigation Architecture

## Status

Accepted

## Context

The Space Freighter Sim application needs multiple station views representing different ship functions (Bridge, Helm, Sensors, and future stations like Engineering, Cargo, Communications). As the number of stations grows, the UI needs a scalable navigation pattern that:

1. Provides quick access to primary stations
2. Handles overflow when stations exceed available tab space
3. Maintains URL state for bookmarking and navigation history
4. Follows the established LCARS design language

The initial implementation had everything in a single BridgeView with all panels visible simultaneously. This doesn't scale as functionality grows and doesn't provide the focused, station-specific experience intended.

## Decision

### Routing Strategy

Use **vue-router** with dedicated routes for each station view:

```
/bridge   → BridgeView (tactical overview)
/helm     → HelmView (navigation controls, zoomed map)
/sensors  → SensorsView (radar, contact analysis)
/engineering → (future) EngView
/cargo    → (future) CargoView
/comms    → (future) CommsView
```

### Tab Bar Architecture

Implement `LcarsTabBar` component with:

1. **Primary tabs** (≤5): Displayed directly in the tab bar
2. **Overflow menu**: "MORE ▼" dropdown for additional stations when count exceeds `maxVisibleTabs` prop
3. **Active state**: Gold highlight for current station
4. **Router integration**: Uses `<router-link>` for navigation

### Tab Organization Strategy (Future Scaling)

When stations exceed 5-6:

| Category | Stations |
|----------|----------|
| **Command** | Bridge, Helm |
| **Operations** | Sensors, Communications |
| **Engineering** | Engineering, Damage Control |
| **Cargo** | Cargo Bay, Manifest |

The overflow menu will group stations by category with section headers.

### Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` through `Ctrl+5` | Primary station quick access |
| `Ctrl+B` | Bridge |
| `Ctrl+H` | Helm |
| `Ctrl+S` | Sensors |

### Game State Architecture

Game initialization and store update subscriptions are lifted to `App.vue`:

- All stations share the same game loop and state
- Each view subscribes independently for rendering (e.g., canvas updates)
- Per-view state (zoom, pan) stored in view components, not global stores

## Consequences

### Positive

- **URL state preservation**: Browser back/forward works, stations are bookmarkable
- **Focused UI**: Each station shows only relevant panels and controls
- **Scalable**: Can add stations without redesigning navigation
- **Consistent chrome**: Tab bar appears on all stations, providing orientation
- **Independent views**: Each station can have unique layouts and interactions

### Negative

- **Route changes on navigation**: Brief transition between stations (mitigated by fast Vue router)
- **Overflow complexity**: Need to implement dropdown menu for 6+ stations
- **Duplicate state consideration**: Must be careful about per-view vs shared state

### Neutral

- E2E tests need route-aware setup (navigate to specific station before testing)
- Game loop runs continuously across all views (already the case)

## Alternatives Considered

### Internal Tab State (No Router)

Store active tab in component state or Pinia, switch views without URL changes.

**Rejected because:**
- Loses browser navigation history
- Can't bookmark specific stations
- Harder to deep-link for testing or sharing

### Sidebar Navigation

Vertical sidebar with station icons instead of horizontal tabs.

**Rejected because:**
- Consumes valuable horizontal space needed for panels
- Doesn't match LCARS aesthetic (horizontal bars)
- Less efficient for 3-5 primary stations

### Single View with Collapsible Panels

Keep everything in one view, let users show/hide panels.

**Rejected because:**
- Overwhelming UI with all options visible
- Doesn't provide station-focused experience
- Complex panel state management

## References

- [ADR-0005: LCARS Design System](./0005-lcars-design-system.md) - Tab bar follows design tokens
- [Vue Router Documentation](https://router.vuejs.org/)
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - View layer patterns
