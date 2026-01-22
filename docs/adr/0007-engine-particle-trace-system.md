# ADR-0007: Engine Particle Trace System

## Status

Accepted

## Context

The Space Freighter Sim needs a way to visualize ship activity in space beyond simple position markers. As gameplay expands to include multiple ships, stealth mechanics, and tracking gameplay, we need a system that:

1. Shows where ships have traveled recently
2. Creates an authentic "lived-in" space environment
3. Enables future gameplay mechanics around detection and evasion
4. Provides meaningful tradeoffs (e.g., speed vs. visibility)

The Sensors station needs a particle trace visualization mode that displays engine exhaust trails as ships move through space.

## Decision

### Particle Grid System

Implement a **sparse grid-based particle system** where:

- Space is divided into cells (default 50 world units per cell)
- Each cell tracks particle density (0 to maxDensity)
- Only cells with particles > threshold are stored (sparse Map structure)
- Particles spread to adjacent cells over time
- Particles decay (fade) over time

### Engine Burn-Based Emission

Particle emission is proportional to **engine burn intensity** (throttle), not just movement:

```
emissionRate = baseRate * throttle * deltaTime
throttle = targetSpeed / maxSpeed  (0 to 1)
```

**Rationale:**
- A ship at full burn leaves a dense, visible trail
- A ship coasting or at low throttle leaves sparse/no trail
- Creates gameplay tradeoff: travel fast and be visible, or go slow and stay hidden
- Mirrors real physics where engine exhaust creates detectable signatures

### Multi-Ship Support

The particle store supports multiple emitters:

```typescript
registerEmitter(id: string, getPosition: () => Vector2, getThrottle: () => number)
```

- Player ship registered at startup
- NPC ships register when spawned, unregister when destroyed
- All emitters contribute to the same particle grid

### Simulation Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `cellSize` | 50 | World units per grid cell |
| `spreadRate` | 0.15 | How fast particles spread to neighbors (per second) |
| `decayRate` | 0.5 | How fast particles fade (density units per second) |
| `maxDensity` | 10 | Maximum particle density per cell |
| `baseEmissionRate` | 2.0 | Particles emitted per second at full throttle |

### Visualization

The TraceParticlesDisplay component renders the particle grid:

- Grid cells colored by density (dim purple to bright purple)
- Ship-centered view with configurable radius
- Higher density = brighter color
- Grid overlay optional for spatial reference

## Consequences

### Positive

- **World authenticity**: Space feels alive with visible ship activity trails
- **Stealth mechanics**: Future gameplay can use trails for tracking or evasion
- **Meaningful tradeoffs**: Players choose between speed and visibility
- **Performance efficient**: Sparse grid only stores active cells
- **Multi-ship ready**: Architecture supports NPC ships when added
- **Tunable**: Parameters can be adjusted for gameplay balance

### Negative

- **Memory growth**: Long sessions with many ships could accumulate many cells (mitigated by decay)
- **Visual noise**: Dense particle fields might obscure other information (mitigated by density cap)
- **Complexity**: Adds simulation system to the game loop

### Neutral

- Particle state not persisted across sessions (trails reset on reload)
- Grid resolution is fixed (could be made configurable if needed)

## Alternatives Considered

### Distance-Based Emission

Emit particles based on distance traveled, not throttle.

**Rejected because:**
- No gameplay tradeoff (all movement equally visible)
- Coasting ships would leave trails (unrealistic for exhaust)
- Doesn't support future stealth mechanics

### Continuous Trail Lines

Draw actual trail lines per ship instead of a particle grid.

**Rejected because:**
- Doesn't spread/diffuse like real exhaust would
- Hard to represent overlapping trails from multiple ships
- More complex memory management for long trails

### No Particle System

Skip particles, use only radar for detection.

**Rejected because:**
- Misses opportunity for world-building
- No visual history of activity
- Limits future gameplay options

### Per-Ship Particle Arrays

Each ship maintains its own array of particle positions.

**Rejected because:**
- Can't represent overlapping trails efficiently
- More complex to query "density at point"
- Harder to spread/blend between ships

## References

- [ADR-0003: Canvas Map Rendering](./0003-canvas-map-rendering.md) - Rendering patterns for displays
- [ADR-0006: Station Navigation Architecture](./0006-station-navigation-architecture.md) - Sensors station context
