# ADR-0003: Use Canvas for System Map Rendering

## Status

Superseded by ADR-0013 (Pixi.js Rendering Engine)

## Context

The game requires a visual representation of the star system showing:

- Player ship position and heading
- Stations (multiple types)
- Planets with orbital paths
- Selection highlights
- Range/distance indicators
- Zoom and pan controls

We need to choose a rendering approach that:

- Performs well with dozens of objects
- Supports custom rendering (ship icons, orbital paths)
- Integrates with Vue components
- Allows precise positioning and transformations

## Decision

We will use the **HTML5 Canvas API** for rendering the system map, wrapped in a Vue component.

### Implementation Approach

```vue
<template>
  <canvas ref="canvasRef" @wheel="handleZoom" @mousedown="handlePan" />
</template>

<script setup lang="ts">
const canvasRef = ref<HTMLCanvasElement>();

function render() {
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, width, height);
  renderGrid(ctx);
  renderOrbits(ctx);
  renderPlanets(ctx);
  renderStations(ctx);
  renderShip(ctx);
}
</script>
```

## Consequences

### Positive

- **Full control**: Direct pixel-level rendering for custom visuals
- **Performance**: Canvas handles many objects efficiently
- **No dependencies**: Native browser API, no additional libraries
- **Zoom/pan**: Easy to implement camera transformations
- **Familiarity**: Well-documented, widely understood API

### Negative

- **Manual rendering**: Must implement own render loop and object management
- **No DOM events per object**: Need to implement hit testing for object selection
- **Accessibility**: Canvas content not accessible to screen readers by default
- **Testing**: Canvas output harder to test than DOM elements

## Alternatives Considered

### SVG

- **Pros**: DOM-based, built-in events per element, accessible
- **Cons**: Performance degrades with many elements, less suitable for game-like rendering

### PixiJS / Phaser

- **Pros**: Game-optimized, WebGL performance, particle effects, sprites
- **Cons**: Additional dependency, learning curve, may be overkill for 2D map

### CSS-positioned divs

- **Pros**: Easy styling, DOM events, accessible
- **Cons**: Poor performance at scale, difficult to implement smooth zoom/pan

## Future Considerations

If we need advanced features later (particle effects for engines, complex animations), we can migrate to PixiJS. The rendering logic is encapsulated in the SystemMap component, limiting the blast radius of such a change.

## References

- [Canvas API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Canvas Performance Tips](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
