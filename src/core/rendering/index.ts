export * from './mapUtils';
export * from './radarUtils';
export * from './dockingUtils';

// Shape rendering utilities
export {
  // Fallback shapes for graceful degradation
  FALLBACK_SHAPE,
  isValidShape,
  getSafeShape,
  // Coordinate transformations
  transformVertex,
  transformVertices,
  worldToScreen as shapeWorldToScreen,
  screenToWorld as shapeScreenToWorld,
  // Shape rendering
  renderShape,
  renderShapeOutline,
  getShapeScreenSize,
  shouldRenderAsPoint,
  renderPoint,
  renderShapeWithLOD,
  // Engine mount rendering
  getEngineMountWorldPosition,
  getEngineMountWorldDirection,
  renderEngineMounts,
  // Circle rendering (fallback)
  renderCircle,
  // Vertex caching
  createVertexCacheKey,
  VertexCache,
  type VertexCacheKey,
  // Station rendering
  renderStationModule,
  renderStation,
  renderStationWithLOD,
  // Module hit testing
  findModuleAtPoint,
  findModuleAtScreenPosition,
  getModuleWorldPosition,
  isPointInModule,
  type ModuleHitResult,
} from './shapeRenderer';
