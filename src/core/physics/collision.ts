/**
 * Collision Detection System
 * 
 * Implements Separating Axis Theorem (SAT) for convex polygon collision detection.
 * Supports AABB pre-checks for performance optimization.
 * 
 * @module core/physics/collision
 */

import type { Vector2, Shape, CollisionResult, BoundingBox, Station, StationModulePlacement } from '@/models';
import {
  vec2Sub,
  vec2Normalize,
  vec2Dot,
  vec2Perpendicular,
  vec2Add,
  vec2Scale,
  rotatePoint,
} from './vectorMath';
import { getStationTemplateById, getStationModule } from '@/data/shapes';

// =============================================================================
// Bounding Box Utilities
// =============================================================================

/**
 * Calculate the axis-aligned bounding box for a polygon
 */
export function getBoundingBox(vertices: Vector2[]): BoundingBox {
  if (vertices.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = vertices[0]!.x;
  let maxX = vertices[0]!.x;
  let minY = vertices[0]!.y;
  let maxY = vertices[0]!.y;

  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]!;
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Check if two bounding boxes overlap (touching is NOT overlapping)
 */
export function checkBoundingBoxOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY);
}

// =============================================================================
// Polygon Projection for SAT
// =============================================================================

/**
 * Project a polygon onto an axis and return the min/max extent
 */
export function projectPolygon(
  vertices: Vector2[],
  axis: Vector2
): { min: number; max: number } {
  if (vertices.length === 0) {
    return { min: 0, max: 0 };
  }

  let min = vec2Dot(vertices[0]!, axis);
  let max = min;

  for (let i = 1; i < vertices.length; i++) {
    const projection = vec2Dot(vertices[i]!, axis);
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }

  return { min, max };
}

/**
 * Check if two projection intervals overlap
 * Returns overlap amount (negative = gap, positive = overlap)
 */
function getIntervalOverlap(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number
): number {
  // Calculate overlap in both directions
  const overlap1 = aMax - bMin;
  const overlap2 = bMax - aMin;
  
  // If either is negative, there's a gap
  if (overlap1 < 0 || overlap2 < 0) {
    return Math.min(overlap1, overlap2); // Return negative gap
  }
  
  // Return the smaller overlap
  return Math.min(overlap1, overlap2);
}

// =============================================================================
// SAT Collision Detection
// =============================================================================

/**
 * Get the edge normal axes for SAT collision detection
 */
function getPolygonAxes(vertices: Vector2[]): Vector2[] {
  const axes: Vector2[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % vertices.length]!;
    
    // Get edge vector
    const edge = vec2Sub(p2, p1);
    
    // Get perpendicular (normal) and normalize
    const normal = vec2Normalize(vec2Perpendicular(edge));
    
    // Skip if zero length (degenerate edge)
    if (normal.x === 0 && normal.y === 0) continue;
    
    axes.push(normal);
  }
  
  return axes;
}

/**
 * Check for collision between two convex polygons using SAT
 */
export function checkPolygonCollision(
  verticesA: Vector2[],
  verticesB: Vector2[]
): CollisionResult {
  if (verticesA.length < 3 || verticesB.length < 3) {
    return { collides: false };
  }

  // Get all axes to test (both polygons' normals)
  const axesA = getPolygonAxes(verticesA);
  const axesB = getPolygonAxes(verticesB);
  const axes = [...axesA, ...axesB];

  let minOverlap = Infinity;
  let collisionNormal: Vector2 = { x: 0, y: 0 };

  // Test each axis
  for (const axis of axes) {
    const projA = projectPolygon(verticesA, axis);
    const projB = projectPolygon(verticesB, axis);
    
    const overlap = getIntervalOverlap(projA.min, projA.max, projB.min, projB.max);
    
    // If there's a gap on any axis, no collision
    if (overlap < 0) {
      return { collides: false };
    }
    
    // Track minimum overlap for penetration depth
    if (overlap < minOverlap) {
      minOverlap = overlap;
      collisionNormal = axis;
    }
  }

  // Calculate contact point (approximate as center of overlap)
  const centerA = getPolygonCentroid(verticesA);
  const centerB = getPolygonCentroid(verticesB);
  const contactPoint = {
    x: (centerA.x + centerB.x) / 2,
    y: (centerA.y + centerB.y) / 2,
  };

  // Ensure normal points from A to B
  const centerDiff = vec2Sub(centerB, centerA);
  if (vec2Dot(collisionNormal, centerDiff) < 0) {
    collisionNormal = { x: -collisionNormal.x, y: -collisionNormal.y };
  }

  return {
    collides: true,
    penetration: minOverlap,
    normal: collisionNormal,
    contactPoint,
  };
}

/**
 * Calculate the centroid (geometric center) of a polygon
 */
