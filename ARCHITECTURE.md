# Architecture Overview

This document describes the high-level architecture of Space Freighter Sim.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue Application                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Views     │  │  Components │  │     UI Components       │  │
│  │             │  │             │  │                         │  │
│  │ BridgeView  │  │ SystemMap   │  │ LcarsFrame, LcarsButton │  │
│  │ DockedView  │  │ NavPanel    │  │ LcarsGauge              │  │
│  │             │  │ SensorPanel │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         ▼                ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Pinia Stores                              ││
│  │  ┌───────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐  ││
│  │  │ shipStore │ │ navStore   │ │sensorStore│ │ gameStore   │  ││
│  │  └───────────┘ └────────────┘ └──────────┘ └─────────────┘  ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Core Systems                              ││
│  │  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ││
│  │  │   GameLoop    │  │ MovementSystem │  │   GameTime     │  ││
│  │  │ (RAF-based)   │  │ (Physics)      │  │ (Time scaling) │  ││
│  │  └───────────────┘  └────────────────┘  └────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Game Data                                 ││
│  │  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ││
│  │  │  Star Systems │  │   Stations     │  │    Planets     │  ││
│  │  └───────────────┘  └────────────────┘  └────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Game Loop

The game uses a `requestAnimationFrame`-based game loop that:

1. Calculates delta time between frames
2. Applies time scaling for accelerated gameplay
3. Notifies all subscribed systems of the tick
4. Supports pause/resume functionality

```typescript
// Simplified game loop flow
while (running) {
  const deltaTime = currentTime - lastTime;
  const scaledDelta = deltaTime * timeScale;
  
  updatePhysics(scaledDelta);
  updateSensors(scaledDelta);
  render();
}
```

### State Management

All game state is managed through Pinia stores:

| Store | Responsibility |
|-------|----------------|
| `gameStore` | Game time, pause state, time scale |
| `shipStore` | Ship position, heading, speed, docking status |
| `navigationStore` | Current system, waypoints, autopilot |
| `sensorStore` | Contact tracking, scan data |

### Rendering

The system map uses HTML5 Canvas for rendering:

- **Camera system**: Pan and zoom controls
- **Object rendering**: Ships, stations, planets with icons
- **Overlays**: Selection highlights, range circles, heading indicators

UI panels use Vue components with LCARS-inspired SCSS styling.

### Physics

Simple 2D physics for ship movement:

- Position: `Vector2 { x, y }` in world units
- Heading: Degrees (0-360), with gradual turning
- Speed: Units per second, with acceleration/deceleration
- Docking: Proximity-based, requires speed below threshold

## Data Flow

### Navigation Input Flow

```
User Input → NavigationPanel → shipStore.setTargetHeading()
                                     ↓
                              GameLoop tick
                                     ↓
                              MovementSystem.update()
                                     ↓
                              shipStore.position updated
                                     ↓
                              SystemMap re-renders
```

### Docking Flow

```
User approaches station → sensorStore detects proximity
                                     ↓
                         DockingPanel shows "Dock" option
                                     ↓
                         User clicks "Dock"
                                     ↓
                         shipStore.dock(stationId)
                                     ↓
                         Ship speed set to 0, isDocked = true
                                     ↓
                         View switches to DockedView
```

## File Organization

### `/src/core/` - Core Systems

Non-Vue game logic that could theoretically run without a UI:

- `game-loop/` - Frame timing, subscribers
- `physics/` - Movement calculations, collision
- `events/` - Game event bus (future)

### `/src/stores/` - State Management

Pinia stores following the composition API pattern:

```typescript
export const useShipStore = defineStore('ship', () => {
  // Reactive state
  const position = ref<Vector2>({ x: 0, y: 0 });
  
  // Computed
  const isMoving = computed(() => speed.value > 0);
  
  // Actions
  function setTargetHeading(degrees: number) { ... }
  
  return { position, isMoving, setTargetHeading };
});
```

### `/src/components/` - Vue Components

Organized by function:

- `map/` - Canvas-based system map
- `panels/` - Control panels (Nav, Sensors, Docking)
- `ui/` - Reusable LCARS components

### `/src/models/` - Type Definitions

TypeScript interfaces for game entities:

```typescript
interface Station {
  id: string;
  name: string;
  type: StationType;
  position: Vector2;
  services: StationService[];
}
```

### `/src/data/` - Static Game Data

Star system definitions, station templates, etc.

## Testing Strategy

See [ADR-0004](docs/adr/0004-testing-strategy.md) for details.

- **Unit tests**: Core systems, stores, utilities
- **Component tests**: Vue components with mocked stores
- **E2E tests**: Critical user flows (navigation, docking)

## Future Considerations

### Multi-System Travel

The architecture supports expansion to multiple systems:

- `navigationStore` tracks current system ID
- Jump gates are special station types
- System loading is data-driven

### Save/Load

Stores are designed for serialization:

```typescript
// Future implementation
const saveGame = () => ({
  ship: shipStore.$state,
  navigation: navigationStore.$state,
  // ...
});
```

### Multiplayer (Out of Scope)

Current architecture is single-player only. Multiplayer would require:

- Server-authoritative game loop
- State synchronization
- Conflict resolution

## Related Documents

- [Style Guide](STYLE_GUIDE.md)
- [ADR Index](docs/adr/)
