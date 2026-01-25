/**
 * PixiJS renderer initialization and layer management.
 * Manages the PixiJS Application instance and rendering layers.
 */

import { Application, Container } from 'pixi.js';
import type { RenderingLayer } from '../../models/RenderingLayer';
import type { RendererCapability } from './capabilities';

export interface PixiRendererConfig {
  /** Canvas element or selector to attach the renderer to */
  view?: HTMLCanvasElement;
  
  /** Width of the renderer in pixels */
  width: number;
  
  /** Height of the renderer in pixels */
  height: number;
  
  /** Rendering capability to use */
  capability: RendererCapability;
  
  /** Background color (default: 0x000000) */
  backgroundColor?: number;
  
  /** Enable antialiasing (default: true) */
  antialias?: boolean;
  
  /** Resolution for HiDPI displays (default: window.devicePixelRatio) */
  resolution?: number;
}

export class PixiRenderer {
  private app: Application | null = null;
  private readonly layers: Map<string, Container> = new Map();
  private _capability: RendererCapability = 'None';

  /**
   * Initializes the PixiJS renderer with the specified configuration.
   */
  async initialize(config: PixiRendererConfig): Promise<void> {
    this._capability = config.capability;

    // Map capability to PixiJS preference
    const preference = this.getRendererPreference(config.capability);

    try {
      this.app = new Application();
      await this.app.init({
        canvas: config.view,
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor ?? 0x000000,
        antialias: config.antialias ?? true,
        resolution: config.resolution ?? window.devicePixelRatio,
        preference,
      });

      // Initialize default layers
      this.initializeLayers();
    } catch (error) {
      console.error('Failed to initialize PixiJS renderer:', error);
      throw new Error('Renderer initialization failed');
    }
  }

  /**
   * Maps capability to PixiJS renderer preference.
   */
  private getRendererPreference(_capability: RendererCapability): 'webgl' | 'webgpu' {
    // PixiJS v8 uses 'webgl' for both WebGL1 and WebGL2
    // For Canvas fallback, we still request 'webgl' and let PixiJS handle it
    return 'webgl';
  }

  /**
   * Initializes the default rendering layers.
   * Layers: background (0), game (1), effects (2), ui (3)
   */
  private initializeLayers(): void {
    if (!this.app) return;

    const layerDefinitions: RenderingLayer[] = [
      { id: 'background', zIndex: 0, visible: true, scaleFactor: 1 },
      { id: 'game', zIndex: 1, visible: true, scaleFactor: 1 },
      { id: 'effects', zIndex: 2, visible: true, scaleFactor: 1 },
      { id: 'ui', zIndex: 3, visible: true, scaleFactor: 1 },
    ];

    for (const layerDef of layerDefinitions) {
      const container = new Container();
      container.label = layerDef.id;
      container.zIndex = layerDef.zIndex;
      container.visible = layerDef.visible;
      container.scale.set(layerDef.scaleFactor);
      
      this.app.stage.addChild(container);
      this.layers.set(layerDef.id, container);
    }

    // Enable sorting by zIndex
    this.app.stage.sortableChildren = true;
  }

  /**
   * Gets a layer container by ID.
   */
  getLayer(id: string): Container | undefined {
    return this.layers.get(id);
  }

  /**
   * Updates layer visibility.
   */
  setLayerVisibility(id: string, visible: boolean): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Updates layer scale factor (for resolution throttling).
   */
  setLayerScale(id: string, scaleFactor: number): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.scale.set(scaleFactor);
    }
  }

  /**
   * Gets the PixiJS Application instance.
   */
  getApp(): Application | null {
    return this.app;
  }

  /**
   * Gets the canvas element.
   */
  getCanvas(): HTMLCanvasElement | undefined {
    return this.app?.canvas;
  }

  /**
   * Resizes the renderer.
   */
  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }

  /**
   * Destroys the renderer and cleans up resources.
   */
  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.layers.clear();
  }

  /**
   * Gets the current rendering capability.
   */
  get capability(): RendererCapability {
    return this._capability;
  }
}
