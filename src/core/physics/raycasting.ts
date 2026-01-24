/**
 * 2D Raycasting System
 * 
 * Provides ray-polygon intersection detection for sensor occlusion
 * and line-of-sight calculations.
 * 
 * @module core/physics/raycasting
 * @see ADR-0012 for design decisions
 */

import type { Vector2, Shape } from '@/models';

// =============================================================================
// Ray Types
// =============================================================================

/**
 * A 2D ray defined by an origin point and direction
 */
export interface Ray {
  /** Starting point of the ray */
  origin: Vector2;
  /** Normalized direction vector */
  direction: Vector2;
}

/**
 * Result of a ray intersection test
 */
export interface RayHit {
  /** Whether the ray hit something */
  hit: boolean;
  /** Distance from ray origin to hit point (Infinity if no hit) */
  distance: number;
  /** World position of the hit point */
  point: Vector2 | null;
  /** Surface normal at the hit point */
  normal: Vector2 | null;
  /** ID of the object that was hit */
  objectId: string | null;
}

/**
 * Object that can be tested for ray intersection
 */
export interface RaycastTarget {
  /** Unique identifier */
  id: string;
  /** Object position in world space */
  position: Vector2;
  /** Object rotation in degrees */
  rotation: number;
  /** Object scale */
  scale: number;
  /** Shape definition */
  shape: Shape;
}

// =============================================================================
// Ray-Polygon Intersection (T051)
// =============================================================================

/**
 * T051: Test if a ray intersects with a convex polygon
 * Uses the ray-segment intersection algorithm for each polygon edge.
 * 
 * @param ray - The ray to test
 * @param vertices - Polygon vertices in world space (ordered counter-clockwise)
 * @returns RayHit result with intersection details
 */
export function rayPolygonIntersection(
  ray: Ray,
  vertices: Vector2[]
): { hit: boolean; distance: number; point: Vector2 | null; normal: Vector2 | null } {
  if (vertices.length < 3) {
    return { hit: false, distance: Infinity, point: null, normal: null };
  }

  let nearestDistance = Infinity;
  let nearestPoint: Vector2 | null = null;
  let nearestNormal: Vector2 | null = null;

  // Test against each edge of the polygon
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % vertices.length]!;

    const result = raySegmentIntersection(ray, p1, p2);
    
    if (result.hit && result.distance < nearestDistance) {
      nearestDistance = result.distance;
      nearestPoint = result.point;
      nearestNormal = result.normal;
    }
  }

  return {
    hit: nearestDistance < Infinity,
    distance: nearestDistance,
    point: nearestPoint,
    normal: nearestNormal,
  };
}

/**
 * Test if a ray intersects with a line segment
 * Uses parametric ray-line intersection
 * 
 * @param ray - The ray to test
 * @param p1 - Start point of the segment
 * @param p2 - End point of the segment
 * @returns Intersection result
 */
export function raySegmentIntersection(
  ray: Ray,
  p1: Vector2,
  p2: Vector2
): { hit: boolean; distance: number; point: Vector2 | null; normal: Vector2 | null } {
  // Ray: P = origin + t * direction (t >= 0)
  // Segment: Q = p1 + s * (p2 - p1) (0 <= s <= 1)
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  
  // Cross product of direction and segment direction
  const cross = ray.direction.x * dy - ray.direction.y * dx;
  
  // Check if ray is parallel to the segment (cross ~= 0)
  if (Math.abs(cross) < 1e-10) {
    return { hit: false, distance: Infinity, point: null, normal: null };
  }
  
  // Vector from ray origin to segment start
  const ox = p1.x - ray.origin.x;
  const oy = p1.y - ray.origin.y;
  
  // Calculate parameters
  const t = (ox * dy - oy * dx) / cross;
  const s = (ox * ray.direction.y - oy * ray.direction.x) / cross;
  
  // Check if intersection is valid (t >= 0 for ray, 0 <= s <= 1 for segment)
  if (t >= 0 && s >= 0 && s <= 1) {
    const point: Vector2 = {
      x: ray.origin.x + t * ray.direction.x,
      y: ray.origin.y + t * ray.direction.y,
    };
    
    // Calculate outward normal (perpendicular to segment, facing away from polygon interior)
    // For counter-clockwise vertices, the normal points outward when rotated 90° clockwise
    const segmentLength = Math.hypot(dx, dy);
    const normal: Vector2 = {
      x: dy / segmentLength,
      y: -dx / segmentLength,
    };
    
    return { hit: true, distance: t, point, normal };
  }
  
  return { hit: false, distance: Infinity, point: null, normal: null };
}

/**
 * Transform shape vertices to world space
 * 
 * @param shape - The shape to transform
 * @param position - World position
 * @param rotation - Rotation in degrees
 * @param scale - Scale factor
 * @returns Array of vertices in world space
 */
export function getWorldVertices(
  shape: Shape,
  position: Vector2,
  rotation: number,
  scale: number
): Vector2[] {
  const rotationRad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  
  return shape.vertices.map(v => ({
    x: position.x + (v.x * cos - v.y * sin) * scale,
    y: position.y + (v.x * sin + v.y * cos) * scale,
  }));
}

