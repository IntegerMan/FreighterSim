/**
 * 2D vector for positions and directions
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Create a new Vector2
 */
export function vec2(x: number, y: number): Vector2 {
  return { x, y };
}

/**
 * Add two vectors
 */
export function vec2Add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract vector b from vector a
 */
export function vec2Sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply vector by scalar
 */
export function vec2Scale(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Get the length (magnitude) of a vector
 */
export function vec2Length(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Get the distance between two points
 */
export function vec2Distance(a: Vector2, b: Vector2): number {
  return vec2Length(vec2Sub(b, a));
}

/**
 * Normalize a vector (make it length 1)
 */
export function vec2Normalize(v: Vector2): Vector2 {
  const len = vec2Length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Create a vector from an angle (in degrees) and length
 */
export function vec2FromAngle(degrees: number, length: number = 1): Vector2 {
  const radians = degreesToRadians(degrees);
  return {
    x: Math.cos(radians) * length,
    // World coordinates use +Y as up; flip the sine so 90° points down on screen
    y: -Math.sin(radians) * length,
  };
}

/**
 * Get the angle (in degrees) of a vector
 */
export function vec2ToAngle(v: Vector2): number {
  return radiansToDegrees(Math.atan2(v.y, v.x));
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize an angle to 0-360 range
 */
export function normalizeAngle(degrees: number): number {
  let result = degrees % 360;
  if (result < 0) result += 360;
  return result;
}

/**
 * Calculate the shortest angular distance between two angles
 * Returns a value between -180 and 180
 */
export function angleDifference(from: number, to: number): number {
  let diff = normalizeAngle(to) - normalizeAngle(from);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Move a value towards a target by a maximum delta
 */
export function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}

/**
 * Move an angle towards a target angle by a maximum delta
 * Handles wraparound correctly
 */
export function moveTowardsAngle(current: number, target: number, maxDelta: number): number {
  const diff = angleDifference(current, target);
  if (Math.abs(diff) <= maxDelta) {
    return normalizeAngle(target);
  }
  return normalizeAngle(current + Math.sign(diff) * maxDelta);
}
