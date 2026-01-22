# ADR-0010: Waypoint Navigation and Autopilot

## Status

Accepted

## Context

The Space Freighter Sim requires a navigation system that reduces tedious micromanagement of ship heading during long journeys while maintaining player engagement and the feeling of active piloting. Players need to plot courses across star systems without constantly adjusting their heading manually, but we want to avoid creating a "set and forget" autopilot that removes the player from the experience.

Key requirements:
1. Ability to set multiple waypoints to define a course
2. Visual feedback showing planned route on both tactical (bridge) and navigation (helm) displays
3. Autopilot assistance that reduces repetitive tasks
4. Maintain pilot involvement and decision-making

The challenge is finding the right balance between automation and player agency. Too much automation makes the game feel passive; too little leaves tedious micromanagement.

## Decision

### Waypoint System

Implement a **click-to-place waypoint queue** system:

- Players click on the map (bridge screen) to create waypoints at specific coordinates
- Waypoints are numbered sequentially ("Waypoint 1", "Waypoint 2", etc.)
- Waypoints are displayed as boxes with labels on both bridge and helm screens
- Visual path shows dashed lines connecting waypoints in order
- When the ship reaches a waypoint (within 50 world units), it's automatically removed from the queue
- The next waypoint automatically becomes the active target

### Autopilot Philosophy

Implement a **heading-only autopilot** that:

- **Controls heading**: Continuously adjusts ship heading to point toward current waypoint
- **Does NOT control speed**: Player must manually set and adjust speed
- **Toggleable**: Can be enabled/disabled via button on helm screen
- **Manual override**: Automatically disables when player manually adjusts heading
- **Visual feedback**: Clear indicator when autopilot is active

This design keeps the player actively involved in navigation by requiring speed management, fuel consumption awareness, and the ability to react to obstacles or threats by adjusting speed or disabling autopilot.

### Display Strategy

- **Bridge Screen**: Shows velocity projection line (replacing static heading line), waypoints, and waypoint paths. Primary interface for waypoint placement.
- **Helm Screen**: Shows waypoints, paths, and autopilot toggle. Primary interface for speed control and autopilot management.

## Consequences

### Positive

- **Reduces micromanagement**: Players don't need to constantly rotate to maintain heading during long journeys
- **Maintains engagement**: Speed control requirement keeps players monitoring their journey
- **Strategic planning**: Waypoint system encourages thinking ahead about routes
- **Clear visual feedback**: Path visualization helps players understand their planned route
- **Flexible**: Players can plot complex multi-waypoint courses
- **Accessible**: Simple click-to-place interface
- **Fail-safe**: Autopilot disables on manual input, preventing confusion

### Negative

- **Speed management still required**: Some players may want full automation
- **Learning curve**: Players need to understand autopilot controls heading only
- **No collision avoidance**: Autopilot will steer into obstacles if waypoints are poorly placed
- **Manual waypoint removal**: Players must clear waypoints themselves if they change plans (future improvement: right-click to delete)

### Neutral

- **Waypoint persistence**: Waypoints exist only for current session (not saved)
- **Proximity threshold**: 50 world units for waypoint reached detection (tunable parameter)
- **Queue-based**: Only one active waypoint at a time, others wait in queue

## Alternatives Considered

### Full Autopilot (Heading + Speed)

Autopilot controls both heading and speed, automatically slowing down near waypoints.

**Rejected because:**
- Removes too much player agency
- Makes the game feel like "set and forget"
- Eliminates need for fuel/speed management decisions
- Reduces tactical depth

### Manual Heading Only (No Autopilot)

Waypoints are visual markers only, no automated heading control.

**Rejected because:**
- Doesn't solve micromanagement problem
- Players still need to constantly adjust heading
- Waypoints become less useful

### Path Following with Curves

Autopilot follows smooth curves through waypoints instead of straight lines.

**Rejected because:**
- Adds significant complexity to physics system
- Harder to predict ship behavior
- Overkill for the scale of navigation in current game
- Could be future enhancement if needed

### Speed-Reactive Autopilot

Autopilot adjusts heading more aggressively at lower speeds.

**Rejected because:**
- Adds complexity without clear benefit
- Player can already manage this by adjusting speed
- Current simple approach is more predictable

## References

- [ADR-0006: Station Navigation Architecture](./0006-station-navigation-architecture.md) - Bridge/Helm screen separation
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Game loop and physics integration
- Star Trek: Bridge Commander - Inspiration for waypoint navigation
- Elite Dangerous - Example of autopilot with player engagement
