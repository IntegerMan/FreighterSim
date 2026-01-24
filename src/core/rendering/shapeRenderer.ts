/**
 * Shape Rendering Utilities
 * 
 * Functions for rendering polygon shapes on HTML5 Canvas.
 * Handles transformation from local to screen coordinates.
 * 
 * @module core/rendering/shapeRenderer
 */

import type { Vector2, Shape, EngineMount, StationTemplate, StationModulePlacement, Station, StationModuleType } from '@/models';
import { rotatePoint, vec2Add, vec2Scale } from '@/core/physics/vectorMath';
import { getStationModule } from '@/data/shapes/stationModules';

// =============================================================================
// Fallback Shapes for Graceful Degradation
// =============================================================================

/**
 * Default fallback shape (simple diamond) used when shape data is missing or corrupted
 */
export const FALLBACK_SHAPE: Shape = {
  id: '_fallback',
  name: 'Fallback Shape',
  vertices: [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
  ],
  boundingRadius: 1,
};

/**
 * Validate a shape for rendering safety
 * Returns true if the shape is valid for rendering
 * 
 * @param shape - Shape to validate
 * @returns true if shape is safe to render
 */
export function isValidShape(shape: Shape | null | undefined): shape is Shape {
  if (!shape) return false;
  if (!Array.isArray(shape.vertices)) return false;
  if (shape.vertices.length < 3) return false;
  
  // Check all vertices have valid x/y coordinates
  for (const vertex of shape.vertices) {
    if (typeof vertex?.x !== 'number' || typeof vertex?.y !== 'number') {
      return false;
    }
    if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get a safe shape for rendering, using fallback if the shape is invalid
 * 
 * @param shape - Shape to validate
 * @returns Valid shape or fallback shape
 */
export function getSafeShape(shape: Shape | null | undefined): Shape {
  if (isValidShape(shape)) {
    return shape;
  }
  console.warn(`[shapeRenderer] Invalid shape detected, using fallback:`, shape);
  return FALLBACK_SHAPE;
}

// =============================================================================
// Coordinate Transformation
// =============================================================================

/**
 * Transform a vertex from local shape space to world space
 * 
 * @param vertex - Vertex in local normalized coordinates (-1 to 1)
 * @param position - World position of the shape center
 * @param rotation - Rotation in degrees (navigation convention: 0=N, 90=E, clockwise)
 * @param scale - Scale factor (size in world units)
 */
export function transformVertex(
  vertex: Vector2,
  position: Vector2,
  rotation: number,
  scale: number
): Vector2 {
  // Scale the vertex
  const scaled = vec2Scale(vertex, scale);
  // Rotate around origin
  // Negate rotation because navigation uses clockwise (0=N, 90=E)
  // but math rotation is counter-clockwise
  const rotated = rotatePoint(scaled, -rotation);
  // Translate to world position
  return vec2Add(rotated, position);
}

/**
 * Transform all vertices of a shape to world coordinates
 */
export function transformVertices(
  vertices: Vector2[],
  position: Vector2,
  rotation: number,
  scale: number
): Vector2[] {
  return vertices.map(v => transformVertex(v, position, rotation, scale));
}

/**
 * Transform a point from world coordinates to screen coordinates
 * 
 * @param worldPoint - Point in world units
 * @param camera - Camera world position (center of view)
 * @param screenCenter - Center of the canvas in pixels
 * @param zoom - Zoom level (pixels per world unit)
 */
export function worldToScreen(
  worldPoint: Vector2,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number
): Vector2 {
  return {
    x: screenCenter.x + (worldPoint.x - camera.x) * zoom,
    y: screenCenter.y - (worldPoint.y - camera.y) * zoom, // Y is inverted for screen
  };
}

/**
 * Transform a point from screen coordinates to world coordinates
 */
export function screenToWorld(
  screenPoint: Vector2,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number
): Vector2 {
  return {
    x: camera.x + (screenPoint.x - screenCenter.x) / zoom,
    y: camera.y - (screenPoint.y - screenCenter.y) / zoom, // Y is inverted for screen
  };
}

// =============================================================================
// Shape Rendering
// =============================================================================

/**
 * Render a shape as a filled polygon
 * 
 * @param ctx - Canvas 2D rendering context
 * @param shape - The shape to render (uses fallback if invalid)
 * @param position - World position of the shape center
 * @param rotation - Rotation in degrees
 * @param scale - Scale factor (size in world units)
 * @param camera - Camera world position
 * @param screenCenter - Center of the canvas in pixels
 * @param zoom - Zoom level (pixels per world unit)
 * @param fillColor - Fill color (CSS color string)
 * @param strokeColor - Optional stroke color
 * @param lineWidth - Stroke width in pixels
 */
export function renderShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  position: Vector2,
  rotation: number,
  scale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  fillColor: string,
  strokeColor?: string,
  lineWidth: number = 1
): void {
  // Use safe shape (fallback if invalid)
  const safeShape = getSafeShape(shape);
  const vertices = safeShape.vertices;
  if (vertices.length < 3) return;

  ctx.beginPath();

  // Transform first vertex
  const worldFirst = transformVertex(vertices[0]!, position, rotation, scale);
  const screenFirst = worldToScreen(worldFirst, camera, screenCenter, zoom);
  ctx.moveTo(screenFirst.x, screenFirst.y);

  // Transform remaining vertices
  for (let i = 1; i < vertices.length; i++) {
    const worldVertex = transformVertex(vertices[i]!, position, rotation, scale);
    const screenVertex = worldToScreen(worldVertex, camera, screenCenter, zoom);
    ctx.lineTo(screenVertex.x, screenVertex.y);
  }

  ctx.closePath();

  // Fill
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Stroke (optional)
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Render a shape outline only (no fill)
 */
export function renderShapeOutline(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  position: Vector2,
  rotation: number,
  scale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  strokeColor: string,
  lineWidth: number = 1
): void {
  const vertices = shape.vertices;
  if (vertices.length < 3) return;

  ctx.beginPath();

  const worldFirst = transformVertex(vertices[0]!, position, rotation, scale);
  const screenFirst = worldToScreen(worldFirst, camera, screenCenter, zoom);
  ctx.moveTo(screenFirst.x, screenFirst.y);

  for (let i = 1; i < vertices.length; i++) {
    const worldVertex = transformVertex(vertices[i]!, position, rotation, scale);
    const screenVertex = worldToScreen(worldVertex, camera, screenCenter, zoom);
    ctx.lineTo(screenVertex.x, screenVertex.y);
  }

  ctx.closePath();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

// =============================================================================
// Level of Detail (LOD)
// =============================================================================

/**
 * Calculate the approximate screen size of a shape
 */
export function getShapeScreenSize(
  shape: Shape,
  scale: number,
  zoom: number
): number {
  // Use bounding radius for quick approximation
  return shape.boundingRadius * scale * zoom * 2;
}

/**
 * Determine if a shape should be rendered as a dot (sub-pixel)
 */
export function shouldRenderAsPoint(
  shape: Shape,
  scale: number,
  zoom: number,
  minSize: number = 4
): boolean {
  return getShapeScreenSize(shape, scale, zoom) < minSize;
}

/**
 * Render a shape as a simple point (for LOD when shape is too small)
 */
export function renderPoint(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  color: string,
  radius: number = 2
): void {
  const screenPos = worldToScreen(position, camera, screenCenter, zoom);
  
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Render a shape with automatic LOD
 * Falls back to a point if the shape is too small on screen
 */
export function renderShapeWithLOD(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  position: Vector2,
  rotation: number,
  scale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  fillColor: string,
  strokeColor?: string,
  lineWidth: number = 1,
  minSize: number = 4
): void {
  if (shouldRenderAsPoint(shape, scale, zoom, minSize)) {
    renderPoint(ctx, position, camera, screenCenter, zoom, fillColor);
  } else {
    renderShape(ctx, shape, position, rotation, scale, camera, screenCenter, zoom, fillColor, strokeColor, lineWidth);
  }
}

// =============================================================================
// Engine Mount Rendering
// =============================================================================

/**
 * Get the world position of an engine mount
 */
export function getEngineMountWorldPosition(
  mount: EngineMount,
  shipPosition: Vector2,
  shipRotation: number,
  shipScale: number
): Vector2 {
  return transformVertex(mount.position, shipPosition, shipRotation, shipScale);
}

/**
 * Get the world direction of an engine mount (normalized thrust direction)
 */
export function getEngineMountWorldDirection(
  mount: EngineMount,
  shipRotation: number
): Vector2 {
  // Rotate the direction vector (don't scale direction)
  // Negate rotation for navigation convention (clockwise positive)
  return rotatePoint(mount.direction, -shipRotation);
}

/**
 * Render engine mount indicators (for debugging/visualization)
 */
export function renderEngineMounts(
  ctx: CanvasRenderingContext2D,
  mounts: EngineMount[],
  shipPosition: Vector2,
  shipRotation: number,
  shipScale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  color: string = '#FF6600'
): void {
  for (const mount of mounts) {
    const worldPos = getEngineMountWorldPosition(mount, shipPosition, shipRotation, shipScale);
    const screenPos = worldToScreen(worldPos, camera, screenCenter, zoom);
    
    // Draw engine mount as a small circle
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw thrust direction indicator
    const worldDir = getEngineMountWorldDirection(mount, shipRotation);
    const endPoint = {
      x: worldPos.x + worldDir.x * shipScale * 0.3,
      y: worldPos.y + worldDir.y * shipScale * 0.3,
    };
    const screenEnd = worldToScreen(endPoint, camera, screenCenter, zoom);
    
    ctx.beginPath();
    ctx.moveTo(screenPos.x, screenPos.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// =============================================================================
// Fallback Circle Rendering
// =============================================================================

/**
 * Render a simple circle (for ships/stations without defined shapes)
 */
export function renderCircle(
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  radius: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  fillColor: string,
  strokeColor?: string,
  lineWidth: number = 1
): void {
  const screenPos = worldToScreen(position, camera, screenCenter, zoom);
  const screenRadius = radius * zoom;
  
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
  
  ctx.fillStyle = fillColor;
  ctx.fill();
  
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

// =============================================================================
// Vertex Caching for Performance
// =============================================================================

/** Cache key for transformed vertices */
export type VertexCacheKey = string;

/** Create a cache key for vertex transformation */
export function createVertexCacheKey(
  shapeId: string,
  position: Vector2,
  rotation: number,
  scale: number
): VertexCacheKey {
  // Round to reduce cache misses from floating point variations
  const px = Math.round(position.x * 100);
  const py = Math.round(position.y * 100);
  const r = Math.round(rotation * 10);
  const s = Math.round(scale * 100);
  return `${shapeId}:${px},${py}:${r}:${s}`;
}

/** Vertex cache for reusing transformed vertices within a frame */
export class VertexCache {
  private cache = new Map<VertexCacheKey, Vector2[]>();
  
  /**
   * Get cached vertices or compute and cache them
   */
  getOrCompute(
    key: VertexCacheKey,
    compute: () => Vector2[]
  ): Vector2[] {
    const cached = this.cache.get(key);
    if (cached) return cached;
    
    const computed = compute();
    this.cache.set(key, computed);
    return computed;
  }
  
  /**
   * Clear the cache (call at start of each frame)
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

// =============================================================================
// Station Module Rendering
// =============================================================================

/** Module render size relative to station scale - sized to fill grid cells and connect */
const MODULE_SCALE_FACTOR = 0.12;

/**
 * Render a single station module at its placement position
 */
export function renderStationModule(
  ctx: CanvasRenderingContext2D,
  module: StationModulePlacement,
  stationPosition: Vector2,
  stationRotation: number,
  stationScale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  fillColor: string,
  strokeColor?: string
): void {
  // Look up the actual module definition from registry
  const moduleDefinition = getStationModule(module.moduleType);
  
  // Calculate module world position relative to station center
  // Module position is in normalized coordinates (-1 to 1), scaled by station scale
  const moduleWorldOffset = transformVertex(
    module.position,
    { x: 0, y: 0 },
    stationRotation,
    stationScale
  );
  
  const moduleWorldPosition: Vector2 = {
    x: stationPosition.x + moduleWorldOffset.x,
    y: stationPosition.y + moduleWorldOffset.y,
  };
  
  // Module rotation combines station rotation and module's own rotation
  const moduleWorldRotation = stationRotation + module.rotation;
  
  // Module scale is a fraction of station scale (modules are smaller than the whole station)
  const moduleWorldScale = stationScale * MODULE_SCALE_FACTOR;
  
  // Render the module shape
  renderShape(
    ctx,
    moduleDefinition.shape,
    moduleWorldPosition,
    moduleWorldRotation,
    moduleWorldScale,
    camera,
    screenCenter,
    zoom,
    fillColor,
    strokeColor,
    1
  );
}

/**
 * Render a complete station with all its modules
 */
export function renderStation(
  ctx: CanvasRenderingContext2D,
  template: StationTemplate,
  position: Vector2,
  rotation: number,
  scale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  fillColor: string,
  strokeColor?: string
): void {
  // Render each module in order
  for (const modulePlacement of template.modules) {
    renderStationModule(
      ctx,
      modulePlacement,
      position,
      rotation,
      scale,
      camera,
      screenCenter,
      zoom,
      fillColor,
      strokeColor
    );
  }
}

/**
 * Calculate approximate bounding radius for a station template
 * Uses pre-calculated value if available, otherwise computes from modules
 */
function calculateStationBoundingRadius(template: StationTemplate): number {
  // Use pre-calculated value if available
  if (template.boundingRadius !== undefined) {
    return template.boundingRadius;
  }
  
  // Calculate from modules - find maximum extent
  let maxRadius = 0;
  for (const modulePlacement of template.modules) {
    const moduleDefinition = getStationModule(modulePlacement.moduleType);
    // Distance from center (module position) plus module's own scaled radius
    const distanceFromCenter = Math.hypot(modulePlacement.position.x, modulePlacement.position.y);
    const totalRadius = distanceFromCenter + moduleDefinition.shape.boundingRadius * MODULE_SCALE_FACTOR;
    maxRadius = Math.max(maxRadius, totalRadius);
  }
  return maxRadius || 1; // Fallback to 1 if no modules
}

/**
 * Render a station with automatic LOD
 * Falls back to a simple shape when zoomed out
 */
export function renderStationWithLOD(
  ctx: CanvasRenderingContext2D,
  template: StationTemplate,
  position: Vector2,
  rotation: number,
  scale: number,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  fillColor: string,
  strokeColor?: string,
  minSize: number = 10
): void {
  // Calculate approximate bounding radius
  const boundingRadius = calculateStationBoundingRadius(template);
  
  // Calculate approximate screen size
  const screenSize = boundingRadius * scale * zoom * 2;
  
  if (screenSize < minSize) {
    // Too small - render as point
    renderPoint(ctx, position, camera, screenCenter, zoom, fillColor, 3);
  } else if (screenSize < minSize * 4) {
    // Medium distance - render as simplified shape (use first/core module only)
    const coreModule = template.modules[0];
    if (coreModule) {
      renderStationModule(
        ctx,
        coreModule,
        position,
        rotation,
        scale,
        camera,
        screenCenter,
        zoom,
        fillColor,
        strokeColor
      );
    } else {
      // No modules - render as circle
      renderCircle(ctx, position, scale * boundingRadius, camera, screenCenter, zoom, fillColor, strokeColor);
    }
  } else {
    // Close up - render full detail
    renderStation(ctx, template, position, rotation, scale, camera, screenCenter, zoom, fillColor, strokeColor);
  }
}

// =============================================================================
// Module Hit Testing
// =============================================================================

/** Module scale factor - must match MODULE_SCALE_FACTOR above */
const MODULE_HIT_SCALE_FACTOR = MODULE_SCALE_FACTOR;

/**
 * Result of a module hit test
 */
export interface ModuleHitResult {
  /** Whether a module was hit */
  hit: boolean;
  /** The module type that was hit */
  moduleType?: StationModuleType;
  /** The module placement info */
  modulePlacement?: StationModulePlacement;
  /** Index of the module in the template */
  moduleIndex?: number;
  /** The station that owns this module */
  station?: Station;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
  let inside = false;
  const n = vertices.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i]!.x;
    const yi = vertices[i]!.y;
    const xj = vertices[j]!.x;
    const yj = vertices[j]!.y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Get the world position of a module within a station
 */
export function getModuleWorldPosition(
  modulePlacement: StationModulePlacement,
  stationPosition: Vector2,
  stationRotation: number,
  stationScale: number
): Vector2 {
  const moduleWorldOffset = transformVertex(
    modulePlacement.position,
    { x: 0, y: 0 },
    stationRotation,
    stationScale
  );
  
  return {
    x: stationPosition.x + moduleWorldOffset.x,
    y: stationPosition.y + moduleWorldOffset.y,
  };
}

/**
 * Check if a world point is inside a specific station module
 */
export function isPointInModule(
  worldPoint: Vector2,
  modulePlacement: StationModulePlacement,
  stationPosition: Vector2,
  stationRotation: number,
  stationScale: number
): boolean {
  const moduleDefinition = getStationModule(modulePlacement.moduleType);
  
  // Get module world position
  const moduleWorldPosition = getModuleWorldPosition(
    modulePlacement,
    stationPosition,
    stationRotation,
    stationScale
  );
  
  // Module rotation combines station rotation and module's own rotation
  const moduleWorldRotation = stationRotation + modulePlacement.rotation;
  
  // Module scale
  const moduleWorldScale = stationScale * MODULE_HIT_SCALE_FACTOR;
  
  // Transform module vertices to world coordinates
  const worldVertices = transformVertices(
    moduleDefinition.shape.vertices,
    moduleWorldPosition,
    moduleWorldRotation,
    moduleWorldScale
  );
  
  return isPointInPolygon(worldPoint, worldVertices);
}

/**
 * Find which module (if any) contains the given world point
 */
export function findModuleAtPoint(
  worldPoint: Vector2,
  template: StationTemplate,
  stationPosition: Vector2,
  stationRotation: number,
  stationScale: number
): { modulePlacement: StationModulePlacement; moduleIndex: number } | null {
  // Check modules in reverse order (last rendered = on top)
  for (let i = template.modules.length - 1; i >= 0; i--) {
    const modulePlacement = template.modules[i]!;
    if (isPointInModule(worldPoint, modulePlacement, stationPosition, stationRotation, stationScale)) {
      return { modulePlacement, moduleIndex: i };
    }
  }
  return null;
}

/**
 * Find which module at a screen position across all stations
 */
export function findModuleAtScreenPosition(
  screenPoint: Vector2,
  stations: Station[],
  getTemplate: (templateId: string) => StationTemplate | undefined,
  camera: Vector2,
  screenCenter: Vector2,
  zoom: number,
  getStationScale: (station: Station) => number
): ModuleHitResult {
  // Convert screen point to world coordinates
  const worldPoint = screenToWorld(screenPoint, camera, screenCenter, zoom);
  
  // Check each station (in reverse for proper z-order)
  for (let i = stations.length - 1; i >= 0; i--) {
    const station = stations[i]!;
    const templateId = station.templateId ?? station.type;
    const template = getTemplate(templateId);
    
    if (!template) continue;
    
    const stationScale = getStationScale(station);
    const stationRotation = station.rotation ?? 0;
    
    // Check if the station is rendering in full detail (not as a point)
    const boundingRadius = template.boundingRadius ?? 1;
    const screenSize = boundingRadius * stationScale * zoom * 2;
    
    // Only hit-test modules if station is rendered in detail
    if (screenSize < 40) continue; // Skip if rendered as simplified shape
    
    const result = findModuleAtPoint(
      worldPoint,
      template,
      station.position,
      stationRotation,
      stationScale
    );
    
    if (result) {
      return {
        hit: true,
        moduleType: result.modulePlacement.moduleType,
        modulePlacement: result.modulePlacement,
        moduleIndex: result.moduleIndex,
        station,
      };
    }
  }
  
  return { hit: false };
}
