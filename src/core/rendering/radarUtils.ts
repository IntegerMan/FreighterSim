/**
 * Radar Rendering Utilities
 * 
 * Provides consolidated rendering functions for radar displays following
 * the North-Up coordinate system per ADR-0011.
 * 
 * Coordinate System (North-Up):
 * - 0° = North (up on screen, +Y world space)
 * - 90° = East (right on screen, +X world space)
 * - 180° = South (down on screen, -Y world space)
 * - 270° = West (left on screen, -X world space)
 * 
 * Canvas Conversion:
 * - For vectors: x = sin(angle), y = -cos(angle)
 * - For arcs: subtract 90° from angle (canvas 0° is East)
 */

import type { RadarSegment, Contact } from '@/models';
import { getThreatLevelColor } from '@/models';

/**
 * Standard radar color palette
 */
export const RADAR_COLORS = {
  background: '#000000',
  ring: 'rgba(153, 102, 255, 0.3)',
  ringLabel: 'rgba(153, 102, 255, 0.6)',
  segmentLine: 'rgba(153, 102, 255, 0.2)',
  segmentLineLight: 'rgba(153, 102, 255, 0.15)',
  ship: '#44FF44',
  heading: '#D4AF37',
  text: '#9966FF',
  occluded: '#FF0000',
  partialOcclusion: '#FF8800',
  occlusionRay: 'rgba(255, 100, 100, 0.3)',
};

/**
 * Convert a North-Up angle to screen coordinates
 * @param angleDegrees Angle in degrees (0° = North)
 * @param distance Distance from center
 * @param cx Center X coordinate
 * @param cy Center Y coordinate
 * @returns Screen coordinates {x, y}
 */
export function angleToScreenCoords(
  angleDegrees: number,
  distance: number,
  cx: number,
  cy: number
): { x: number; y: number } {
  const rad = (angleDegrees * Math.PI) / 180;
  // North-Up: sin for X, -cos for Y (per ADR-0011)
  return {
    x: cx + Math.sin(rad) * distance,
    y: cy - Math.cos(rad) * distance,
  };
}

/**
 * Convert screen coordinates to North-Up angle
 * @param x Screen X coordinate
 * @param y Screen Y coordinate
 * @param cx Center X coordinate
 * @param cy Center Y coordinate
 * @returns Angle in degrees (0-360, 0° = North)
 */
