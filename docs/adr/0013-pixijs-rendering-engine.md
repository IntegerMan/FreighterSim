````markdown
# ADR-0013: Migrate to Pixi.js Rendering Engine

## Status

Proposed

## Context

The game currently uses the HTML5 Canvas 2D API for all rendering, as established in [ADR-0003](0003-canvas-map-rendering.md). While this approach has served the initial development phase well, several factors now motivate a reconsideration:

### Current Limitations

1. **Performance Ceiling**: Canvas 2D is CPU-bound. As the game adds more visual elements (cargo containers, multiple ships, station modules, particles), performance degrades linearly.

2. **Particle System Demands**: [ADR-0007](0007-engine-particle-trace-system.md) established an engine particle trace system. The current implementation is limited to hundreds of particles before impacting frame rate. The desired visual quality requires thousands.

3. **Shape System Complexity**: [ADR-0012](0012-2d-polygon-shape-system.md) proposes detailed 2D polygon shapes for ships and modular station composition. Rendering these complex shapes with transformation, collision highlighting, and visual effects strains Canvas 2D capabilities.

4. **Visual Polish Gap**: The LCARS design system ([ADR-0005](0005-lcars-design-system.md)) sets a high bar for visual quality. Canvas 2D lacks built-in support for glow effects, blur, and other filters that would enhance the sci-fi aesthetic.

5. **Manual Optimization Burden**: Every performance optimization (batching, culling, texture caching) must be implemented manually with Canvas 2D.

### Why Now?

[ADR-0003](0003-canvas-map-rendering.md) explicitly noted: *"If we need advanced features later (particle effects for engines, complex animations), we can migrate to PixiJS."* We have now reached that point—the particle system, shape system, and cargo visualization all demand capabilities beyond Canvas 2D's practical limits.

## Decision

We will migrate the rendering layer from HTML5 Canvas 2D to **Pixi.js v8**, a mature, GPU-accelerated 2D rendering library.

### Why Pixi.js?

| Criteria | Pixi.js | Alternatives |
|----------|---------|--------------|
| WebGL acceleration | ✅ Yes, with Canvas fallback | Phaser (game engine overhead), Three.js (3D-focused) |
| 2D focus | ✅ Purpose-built for 2D | Babylon.js (3D), raw WebGL (too low-level) |
| Bundle size | ~150KB gzipped | Phaser ~500KB, Three.js ~150KB |
| Learning curve | Moderate | Phaser (moderate), raw WebGL (steep) |
| Community/docs | Excellent | All have good docs |
| Vue integration | Clean—renders to canvas | Same for all |

### Core Architecture Changes

#### 1. Rendering Abstraction Layer

Create a rendering abstraction that isolates game logic from Pixi.js specifics:

```typescript
// src/core/rendering/PixiRenderer.ts
export class PixiRenderer {
  private app: Application;
  private layers: Map<string, Container>;

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      canvas,
      backgroundColor: 0x0a0a1a,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    // Establish render layer hierarchy
    this.layers.set('background', new Container()); // Stars, grid
    this.layers.set('game', new Container());       // Ships, stations
    this.layers.set('effects', new Container());    // Particles, trails
    this.layers.set('ui', new Container());         // HUD, selection
  }
}
```

#### 2. Game Object Base Class

All renderable entities extend a common base:

```typescript
// src/core/rendering/GameObject.ts
export abstract class GameObject extends Container {
  abstract update(deltaTime: number): void;
  abstract render(): void;
}
```

#### 3. Particle System Upgrade

Replace the current particle grid renderer with Pixi's particle system:

```typescript
// Enhanced particle emission using @pixi/particle-emitter
const engineEmitter = new Emitter(container, {
  emit: true,
  autoUpdate: true,
  lifetime: { min: 0.5, max: 1.5 },
  frequency: 0.001,
  particlesPerWave: 3,
  // ... configuration for engine exhaust visual
});
```

#### 4. Filter Effects

Apply visual filters for sci-fi aesthetic:

```typescript
// Glow effect on active elements
import { GlowFilter } from 'pixi-filters';

ship.filters = [new GlowFilter({
  color: 0x9966FF,
  distance: 15,
  outerStrength: 2,
})];
```

### Migration Strategy

The migration will be **incremental**, maintaining functionality throughout:

| Phase | Duration | Scope |
|-------|----------|-------|
| Foundation | 1-2 weeks | Pixi setup, parallel rendering, asset pipeline |
| Core Systems | 2-3 weeks | Ship/station rendering, UI elements, input handling |
| Enhancement | 1-2 weeks | Particle effects, filters, animations |
| Polish | 1 week | Optimization, cleanup, documentation |

During Phase 1-2, both Canvas 2D and Pixi.js renderers will run in parallel, allowing feature-by-feature validation before removing Canvas code.

### Dependencies

