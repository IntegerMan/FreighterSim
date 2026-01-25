/**
 * PixiJS Shape Rendering
 * 
 * Functions for rendering polygon shapes using Pixi Graphics.
 * Mirrors Canvas shape rendering but outputs to Pixi Graphics objects.
 */

import { Graphics } from 'pixi.js';
import type { Vector2, Shape } from '@/models';
import { transformVertex, getSafeShape } from './shapeRenderer';

export interface PixiShapeRenderOptions {
  shape: Shape;
  position: Vector2;
  rotation: number;
  scale: number;
  camera: Vector2;
  screenCenter: Vector2;
  zoom: number;
  fillColor: number;
  strokeColor?: number;
  lineWidth?: number;
  minSize?: number;
}

/**
 * Render a shape polygon to Pixi Graphics
 */
export function renderPixiShape(
  graphics: Graphics,
  options: PixiShapeRenderOptions
): void {
  const {
    shape,
    position,
    rotation,
    scale,
    camera,
    screenCenter,
    zoom,
    fillColor,
    strokeColor,
    lineWidth = 1,
  } = options;

  const safeShape = getSafeShape(shape);
  const vertices = safeShape.vertices;
  if (vertices.length < 3) return;

  // Transform vertices to screen coordinates
  const screenVertices = vertices.flatMap(vertex => {
    const worldPos = transformVertex(vertex, position, rotation, scale);
    return [
      screenCenter.x + (worldPos.x - camera.x) * zoom,
      screenCenter.y - (worldPos.y - camera.y) * zoom,
    ];
  });

  // Draw polygon using Pixi v8 API
  graphics.poly(screenVertices);
  if (strokeColor !== undefined) {
    graphics.stroke({ width: lineWidth, color: strokeColor });
  }
  graphics.fill(fillColor);
}

/**
 * Render a shape outline only (no fill) to Pixi Graphics
 */
export function renderPixiShapeOutline(
  graphics: Graphics,
  options: Omit<PixiShapeRenderOptions, 'fillColor'>
): void {
  const {
    shape,
    position,
    rotation,
    scale,
    camera,
    screenCenter,
    zoom,
    strokeColor = 0xffffff,
    lineWidth = 1,
  } = options;

  const safeShape = getSafeShape(shape);
  const vertices = safeShape.vertices;
  if (vertices.length < 3) return;

  const screenVertices = vertices.flatMap(vertex => {
    const worldPos = transformVertex(vertex, position, rotation, scale);
    return [
      screenCenter.x + (worldPos.x - camera.x) * zoom,
      screenCenter.y - (worldPos.y - camera.y) * zoom,
    ];
  });

  graphics.poly(screenVertices);
  graphics.stroke({ width: lineWidth, color: strokeColor });
}

/**
 * Render a shape with automatic LOD fallback to circle
 */
export function renderPixiShapeWithLOD(
  graphics: Graphics,
  options: PixiShapeRenderOptions
): void {
  const {
    shape,
    position,
    rotation,
    scale,
    camera,
    screenCenter,
    zoom,
    fillColor,
    strokeColor,
    lineWidth = 1,
    minSize = 4,
  } = options;

  const screenSize = shape.boundingRadius * scale * zoom * 2;
  if (screenSize < minSize) {
    // Render as simple circle for LOD
    const screenPos = {
      x: screenCenter.x + (position.x - camera.x) * zoom,
      y: screenCenter.y - (position.y - camera.y) * zoom,
    };
    graphics.circle(screenPos.x, screenPos.y, Math.max(1, minSize / 2));
    graphics.fill(fillColor);
  } else {
    renderPixiShape(graphics, {
      shape,
      position,
      rotation,
      scale,
      camera,
      screenCenter,
      zoom,
      fillColor,
      strokeColor,
      lineWidth,
    });
  }
}

