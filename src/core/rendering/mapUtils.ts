import type { Vector2 } from '@/models';

// =============================================================================
// Color Constants - Shared across all map views
// =============================================================================

// Colors matching our design system
export const MAP_COLORS = {
  background: '#000000',
  grid: '#1a1a1a',
  gridMajor: '#333333',
  star: '#FFB347',
  ship: '#FFFFFF',
  shipHeading: '#FFCC00',
  station: '#FFCC00',
  planet: '#66CCFF',
  jumpGate: '#BB99FF',
  orbit: '#333333',
  selected: '#9966FF',
  dockingRange: 'rgba(153, 102, 255, 0.2)',
  courseProjection: 'rgba(255, 204, 0, 0.5)',
  headingArc: 'rgba(255, 204, 0, 0.3)',
  // Docking port colors - green for visibility
  dockingPort: '#00FF99',
  dockingPortApproach: '#00FF99',
  dockingPortRange: 'rgba(0, 255, 153, 0.5)',
  dockingPortRangeSelected: 'rgba(0, 255, 153, 0.8)',
  dockingPortUnavailable: '#FF6666',
};

// =============================================================================
// Station Rendering Constants - Shared scale factors
// =============================================================================

/**
 * Multiplier for station visual size relative to docking range
 * Station visual = dockingRange * STATION_VISUAL_MULTIPLIER
 * This ensures consistent station sizes across all views
 */
export const STATION_VISUAL_MULTIPLIER = 3;

/**
 * Module scale factor - converts module shape coordinates (-1 to 1) to station coordinates
 * Must match MODULE_SCALE in stationLayout.ts
 */
export const MODULE_SCALE_FACTOR = 0.12;

/**
 * Ship size buffer added to docking range for visual display
 * Ensures the docking circle accounts for the ship's physical size
 * Also provides comfortable docking range so ships don't need to "collide" with station
 */
export const SHIP_DOCKING_BUFFER = 50; // Comfortable docking distance

/**
 * Calculate the visual docking range that accounts for ship size
 * @param portDockingRange - The base docking range from the port
 * @param includeShipBuffer - Whether to add buffer for ship size (default: true)
 */
