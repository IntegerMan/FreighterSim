export * from './mapUtils';
export * from './radarUtils';

// Shape rendering utilities
export {
  transformVertex,
  transformVertices,
  worldToScreen as shapeWorldToScreen,
  screenToWorld as shapeScreenToWorld,
  renderShape,
  renderShapeOutline,
  getShapeScreenSize,
  shouldRenderAsPoint,
  renderPoint,
  renderShapeWithLOD,
  getEngineMountWorldPosition,
  getEngineMountWorldDirection,
  renderEngineMounts,
  renderCircle,
  createVertexCacheKey,
  VertexCache,
  type VertexCacheKey,
  renderStationModule,
  renderStation,
  renderStationWithLOD,
} from './shapeRenderer';
