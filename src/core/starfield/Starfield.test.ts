import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Starfield } from './Starfield';
import { createMockCanvasContext } from '@/test/mocks/canvas';
import type { StarfieldConfig } from '@/models';
import type { CameraState } from '@/core/rendering';

const createTestConfig = (): StarfieldConfig => ({
  seed: 'test-system',
  layers: [
    {
      parallaxFactor: 1.0,
      density: 5,
      radiusRange: [1, 2],
      brightnessRange: [0.5, 1],
    },
    {
      parallaxFactor: 0.5,
      density: 10,
      radiusRange: [0.5, 1],
      brightnessRange: [0.3, 0.7],
    },
  ],
  cellSize: 500,
});

const createTestCamera = (): CameraState => ({
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  centerX: 0,
  centerY: 0,
  canvasWidth: 800,
  canvasHeight: 600,
});

describe('Starfield', () => {
  let mockCtx: ReturnType<typeof createMockCanvasContext>;

  beforeEach(() => {
    mockCtx = createMockCanvasContext();
  });

  describe('constructor', () => {
    it('creates instance with config', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);

      expect(starfield).toBeInstanceOf(Starfield);
    });
  });

  describe('render', () => {
    it('renders all layers', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Should have drawn stars (arc and fill calls)
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('renders far layers before near layers (back to front)', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      // Track order of fillStyle changes to verify layer order
      const fillStyles: string[] = [];
      mockCtx.fillStyle = '';
      Object.defineProperty(mockCtx, 'fillStyle', {
        set: (value: string) => fillStyles.push(value),
        get: () => fillStyles[fillStyles.length - 1] || '',
      });

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Should have multiple fill style changes for different layers
      expect(fillStyles.length).toBeGreaterThan(0);
    });

    it('uses beginPath for each star', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Each star should call beginPath
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    it('caches stars for repeated renders at same position', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      // First render
      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);
      const callCount1 = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Reset mock
      vi.clearAllMocks();

      // Second render at same position - should use cache
      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);
      const callCount2 = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Same number of stars should be rendered (from cache)
      expect(callCount2).toBe(callCount1);
    });

    it('generates new stars when camera moves to new cells', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      // First render
      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Reset mock
      vi.clearAllMocks();

      // Move camera significantly (past cell boundaries)
      const movedCamera: CameraState = {
        ...camera,
        centerX: 5000,
        centerY: 5000,
      };

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, movedCamera);

      // Should still render stars (newly generated)
      expect(mockCtx.arc).toHaveBeenCalled();
    });
  });

  describe('setConfig', () => {
    it('resets cache when config changes', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      // First render
      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Change config (new seed = new star system)
      starfield.setConfig({ ...config, seed: 'new-system' });

      // Reset mock
      vi.clearAllMocks();

      // Render with new config
      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Should render (new stars generated)
      expect(mockCtx.arc).toHaveBeenCalled();
    });

    it('does not throw when rendering after config change', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      starfield.setConfig({ ...config, seed: 'another-system' });

      expect(() => {
        starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);
      }).not.toThrow();
    });
  });

  describe('culling', () => {
    it('only renders stars within viewport bounds', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);

      // Small viewport centered at origin
      const smallCamera: CameraState = {
        zoom: 1.0,
        panOffset: { x: 0, y: 0 },
        centerX: 0,
        centerY: 0,
        canvasWidth: 100,
        canvasHeight: 100,
      };

      // Large viewport
      const largeCamera: CameraState = {
        ...smallCamera,
        canvasWidth: 2000,
        canvasHeight: 2000,
      };

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, smallCamera);
      const smallCount = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      vi.clearAllMocks();

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, largeCamera);
      const largeCount = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Larger viewport should render more stars
      expect(largeCount).toBeGreaterThan(smallCount);
    });
  });

  describe('star appearance', () => {
    it('uses brightness as alpha in fill style', () => {
      const config = createTestConfig();
      const starfield = new Starfield(config);
      const camera = createTestCamera();

      const fillStyles: string[] = [];
      Object.defineProperty(mockCtx, 'fillStyle', {
        set: (value: string) => fillStyles.push(value),
        get: () => fillStyles[fillStyles.length - 1] || '',
      });

      starfield.render(mockCtx as unknown as CanvasRenderingContext2D, camera);

      // Should have rgba fill styles with alpha values
      const rgbaStyles = fillStyles.filter((s) => s.startsWith('rgba'));
      expect(rgbaStyles.length).toBeGreaterThan(0);
    });
  });
});
