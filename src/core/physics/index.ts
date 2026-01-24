export { 
  updateMovement, 
  calculateStoppingDistance, 
  calculateTimeToStop, 
  calculateTimeToReach,
  type MovementState, 
  type MovementResult 
} from './MovementSystem';

// Vector math utilities
export {
  vec2Sub,
  vec2Normalize,
  vec2Dot,
  vec2Cross,
  vec2Perpendicular,
  rotatePoint,
  rotatePointAround,
  vec2Length,
  vec2LengthSquared,
  vec2Distance,
  vec2Scale,
  vec2Add,
  vec2Lerp,
  vec2ApproxEqual,
  vec2Negate,
  vec2Project,
  vec2Reflect,
} from './vectorMath';

// Collision detection
export {
  getBoundingBox,
  checkBoundingBoxOverlap,
  projectPolygon,
  checkPolygonCollision,
  getPolygonCentroid,
  getWorldVertices,
  getShapeBoundingBox,
  isPointInPolygon,
  checkCirclePolygonCollision,
  checkSweptCollision,
  // Station module collision utilities
  getModuleWorldVertices,
  getAllStationModuleVertices,
  checkStationCollision,
  getDistanceToStation,
  getStationVisualBoundingRadius,
  type StationModuleCollision,
} from './collision';

// T053: Raycasting utilities
export {
  rayPolygonIntersection,
  raySegmentIntersection,
  rayShapeIntersection,
  raycast,
  raycastAll,
  createRay,
  hasLineOfSight,
  calculateVisibility,
  getWorldVertices as getRaycastWorldVertices, // Alias to avoid conflict with collision.ts
  type Ray,
  type RayHit,
  type RaycastTarget,
} from './raycasting';

// T070: Spatial partitioning for broad-phase collision
export {
  SpatialGrid,
  createOptimizedGrid,
  type SpatialObject,
  type QueryResult,
} from './spatialGrid';