/**
 * Test if a ray intersects with a transformed shape
 * 
 * @param ray - The ray to test
 * @param target - The object to test against
 * @returns RayHit result
 */
export function rayShapeIntersection(
  ray: Ray,
  target: RaycastTarget
): RayHit {
  const worldVertices = getWorldVertices(
    target.shape,
    target.position,
    target.rotation,
    target.scale
  );
  
  const result = rayPolygonIntersection(ray, worldVertices);
  
  return {
    hit: result.hit,
    distance: result.distance,
    point: result.point,
    normal: result.normal,
    objectId: result.hit ? target.id : null,
  };
}

// =============================================================================
// Multi-Object Raycasting (T052)
// =============================================================================

/**
 * T052: Cast a ray against multiple objects and find the nearest hit
 * 
 * @param ray - The ray to cast
 * @param targets - Array of objects to test
 * @param maxDistance - Maximum distance to check (optional, defaults to Infinity)
 * @returns RayHit for the nearest object, or a miss result
 */
export function raycast(
  ray: Ray,
  targets: RaycastTarget[],
  maxDistance: number = Infinity
): RayHit {
  let nearestHit: RayHit = {
    hit: false,
    distance: Infinity,
    point: null,
    normal: null,
    objectId: null,
  };
  
  for (const target of targets) {
    // Quick bounding circle check first
    const dx = target.position.x - ray.origin.x;
    const dy = target.position.y - ray.origin.y;
    const distanceToCenter = Math.hypot(dx, dy);
    const boundingRadius = target.shape.boundingRadius * target.scale;
    
    // Skip if object is behind the ray origin or too far
    if (distanceToCenter - boundingRadius > maxDistance) continue;
    
    // Detailed intersection test
    const hit = rayShapeIntersection(ray, target);
    
    if (hit.hit && hit.distance < nearestHit.distance && hit.distance <= maxDistance) {
      nearestHit = hit;
    }
  }
  
  return nearestHit;
}

/**
 * Cast a ray and return all hits, sorted by distance
 * 
 * @param ray - The ray to cast
 * @param targets - Array of objects to test
 * @param maxDistance - Maximum distance to check
 * @returns Array of hits sorted by distance (nearest first)
 */
export function raycastAll(
  ray: Ray,
  targets: RaycastTarget[],
  maxDistance: number = Infinity
): RayHit[] {
  const hits: RayHit[] = [];
  
  for (const target of targets) {
    const hit = rayShapeIntersection(ray, target);
    
    if (hit.hit && hit.distance <= maxDistance) {
      hits.push(hit);
    }
  }
  
  // Sort by distance (nearest first)
  hits.sort((a, b) => a.distance - b.distance);
  
  return hits;
}

/**
 * Create a ray from two points
 * 
 * @param from - Ray origin
 * @param to - Point the ray is directed towards
 * @returns Ray with normalized direction
 */
export function createRay(from: Vector2, to: Vector2): Ray {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  
  if (length === 0) {
    return { origin: from, direction: { x: 1, y: 0 } };
  }
  
  return {
    origin: { ...from },
    direction: { x: dx / length, y: dy / length },
  };
}

/**
 * Check if there is a clear line of sight between two points
 * 
 * @param from - Starting point
 * @param to - Target point
 * @param obstacles - Objects that could block the line of sight
 * @returns True if line of sight is clear, false if blocked
 */
export function hasLineOfSight(
  from: Vector2,
  to: Vector2,
  obstacles: RaycastTarget[]
): boolean {
  const ray = createRay(from, to);
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  
  const hit = raycast(ray, obstacles, distance);
  
  // Line of sight is clear if no hit, or hit is beyond the target
  return !hit.hit || hit.distance >= distance - 0.001;
}

/**
 * Calculate occlusion percentage of a target by obstacles
 * Uses multiple sample rays to estimate visibility
 * 
 * @param from - Observer position
 * @param target - Target to check visibility of
 * @param obstacles - Objects that could occlude the target
 * @param sampleCount - Number of rays to cast (default: 8)
 * @returns Visibility percentage (0 = fully occluded, 1 = fully visible)
 */
export function calculateVisibility(
  from: Vector2,
  target: RaycastTarget,
  obstacles: RaycastTarget[],
  sampleCount: number = 8
): number {
  // Remove the target from obstacles
  const filteredObstacles = obstacles.filter(o => o.id !== target.id);
  
  // Sample points around the target's bounding circle
  const sampleRadius = target.shape.boundingRadius * target.scale * 0.8;
  let visibleCount = 0;
  
  for (let i = 0; i < sampleCount; i++) {
    const angle = (i / sampleCount) * Math.PI * 2;
    const samplePoint: Vector2 = {
      x: target.position.x + Math.cos(angle) * sampleRadius,
      y: target.position.y + Math.sin(angle) * sampleRadius,
    };
    
    if (hasLineOfSight(from, samplePoint, filteredObstacles)) {
      visibleCount++;
    }
  }
  
  // Also check center point
  if (hasLineOfSight(from, target.position, filteredObstacles)) {
    visibleCount++;
  }
  
  return visibleCount / (sampleCount + 1);
}