export function getPolygonCentroid(vertices: Vector2[]): Vector2 {
  if (vertices.length === 0) {
    return { x: 0, y: 0 };
  }

  let x = 0;
  let y = 0;

  for (const v of vertices) {
    x += v.x;
    y += v.y;
  }

  return {
    x: x / vertices.length,
    y: y / vertices.length,
  };
}

// =============================================================================
// World Space Transformations
// =============================================================================

/**
 * Transform shape vertices from local space to world space
 * 
 * @param shape - The shape with normalized local vertices
 * @param position - World position of the shape
 * @param rotation - Rotation in degrees
 * @param scale - Scale factor (default: 1.0)
 */
export function getWorldVertices(
  shape: Shape,
  position: Vector2,
  rotation: number,
  scale: number = 1.0
): Vector2[] {
  return shape.vertices.map((vertex) => {
    // Scale the vertex
    const scaled = vec2Scale(vertex, scale);
    // Rotate around origin
    const rotated = rotatePoint(scaled, rotation);
    // Translate to world position
    return vec2Add(rotated, position);
  });
}

/**
 * Get the world-space bounding box for a shape
 */
export function getShapeBoundingBox(
  shape: Shape,
  position: Vector2,
  rotation: number,
  scale: number = 1.0
): BoundingBox {
  const worldVertices = getWorldVertices(shape, position, rotation, scale);
  return getBoundingBox(worldVertices);
}

// =============================================================================
// Station Module Collision Utilities
// =============================================================================

/**
 * Module scale factor - must match shapeRenderer's MODULE_SCALE_FACTOR (0.12)
 * Modules are rendered at 12% of the station's visual scale
 */
const STATION_MODULE_SCALE_FACTOR = 0.12;

/**
 * Station visual multiplier - must match SystemMap.vue calculation (6x)
 * Station scale = dockingRange * 6 for proper visual sizing
 */
const STATION_VISUAL_MULTIPLIER = 3;

/**
 * Get world vertices for a single station module
 * 
 * @param modulePlacement - Module placement within station template
 * @param stationPosition - Station world position
 * @param stationRotation - Station rotation in degrees
 * @param stationScale - Station scale (typically dockingRange * STATION_VISUAL_MULTIPLIER)
 * @returns Array of world-space vertices for the module
 */
export function getModuleWorldVertices(
  modulePlacement: StationModulePlacement,
  stationPosition: Vector2,
  stationRotation: number,
  stationScale: number
): Vector2[] {
  const moduleDefinition = getStationModule(modulePlacement.moduleType);
  if (!moduleDefinition) return [];

  // Calculate module world position
  // Module position is in normalized coordinates, scaled by station scale
  const stationRotationRad = (stationRotation * Math.PI) / 180;
  const cos = Math.cos(stationRotationRad);
  const sin = Math.sin(stationRotationRad);
  
  const moduleWorldX = stationPosition.x + 
    (modulePlacement.position.x * cos - modulePlacement.position.y * sin) * stationScale;
  const moduleWorldY = stationPosition.y + 
    (modulePlacement.position.x * sin + modulePlacement.position.y * cos) * stationScale;

  // Module rotation combines station rotation and module's own rotation
  const moduleWorldRotation = stationRotation + modulePlacement.rotation;

  // Module scale is a fraction of station scale
  const moduleWorldScale = stationScale * STATION_MODULE_SCALE_FACTOR;

  return getWorldVertices(
    moduleDefinition.shape,
    { x: moduleWorldX, y: moduleWorldY },
    moduleWorldRotation,
    moduleWorldScale
  );
}

/**
 * Calculate the visual bounding radius of a station including all modules
 * This is the actual size of the station as rendered, not just the docking range
 * 
 * @param station - Station to calculate bounding radius for
 * @returns Bounding radius from station center to furthest module vertex
 */
export function getStationVisualBoundingRadius(station: Station): number {
  const templateId = station.templateId ?? station.type;
  const template = getStationTemplateById(templateId);
  if (!template) return station.dockingRange;

  const stationScale = station.dockingRange * STATION_VISUAL_MULTIPLIER;
  const stationRotation = station.rotation ?? 0;

  let maxRadius = 0;

  // Check all modules' vertices
  for (const modulePlacement of template.modules) {
    const vertices = getModuleWorldVertices(
      modulePlacement,
      { x: 0, y: 0 }, // Calculate relative to station center
      stationRotation,
      stationScale
    );
    
    // Find the furthest vertex from the origin
    for (const vertex of vertices) {
      const dist = Math.hypot(vertex.x, vertex.y);
      if (dist > maxRadius) {
        maxRadius = dist;
      }
    }
  }

  return maxRadius > 0 ? maxRadius : station.dockingRange;
}

/**
 * Result of station module collision check
 */