export function screenCoordsToAngle(
  x: number,
  y: number,
  cx: number,
  cy: number
): number {
  const dx = x - cx;
  const dy = cy - y; // Flip Y because screen Y is inverted
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Convert North-Up angle to canvas arc angle
 * Canvas arcs use 0° = East (right), we use 0° = North (up)
 * @param angleDegrees Angle in degrees (0° = North)
 * @returns Angle in radians for canvas arc API
 */
export function northUpToCanvasArcRad(angleDegrees: number): number {
  return ((angleDegrees - 90) * Math.PI) / 180;
}

/**
 * Draw range rings on a radar display
 */
export function drawRangeRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxRadius: number,
  fractions: number[],
  color: string = RADAR_COLORS.ring
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (const fraction of fractions) {
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * fraction, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Draw segment divider lines (radial lines from center)
 */
export function drawSegmentDividers(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxRadius: number,
  intervalDegrees: number = 30,
  color: string = RADAR_COLORS.segmentLine
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += intervalDegrees) {
    const { x, y } = angleToScreenCoords(deg, maxRadius, cx, cy);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

/**
 * Draw cardinal direction labels (N, E, S, W)
 */
export function drawCardinalLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxRadius: number,
  color: string = RADAR_COLORS.text,
  offset: number = 12
): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cardinals = [
    { angle: 0, label: 'N' },
    { angle: 90, label: 'E' },
    { angle: 180, label: 'S' },
    { angle: 270, label: 'W' },
  ];

  for (const { angle, label } of cardinals) {
    const { x, y } = angleToScreenCoords(angle, maxRadius + offset, cx, cy);
    ctx.fillText(label, x, y);
  }
}

/**
 * Draw a threat segment arc
 */
export function drawThreatSegment(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  segment: RadarSegment,
  displayRange: number,
  maxRadius: number,
  contact?: Contact
): void {
  if (segment.threatLevel === 'none' || !segment.nearestContact) return;

  const startRad = northUpToCanvasArcRad(segment.startAngle);
  const endRad = northUpToCanvasArcRad(segment.endAngle);
  const distanceRatio = Math.min(segment.nearestContact.distance / displayRange, 1);
  const segmentRadius = maxRadius * distanceRatio;

  // Check occlusion status
  const visibility = contact?.visibility ?? 1;
  const isPartiallyOccluded = visibility > 0 && visibility < 1;
  const isFullyOccluded = visibility === 0;

  // Set fill style based on occlusion
  if (isFullyOccluded) {
    ctx.fillStyle = RADAR_COLORS.occluded;
    ctx.globalAlpha = 0.7;
  } else if (isPartiallyOccluded) {
    ctx.fillStyle = RADAR_COLORS.partialOcclusion;
    ctx.globalAlpha = 0.6;
  } else {
    ctx.fillStyle = getThreatLevelColor(segment.threatLevel);
    ctx.globalAlpha = 0.5;
  }

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, segmentRadius, startRad, endRad);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Options for drawing threat segments
 */
export interface ThreatSegmentOptions {
  ctx: CanvasRenderingContext2D;
  cx: number;
  cy: number;
  segments: RadarSegment[];
  displayRange: number;
  maxRadius: number;
  contacts?: Contact[];
}

/**
 * Draw all threat segments
 */
export function drawThreatSegments(options: ThreatSegmentOptions): void {
  const { ctx, cx, cy, segments, displayRange, maxRadius, contacts = [] } = options;
  
  for (const segment of segments) {
    if (segment.threatLevel === 'none' || !segment.nearestContact) continue;

    const contact = contacts.find(c => c.id === segment.nearestContact!.id);
    drawThreatSegment(ctx, cx, cy, segment, displayRange, maxRadius, contact);
  }
}

/**
 * Draw ship heading indicator line
 */
export function drawHeadingIndicator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  headingDegrees: number,
  length: number,
  color: string = RADAR_COLORS.heading,
  lineWidth: number = 2
): void {
  const { x, y } = angleToScreenCoords(headingDegrees, length, cx, cy);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);
  ctx.stroke();
}

/**
 * Draw ship icon at center (circle + directional triangle)
 * Named differently from mapUtils.drawShipIcon to avoid export conflict
 */