export function getVisualDockingRange(portDockingRange: number, includeShipBuffer: boolean = true): number {
  return includeShipBuffer ? portDockingRange + SHIP_DOCKING_BUFFER : portDockingRange;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Convert a game heading (0°=east, 90°=south) to canvas radians
 * where positive rotation is clockwise on screen (Y increases downward).
 */
export function headingDegToCanvasRad(headingDeg: number): number {
  return headingDeg * DEG_TO_RAD;
}

export interface CameraState {
  zoom: number;
  panOffset: Vector2;
  centerX: number;
  centerY: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldPos: Vector2,
  camera: CameraState
): Vector2 {
  const screenCenterX = camera.canvasWidth / 2;
  const screenCenterY = camera.canvasHeight / 2;

  return {
    x: screenCenterX + (worldPos.x - camera.centerX) * camera.zoom,
    y: screenCenterY - (worldPos.y - camera.centerY) * camera.zoom, // Flip Y for screen coords
  };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screenPos: Vector2,
  camera: CameraState
): Vector2 {
  const screenCenterX = camera.canvasWidth / 2;
  const screenCenterY = camera.canvasHeight / 2;

  return {
    x: camera.centerX + (screenPos.x - screenCenterX) / camera.zoom,
    y: camera.centerY - (screenPos.y - screenCenterY) / camera.zoom,
  };
}

/**
 * Draw a background grid on the canvas
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  gridSize = 100
): void {
  const screenGridSize = gridSize * camera.zoom;

  if (screenGridSize < 20) return; // Don't draw if too zoomed out

  ctx.strokeStyle = MAP_COLORS.grid;
  ctx.lineWidth = 1;

  // Calculate visible world bounds
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
  const bottomRight = screenToWorld(
    { x: camera.canvasWidth, y: camera.canvasHeight },
    camera
  );

  const startX = Math.floor(topLeft.x / gridSize) * gridSize;
  const startY = Math.floor(bottomRight.y / gridSize) * gridSize;
  const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
  const endY = Math.ceil(topLeft.y / gridSize) * gridSize;

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    const screenX = worldToScreen({ x, y: 0 }, camera).x;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, camera.canvasHeight);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    const screenY = worldToScreen({ x: 0, y }, camera).y;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(camera.canvasWidth, screenY);
    ctx.stroke();
  }
}

/**
 * Draw ship heading indicator line
 */
export function drawHeadingLine(
  ctx: CanvasRenderingContext2D,
  screenPos: Vector2,
  headingDeg: number,
  length: number,
  color = MAP_COLORS.shipHeading
): void {
  const headingRad = headingDegToCanvasRad(headingDeg);

  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(headingRad);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw ship triangle icon
 */
export function drawShipIcon(
  ctx: CanvasRenderingContext2D,
  screenPos: Vector2,
  headingDeg: number,
  size = 8,
  color = MAP_COLORS.ship
): void {
  const headingRad = headingDegToCanvasRad(headingDeg);

  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(headingRad);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.7, size);
  ctx.lineTo(-size * 0.7, size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a course projection line
 */
export function drawCourseProjection(
  ctx: CanvasRenderingContext2D,
  screenPos: Vector2,
  headingDeg: number,
  speed: number,
  camera: CameraState,
  projectionTime = 20, // seconds into the future
  isReversing = false
): void {
  if (speed === 0) return;

  // When reversing, draw in opposite direction with purple color
  const effectiveHeading = speed < 0 ? headingDeg + 180 : headingDeg;
  const effectiveSpeed = Math.abs(speed);
  const headingRad = headingDegToCanvasRad(effectiveHeading);
  const distance = effectiveSpeed * projectionTime;
  const screenDistance = distance * camera.zoom;

  // Color based on direction
  const color = isReversing ? 'rgba(153, 102, 255, 0.5)' : MAP_COLORS.courseProjection;

  // Calculate end point using the same rotation as drawHeadingLine
  // After rotating by headingRad, the point (0, -distance) becomes:
  const endX = screenPos.x + screenDistance * Math.sin(headingRad);
  const endY = screenPos.y - screenDistance * Math.cos(headingRad);

  // Draw dashed projection line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(screenPos.x, screenPos.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw tick marks every 10 seconds
  const tickInterval = 10;
  const tickCount = Math.floor(projectionTime / tickInterval);

  for (let i = 1; i <= tickCount; i++) {
    const tickDist = (effectiveSpeed * tickInterval * i) * camera.zoom;
    const tickX = screenPos.x + tickDist * Math.sin(headingRad);
    const tickY = screenPos.y - tickDist * Math.cos(headingRad);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tickX, tickY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw a waypoint marker
 */
export function drawWaypoint(
  ctx: CanvasRenderingContext2D,
  screenPos: Vector2,
  name: string,
  isActive: boolean
): void {
  const size = 8;
  const color = isActive ? '#9966FF' : '#FFCC00';
  const labelColor = isActive ? '#9966FF' : '#FFCC00';

  // Draw box
  ctx.strokeStyle = color;
  ctx.fillStyle = isActive ? 'rgba(153, 102, 255, 0.2)' : 'rgba(255, 204, 0, 0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(screenPos.x - size, screenPos.y - size, size * 2, size * 2);
  ctx.fill();
  ctx.stroke();

  // Draw label below
  ctx.fillStyle = labelColor;
  ctx.font = '10px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, screenPos.x, screenPos.y + size + 14);
}

/**
 * Draw dashed line connecting waypoints or ship to waypoint
 */
export function drawWaypointPath(
  ctx: CanvasRenderingContext2D,
  fromPos: Vector2,
  toPos: Vector2,
  color = 'rgba(153, 102, 255, 0.6)'
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(fromPos.x, fromPos.y);
  ctx.lineTo(toPos.x, toPos.y);
  ctx.stroke();
  ctx.setLineDash([]);
}