export interface StationModuleCollision {
  /** Module that was collided with */
  modulePlacement: StationModulePlacement;
  /** Module index in template */
  moduleIndex: number;
  /** Collision result with penetration info */
  collision: CollisionResult;
  /** Module's world vertices */
  moduleVertices: Vector2[];
}

/**
 * Get all modules' world vertices for a station
 * Used for collision detection against entire station geometry
 * 
 * @param station - The station to get module vertices for
 * @returns Array of module vertex arrays, one per module
 */
export function getAllStationModuleVertices(
  station: Station
): Array<{ modulePlacement: StationModulePlacement; vertices: Vector2[]; moduleIndex: number }> {
  const templateId = station.templateId ?? station.type;
  const template = getStationTemplateById(templateId);
  if (!template) return [];

  const stationScale = station.dockingRange * STATION_VISUAL_MULTIPLIER;
  const stationRotation = station.rotation ?? 0;

  const results: Array<{ modulePlacement: StationModulePlacement; vertices: Vector2[]; moduleIndex: number }> = [];

  for (let i = 0; i < template.modules.length; i++) {
    const modulePlacement = template.modules[i]!;
    const vertices = getModuleWorldVertices(
      modulePlacement,
      station.position,
      stationRotation,
      stationScale
    );
    
    if (vertices.length >= 3) {
      results.push({
        modulePlacement,
        vertices,
        moduleIndex: i,
      });
    }
  }

  return results;
}

/**
 * Check collision between a polygon and all station modules
 * Returns the closest/deepest collision if multiple modules are hit
 * 
 * @param testVertices - Vertices of the polygon to test (e.g., ship hull)
 * @param station - Station to check collision against
 * @returns Collision result with module info, or null if no collision
 */
export function checkStationCollision(
  testVertices: Vector2[],
  station: Station
): StationModuleCollision | null {
  const modules = getAllStationModuleVertices(station);
  
  let deepestCollision: StationModuleCollision | null = null;
  let maxPenetration = 0;

  for (const { modulePlacement, vertices, moduleIndex } of modules) {
    // Quick AABB check first
    const testBounds = getBoundingBox(testVertices);
    const moduleBounds = getBoundingBox(vertices);
    
    if (!checkBoundingBoxOverlap(testBounds, moduleBounds)) {
      continue;
    }

    // Full SAT collision check
    const collision = checkPolygonCollision(testVertices, vertices);
    
    if (collision.collides && (collision.penetration ?? 0) > maxPenetration) {
      maxPenetration = collision.penetration ?? 0;
      deepestCollision = {
        modulePlacement,
        moduleIndex,
        collision,
        moduleVertices: vertices,
      };
    }
  }

  return deepestCollision;
}

/**
 * Calculate minimum distance from a point to any station module
 * 
 * @param point - Point to check distance from
 * @param station - Station to check distance to
 * @returns Minimum distance to any module (0 if inside a module)
 */
export function getDistanceToStation(
  point: Vector2,
  station: Station
): { distance: number; nearestModuleIndex: number; moduleType: string } {
  const modules = getAllStationModuleVertices(station);
  
  let minDistance = Infinity;
  let nearestModuleIndex = -1;
  let moduleType = 'unknown';

  for (const { modulePlacement, vertices, moduleIndex } of modules) {
    // Check if point is inside this module
    if (isPointInPolygon(point, vertices)) {
      return {
        distance: 0,
        nearestModuleIndex: moduleIndex,
        moduleType: modulePlacement.moduleType,
      };
    }

    // Find distance to nearest edge
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i]!;
      const p2 = vertices[(i + 1) % vertices.length]!;
      
      const dist = pointToSegmentDistance(point, p1, p2);
      if (dist < minDistance) {
        minDistance = dist;
        nearestModuleIndex = moduleIndex;
        moduleType = modulePlacement.moduleType;
      }
    }
  }

  return {
    distance: minDistance === Infinity ? 0 : minDistance,
    nearestModuleIndex,
    moduleType,
  };
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToSegmentDistance(point: Vector2, p1: Vector2, p2: Vector2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    // Segment is a point
    return Math.hypot(point.x - p1.x, point.y - p1.y);
  }
  
  // Project point onto segment
  const t = Math.max(0, Math.min(1, 
    ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSq
  ));
  
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  
  return Math.hypot(point.x - projX, point.y - projY);
}

// =============================================================================
// Circle-Polygon Collision (for fallback/simple shapes)
// =============================================================================

/**
 * Check if a point is inside a convex polygon
 */
export function isPointInPolygon(point: Vector2, vertices: Vector2[]): boolean {
  if (vertices.length < 3) return false;

  let sign = 0;
  
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % vertices.length]!;
    
    // Cross product of edge with vector to point
    const d = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x);
    
    if (sign === 0) {
      sign = d > 0 ? 1 : -1;
    } else if ((d > 0 ? 1 : -1) !== sign) {
      return false; // Point is on different side of an edge
    }
  }
  
  return true;
}