```json
{
  "dependencies": {
    "pixi.js": "^8.0.0",
    "@pixi/particle-emitter": "^5.0.0"
  },
  "devDependencies": {
    "pixi-filters": "^6.0.0"
  }
}
```

## Consequences

### Positive

- **10-100x particle capacity**: GPU rendering enables thousands of particles at 60fps
- **Automatic batching**: Pixi batches draw calls, eliminating manual optimization
- **Built-in filters**: Glow, blur, color matrix filters enhance visual quality
- **Scene graph**: Container hierarchy simplifies layer management and transformations
- **HiDPI automatic**: Resolution scaling handled by Pixi
- **Future-proof**: Shader support enables custom effects (hyperspace, shields)
- **Hit testing built-in**: Simplified click/hover detection on game objects

### Negative

- **New dependency**: Adds ~150KB to bundle (gzipped)
- **Learning curve**: Team must learn Pixi.js patterns and API
- **Migration effort**: 4-6 weeks of focused development
- **Testing changes**: Canvas snapshot tests need rethinking
- **Debugging**: WebGL errors can be less intuitive than Canvas 2D

### Neutral

- Rendering code is already encapsulated in components, limiting migration blast radius
- Asset formats remain the same (PNG, SVG converted to textures)
- Game logic and state management (Pinia stores) unchanged

## Alternatives Considered

### 1. Optimize Current Canvas 2D

- **Pros**: No new dependencies, no learning curve
- **Cons**: Fundamental performance ceiling remains; manual optimization for every feature
- **Verdict**: Rejected—provides temporary relief but doesn't solve underlying limitations

### 2. Phaser.js

- **Pros**: Full game engine with physics, audio, input handling
- **Cons**: Much larger bundle (~500KB), opinionated architecture conflicts with Vue/Pinia setup, overkill for 2D rendering needs
- **Verdict**: Rejected—we need a rendering library, not a game engine

### 3. Three.js (2D mode)

- **Pros**: Powerful, well-documented, enables future 3D if desired
- **Cons**: 3D-focused API awkward for 2D work, orthographic camera setup overhead
- **Verdict**: Rejected—wrong tool for primarily 2D game

### 4. Raw WebGL

- **Pros**: Maximum control, no abstraction overhead
- **Cons**: Enormous development effort for basic features (batching, text, sprites)
- **Verdict**: Rejected—too low-level for practical development pace

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

**Goals**: Pixi.js running alongside Canvas 2D

- [ ] Install and configure Pixi.js dependencies
- [ ] Create `PixiRenderer` class with application setup
- [ ] Implement asset loading via Pixi Assets API
- [ ] Create render layer hierarchy (background, game, effects, ui)
- [ ] Set up parallel rendering toggle for A/B comparison

### Phase 2: Core Systems (Weeks 3-4)

**Goals**: Primary game rendering migrated to Pixi.js

- [ ] Convert `SystemMapCanvas` to Pixi container-based rendering
- [ ] Migrate ship rendering (sprites/graphics, rotation, selection)
- [ ] Migrate station rendering with modular composition support
- [ ] Port starfield/grid background
- [ ] Convert HUD elements to Pixi Text/Graphics
- [ ] Implement input handling via Pixi events

### Phase 3: Enhancement (Weeks 5-6)

**Goals**: Leverage Pixi.js capabilities

- [ ] Upgrade particle system to `@pixi/particle-emitter`
- [ ] Add glow filters to engines, selection highlights
- [ ] Implement smooth camera pan/zoom with easing
- [ ] Add screen transition effects
- [ ] Create texture atlases for sprite batching

### Phase 4: Polish (Week 7)

**Goals**: Production-ready rendering

- [ ] Performance profiling and optimization
- [ ] Memory leak testing (texture disposal, container cleanup)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Remove deprecated Canvas 2D code
- [ ] Update documentation

## Success Metrics

| Metric | Target |
|--------|--------|
| Frame rate with 500+ objects | Stable 60fps |
| Particle count at 60fps | 5,000+ |
| Bundle size increase | < 200KB gzipped |
| Memory stability | No growth over 30-minute session |
| Visual parity | All existing features render identically or better |

## References

- [Pixi.js Documentation](https://pixijs.com/guides)
- [Pixi.js GitHub](https://github.com/pixijs/pixijs)
- [@pixi/particle-emitter](https://github.com/pixijs/particle-emitter)
- [pixi-filters](https://github.com/pixijs/filters)
- [ADR-0003: Canvas Map Rendering](0003-canvas-map-rendering.md) — Superseded by this ADR
- [ADR-0007: Engine Particle Trace System](0007-engine-particle-trace-system.md) — Enhanced by Pixi particle capabilities
- [ADR-0012: 2D Polygon Shape System](0012-2d-polygon-shape-system.md) — Rendering implementation enabled by this ADR
- [ADR-0005: LCARS Design System](0005-lcars-design-system.md) — Visual effects enhanced by Pixi filters
````
