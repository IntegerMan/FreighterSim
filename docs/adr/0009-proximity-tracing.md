# ADR-0009: Proximity Tracing with Angular Extent

## Status

Accepted

## Context

The proximity sensor system displays detected objects as colored wedges on a radar display. The original implementation treated all objects as point contacts, using only their center position to determine which radar segment they appeared in. This created unrealistic behavior:

1. **Large objects like planets only appeared in one segment** - A planet spanning 20° of angular space would only show in a single 10° segment based on its center bearing
2. **Distance was measured to object center** - A ship approaching a large planet would see "far" threat levels even when very close to the planet's surface
3. **No true raytracing** - The system didn't account for object size when determining visibility

The radar uses configurable angular segments (default 36 segments of 10° each). With true raytracing, a large nearby object should:
- Appear in ALL segments it visually spans
- Report distance to the nearest edge, not the center
- Support configurable fidelity (segment count) as a ship sensor property

## Decision

Implement true angular extent raytracing for proximity detection:

### 1. Calculate Angular Extent

For each detected contact, calculate the angular range it spans from the ship's perspective:

```typescript
function getObjectAngularExtent(
  contactPosition: Vector2,
  contactRadius: number,
  shipPosition: Vector2
): { startAngle: number; endAngle: number; edgeDistance: number } {
  const dx = contactPosition.x - shipPosition.x;
  const dy = contactPosition.y - shipPosition.y;
  const centerDistance = Math.sqrt(dx * dx + dy * dy);
  
  // Bearing to center
  let centerBearing = Math.atan2(dy, dx) * (180 / Math.PI);
  if (centerBearing < 0) centerBearing += 360;
  
  // Angular half-width based on apparent size
  const halfAngle = Math.atan(contactRadius / centerDistance) * (180 / Math.PI);
  
  return {
    startAngle: (centerBearing - halfAngle + 360) % 360,
    endAngle: (centerBearing + halfAngle) % 360,
    edgeDistance: Math.max(0, centerDistance - contactRadius),
  };
}
```

### 2. Segment Overlap Detection

When building radar segments, check if each contact's angular extent overlaps the segment:

```typescript
function angularExtentOverlapsSegment(
  extentStart: number,
  extentEnd: number,
  segmentStart: number,
  segmentEnd: number
): boolean {
  // Handle wraparound at 0°/360°
  // Returns true if any part of the extent falls within the segment
}
```

### 3. Edge Distance for Threat Level

Use the distance to the object's nearest edge (not center) for threat level calculation. This means a ship 50 units from a planet's surface shows "critical" threat, even if the planet's center is 500 units away.

### 4. Configurable Segment Count

The number of radar segments is now a property of the ship's sensors (`sensors.segmentCount`), allowing:
- Basic sensors: 18 segments (20° each)
- Standard sensors: 36 segments (10° each)  
- Advanced sensors: 72 segments (5° each)
- Military-grade: 144 segments (2.5° each)

### 5. Spatial Culling

Before detailed raytracing calculations, filter contacts to those within `sensorRange + maxObjectRadius`. This optimization skips expensive calculations for distant objects. This also includes the system's star.

### 6. Proximity Display Scale

The radar display uses `settingsStore.proximityDisplayScale` (a UI preference, not a ship property) to render proximity bands at a fraction of the full sensor range. For example, with a 2000-unit range and 0.25 scale, the radar shows 500 units at full radius, making nearby threats more visible. This is a user-configurable display option, not a sensor capability.

## Consequences

### Positive

- Large objects realistically span multiple radar segments
- Threat levels accurately reflect distance to object surface
- Configurable fidelity enables future sensor upgrade mechanics
- Spatial culling improves performance with many contacts
- Proximity display is localized around the ship for better visibility
- Stars are now detected as contacts

### Negative

- More complex segment calculation (O(contacts × segments))
- Need to track object radius in Contact interface
- Potential edge cases with very large objects spanning >180°
- Wraparound handling at 0°/360° boundary adds complexity

### Performance

With spatial culling, only contacts within sensor range are processed. For typical scenarios (5-20 contacts, 36-72 segments), the raytracing is negligible compared to rendering.

## Alternatives Considered

### GPU-Based Raytracing
Use actual ray casting on the GPU. Rejected as overkill; the angular extent math is simple and fast enough for CPU.

### Pre-computed Segment Masks
Cache which segments each object type spans at various distances. Rejected as premature optimization that adds complexity.

### Point-Only with Size Indicator
Keep point detection but add a visual size indicator. Rejected because it doesn't solve the "planet in one segment" problem.

## References

- [sensorStore.ts](../../src/stores/sensorStore.ts) - Raytracing implementation
- [Contact.ts](../../src/models/Contact.ts) - Contact interface with radius
- [settingsStore.ts](../../src/stores/settingsStore.ts) - UI options including proximity display scale
- [ADR-0008: Ship Composition](./0008-ship-composition.md) - Ship sensor configuration
- [RadarDisplay.vue](../../src/components/sensors/RadarDisplay.vue) - Radar rendering