/**
 * Check if a circle overlaps with a polygon
 */
export function checkCirclePolygonCollision(
  circleCenter: Vector2,
  circleRadius: number,
  vertices: Vector2[]
): CollisionResult {
  if (vertices.length < 3) {
    return { collides: false };
  }

  // Check if circle center is inside polygon
  if (isPointInPolygon(circleCenter, vertices)) {
    return {
      collides: true,
      penetration: circleRadius, // Approximate
      contactPoint: circleCenter,
    };
  }

  // Check each edge for collision
  let minDist = Infinity;
  let closestPoint: Vector2 = { x: 0, y: 0 };

  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % vertices.length]!;
    
    const closest = closestPointOnSegment(circleCenter, p1, p2);
    const dist = Math.sqrt(
      (circleCenter.x - closest.x) ** 2 + (circleCenter.y - closest.y) ** 2
    );
    
    if (dist < minDist) {
      minDist = dist;
      closestPoint = closest;
    }
  }

  if (minDist < circleRadius) {
    const normal = vec2Normalize(vec2Sub(circleCenter, closestPoint));
    return {
      collides: true,
      penetration: circleRadius - minDist,
      normal,
      contactPoint: closestPoint,
    };
  }

  return { collides: false };
}

/**
 * Find the closest point on a line segment to a given point
 */
function closestPointOnSegment(
  point: Vector2,
  segStart: Vector2,
  segEnd: Vector2
): Vector2 {
  const seg = vec2Sub(segEnd, segStart);
  const segLenSq = seg.x * seg.x + seg.y * seg.y;
  
  if (segLenSq === 0) {
    return segStart; // Degenerate segment
  }
  
  const toPoint = vec2Sub(point, segStart);
  let t = vec2Dot(toPoint, seg) / segLenSq;
  t = Math.max(0, Math.min(1, t)); // Clamp to segment
  
  return {
    x: segStart.x + t * seg.x,
    y: segStart.y + t * seg.y,
  };
}

// =============================================================================
// Swept Collision Detection
// =============================================================================

/**
 * Check for collision during movement (swept collision)
 * Returns the time of collision (0-1) or null if no collision
 * 
 * @param verticesA - Moving polygon vertices at start position
 * @param velocity - Movement vector
 * @param verticesB - Static polygon vertices
 */
export function checkSweptCollision(
  verticesA: Vector2[],
  velocity: Vector2,
  verticesB: Vector2[]
): { time: number; normal: Vector2 } | null {
  if (verticesA.length < 3 || verticesB.length < 3) {
    return null;
  }

  // Get all axes from both polygons plus velocity axis
  const axesA = getPolygonAxes(verticesA);
  const axesB = getPolygonAxes(verticesB);
  const velocityAxis = vec2Normalize(velocity);
  
  // Only add velocity axis if non-zero
  const axes = velocityAxis.x !== 0 || velocityAxis.y !== 0 
    ? [...axesA, ...axesB, velocityAxis]
    : [...axesA, ...axesB];

  let firstEntry = -Infinity;
  let lastExit = Infinity;
  let collisionNormal: Vector2 = { x: 0, y: 0 };

  for (const axis of axes) {
    const projA = projectPolygon(verticesA, axis);
    const projB = projectPolygon(verticesB, axis);
    
    // Project velocity onto axis
    const vProj = vec2Dot(velocity, axis);
    
    if (Math.abs(vProj) < 0.0001) {
      // Velocity is parallel to axis - check static overlap
      if (projA.max < projB.min || projB.max < projA.min) {
        return null; // No overlap on this axis, no collision possible
      }
      continue;
    }
    
    // Calculate entry and exit times
    const entry = (projB.min - projA.max) / vProj;
    const exit = (projB.max - projA.min) / vProj;
    
    // Swap if moving in negative direction
    const tEntry = Math.min(entry, exit);
    const tExit = Math.max(entry, exit);
    
    if (tEntry > firstEntry) {
      firstEntry = tEntry;
      collisionNormal = axis;
      // Ensure normal faces against velocity
      if (vProj > 0) {
        collisionNormal = { x: -axis.x, y: -axis.y };
      }
    }
    
    if (tExit < lastExit) {
      lastExit = tExit;
    }
    
    // No collision if we enter after we exit
    if (firstEntry > lastExit) {
      return null;
    }
  }

  // Check if collision happens within movement (0 to 1)
  if (firstEntry >= 0 && firstEntry <= 1) {
    return {
      time: firstEntry,
      normal: collisionNormal,
    };
  }

  return null;
}