export function drawRadarShipIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  headingDegrees: number,
  circleRadius: number = 6,
  triangleSize: number = 10,
  color: string = RADAR_COLORS.ship
): void {
  // Draw center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw directional triangle
  const headingRad = (headingDegrees * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  // Rotate: subtract 90° to convert from North-Up to canvas coordinates
  ctx.rotate(headingRad - Math.PI / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(triangleSize, 0);
  ctx.lineTo(-triangleSize * 0.5, -triangleSize * 0.5);
  ctx.lineTo(-triangleSize * 0.5, triangleSize * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Options for drawing occlusion debug rays
 */
export interface OcclusionRayOptions {
  ctx: CanvasRenderingContext2D;
  cx: number;
  cy: number;
  contacts: Contact[];
  displayRange: number;
  maxRadius: number;
  rayColor?: string;
  blockerColor?: string;
}

/**
 * Draw occlusion debug rays for occluded contacts
 */
export function drawOcclusionRays(options: OcclusionRayOptions): void {
  const { 
    ctx, cx, cy, contacts, displayRange, maxRadius,
    rayColor = RADAR_COLORS.occlusionRay,
    blockerColor = '#FF0000'
  } = options;
  
  ctx.strokeStyle = rayColor;
  ctx.lineWidth = 1;

  for (const contact of contacts) {
    if (contact.visibility >= 1) continue;

    const distanceRatio = Math.min(contact.distance / displayRange, 1);
    const contactRadius = maxRadius * distanceRatio;
    const { x, y } = angleToScreenCoords(contact.bearing, contactRadius, cx, cy);

    // Draw ray from center to contact
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Mark blocking point
    if (contact.occludedBy) {
      const blocker = contacts.find(c => c.id === contact.occludedBy);
      if (blocker) {
        const blockerDistRatio = Math.min(blocker.distance / displayRange, 1);
        const blockerRadius = maxRadius * blockerDistRatio;
        const { x: bx, y: by } = angleToScreenCoords(blocker.bearing, blockerRadius, cx, cy);

        // Draw X at blocking point
        ctx.strokeStyle = blockerColor;
        ctx.lineWidth = 2;
        const crossSize = 5;
        ctx.beginPath();
        ctx.moveTo(bx - crossSize, by - crossSize);
        ctx.lineTo(bx + crossSize, by + crossSize);
        ctx.moveTo(bx + crossSize, by - crossSize);
        ctx.lineTo(bx - crossSize, by + crossSize);
        ctx.stroke();
        
        // Reset for next ray
        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1;
      }
    }
  }
}

/**
 * Options for drawing contact labels
 */
export interface ContactLabelOptions {
  ctx: CanvasRenderingContext2D;
  cx: number;
  cy: number;
  segments: RadarSegment[];
  displayRange: number;
  maxRadius: number;
  color?: string;
  offset?: number;
}

/**
 * Draw contact labels
 */
export function drawContactLabels(options: ContactLabelOptions): void {
  const {
    ctx, cx, cy, segments, displayRange, maxRadius,
    color = '#FFFFFF',
    offset = 15
  } = options;
  
  ctx.fillStyle = color;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';

  for (const segment of segments) {
    if (!segment.nearestContact) continue;

    const distanceRatio = Math.min(segment.nearestContact.distance / displayRange, 1);
    const labelRadius = maxRadius * distanceRatio + offset;
    const { x, y } = angleToScreenCoords(segment.nearestContact.bearing, labelRadius, cx, cy);

    ctx.fillText(segment.nearestContact.name, x, y);
  }
}

/**
 * Get radar segment at a given screen position
 */
export function getSegmentAtPosition(
  x: number,
  y: number,
  cx: number,
  cy: number,
  segments: RadarSegment[],
  contacts: Contact[] = []
): { segment: RadarSegment | null; contact: Contact | null } {
  const angle = screenCoordsToAngle(x, y, cx, cy);
  const segmentIndex = Math.floor(angle / 10) % 36;
  const segment = segments[segmentIndex] || null;

  if (!segment?.nearestContact) {
    return { segment: null, contact: null };
  }

  const contact = contacts.find(c => c.id === segment.nearestContact!.id) || null;
  return { segment, contact };
}

/**
 * Configuration for a complete radar render
 */
export interface RadarRenderConfig {
  ctx: CanvasRenderingContext2D;
  cx: number;
  cy: number;
  maxRadius: number;
  segments: RadarSegment[];
  contacts?: Contact[];
  displayRange: number;
  shipHeading: number;
  showLabels?: boolean;
  showOcclusionRays?: boolean;
  showCardinals?: boolean;
  ringFractions?: number[];
  segmentDividerInterval?: number;
}

/**
 * Render a complete radar display
 * This is a convenience function that draws all radar elements
 */
export function renderRadar(config: RadarRenderConfig): void {
  const {
    ctx,
    cx,
    cy,
    maxRadius,
    segments,
    contacts = [],
    displayRange,
    shipHeading,
    showLabels = false,
    showOcclusionRays = false,
    showCardinals = true,
    ringFractions = [0.25, 0.5, 0.75, 1],
    segmentDividerInterval = 30,
  } = config;

  // Draw range rings
  drawRangeRings(ctx, cx, cy, maxRadius, ringFractions);

  // Draw segment dividers
  drawSegmentDividers(ctx, cx, cy, maxRadius, segmentDividerInterval);

  // Draw threat segments
  drawThreatSegments({ ctx, cx, cy, segments, displayRange, maxRadius, contacts });

  // Draw occlusion rays if enabled
  if (showOcclusionRays && contacts.length > 0) {
    drawOcclusionRays({ ctx, cx, cy, contacts, displayRange, maxRadius });
  }

  // Draw cardinal labels
  if (showCardinals) {
    drawCardinalLabels(ctx, cx, cy, maxRadius);
  }

  // Draw heading indicator
  drawHeadingIndicator(ctx, cx, cy, shipHeading, maxRadius * 0.3);

  // Draw ship icon
  drawRadarShipIcon(ctx, cx, cy, shipHeading);

  // Draw contact labels if enabled
  if (showLabels) {
    drawContactLabels({ ctx, cx, cy, segments, displayRange, maxRadius });
  }
}
