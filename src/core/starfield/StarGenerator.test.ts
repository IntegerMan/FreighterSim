import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  hashString,
  generateStarsForCell,
  starToScreen,
  getVisibleCells,
} from './StarGenerator';
import type { StarfieldConfig } from '@/models';
import type { CameraState } from '@/core/rendering';

describe('mulberry32', () => {
  it('produces deterministic sequence from same seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it('produces different sequences from different seeds', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(54321);

    expect(rng1()).not.toBe(rng2());
  });

  it('returns values in range [0, 1)', () => {
    const rng = mulberry32(99999);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('hashString', () => {
  it('produces consistent hash for same string', () => {
    expect(hashString('test-seed')).toBe(hashString('test-seed'));
  });

  it('produces different hashes for different strings', () => {
    expect(hashString('cell-0,0')).not.toBe(hashString('cell-0,1'));
  });

  it('produces integer output', () => {
    const hash = hashString('some-string');
    expect(Number.isInteger(hash)).toBe(true);
  });
});

describe('generateStarsForCell', () => {
  const config: StarfieldConfig = {
    seed: 'test-system',
    layers: [
      {
        parallaxFactor: 1.0,
        density: 15,
        radiusRange: [1.0, 2.0],
        brightnessRange: [0.5, 1.0],
      },
    ],
    cellSize: 500,
  };

  it('generates same stars for same cell coordinates', () => {
    const stars1 = generateStarsForCell(0, 0, 0, config);
    const stars2 = generateStarsForCell(0, 0, 0, config);

    expect(stars1).toEqual(stars2);
  });

  it('generates different stars for different cells', () => {
    const stars1 = generateStarsForCell(0, 0, 0, config);
    const stars2 = generateStarsForCell(1, 0, 0, config);

    expect(stars1).not.toEqual(stars2);
  });

  it('generates different stars for different layers', () => {
    const configWithTwoLayers: StarfieldConfig = {
      ...config,
      layers: [
        config.layers[0]!,
        {
          parallaxFactor: 0.5,
          density: 40,
          radiusRange: [0.5, 1.0],
          brightnessRange: [0.3, 0.7],
        },
      ],
    };

    const stars1 = generateStarsForCell(0, 0, 0, configWithTwoLayers);
    const stars2 = generateStarsForCell(0, 0, 1, configWithTwoLayers);

    expect(stars1).not.toEqual(stars2);
  });

  it('generates stars with positions within cell bounds', () => {
    const stars = generateStarsForCell(5, 5, 0, config);

    for (const star of stars) {
      expect(star.worldPos.x).toBeGreaterThanOrEqual(5 * config.cellSize);
      expect(star.worldPos.x).toBeLessThan(6 * config.cellSize);
      expect(star.worldPos.y).toBeGreaterThanOrEqual(5 * config.cellSize);
      expect(star.worldPos.y).toBeLessThan(6 * config.cellSize);
    }
  });

  it('respects radius range', () => {
    const stars = generateStarsForCell(5, 5, 0, config);

    for (const star of stars) {
      expect(star.radius).toBeGreaterThanOrEqual(1.0);
      expect(star.radius).toBeLessThanOrEqual(2.0);
    }
  });

  it('respects brightness range', () => {
    const stars = generateStarsForCell(5, 5, 0, config);

    for (const star of stars) {
      expect(star.brightness).toBeGreaterThanOrEqual(0.5);
      expect(star.brightness).toBeLessThanOrEqual(1.0);
    }
  });

  it('generates appropriate number of stars based on density', () => {
    const stars = generateStarsForCell(0, 0, 0, config);
    // density / 9 (average visible cells) rounded up
    const expectedMaxPerCell = Math.ceil(config.layers[0]!.density / 9);
    expect(stars.length).toBeLessThanOrEqual(expectedMaxPerCell + 1);
    expect(stars.length).toBeGreaterThan(0);
  });
});

describe('starToScreen', () => {
  const camera: CameraState = {
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
    centerX: 1000,
    centerY: 1000,
    canvasWidth: 800,
    canvasHeight: 600,
  };

  it('places star at screen center when at camera center with factor 1.0', () => {
    const star = { worldPos: { x: 1000, y: 1000 }, radius: 1, brightness: 1 };
    const pos = starToScreen(star, camera, 1.0);

    expect(pos.x).toBeCloseTo(400); // canvasWidth / 2
    expect(pos.y).toBeCloseTo(300); // canvasHeight / 2
  });

  it('applies full parallax displacement for factor 1.0', () => {
    const star = { worldPos: { x: 1100, y: 1000 }, radius: 1, brightness: 1 };
    const pos = starToScreen(star, camera, 1.0);

    // Star is 100 units to the right of camera center
    // At zoom 1.0, should be 100 pixels to the right of screen center
    expect(pos.x).toBeCloseTo(500);
    expect(pos.y).toBeCloseTo(300);
  });

  it('reduces parallax displacement for factor 0.5', () => {
    const star = { worldPos: { x: 0, y: 0 }, radius: 1, brightness: 1 };
    const pos = starToScreen(star, camera, 0.5);

    // With parallax 0.5, effective camera center is (500, 500)
    // Star at (0, 0) is 500 units left and down from effective center
    expect(pos.x).toBeCloseTo(400 - 500); // -100
    expect(pos.y).toBeCloseTo(300 + 500); // 800 (y flipped)
  });

  it('applies zoom scaling', () => {
    const zoomedCamera: CameraState = { ...camera, zoom: 2.0 };
    const star = { worldPos: { x: 1050, y: 1000 }, radius: 1, brightness: 1 };
    const pos = starToScreen(star, zoomedCamera, 1.0);

    // 50 units offset * zoom 2.0 = 100 pixels
    expect(pos.x).toBeCloseTo(500);
    expect(pos.y).toBeCloseTo(300);
  });

  it('flips Y axis correctly (world Y up = screen Y down)', () => {
    const star = { worldPos: { x: 1000, y: 1100 }, radius: 1, brightness: 1 };
    const pos = starToScreen(star, camera, 1.0);

    // Star is 100 units UP in world space = 100 pixels UP on screen (lower Y value)
    expect(pos.x).toBeCloseTo(400);
    expect(pos.y).toBeCloseTo(200); // 300 - 100
  });
});

describe('getVisibleCells', () => {
  const camera: CameraState = {
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
    centerX: 0,
    centerY: 0,
    canvasWidth: 800,
    canvasHeight: 600,
  };

  it('returns cells covering visible area plus buffer', () => {
    const cells = getVisibleCells(camera, 500, 1.0);

    expect(cells.length).toBeGreaterThan(0);
    // Should include the center cell (0, 0)
    expect(cells.some((c) => c.x === 0 && c.y === 0)).toBe(true);
  });

  it('includes buffer cells beyond viewport', () => {
    const cells = getVisibleCells(camera, 500, 1.0);

    // With canvas 800x600 at zoom 1.0, visible world is 800x600 centered at origin
    // Half width = 400, half height = 300
    // Cell bounds: minX = floor(-400/500) - 1 = -2, maxX = ceil(400/500) + 1 = 2
    // Should have cells from -2 to 2 in X direction (5 cells)
    const xValues = [...new Set(cells.map((c) => c.x))];
    expect(xValues.length).toBeGreaterThanOrEqual(3);
  });

  it('adjusts cell range based on parallax factor', () => {
    const cameraOffset: CameraState = {
      ...camera,
      centerX: 2000,
      centerY: 2000,
    };

    const cellsFull = getVisibleCells(cameraOffset, 500, 1.0);
    const cellsHalf = getVisibleCells(cameraOffset, 500, 0.5);

    // With factor 0.5, effective center is (1000, 1000)
    // Cell ranges should be different
    const fullCenterX = Math.round(
      cellsFull.reduce((sum, c) => sum + c.x, 0) / cellsFull.length
    );
    const halfCenterX = Math.round(
      cellsHalf.reduce((sum, c) => sum + c.x, 0) / cellsHalf.length
    );

    expect(fullCenterX).not.toBe(halfCenterX);
  });

  it('returns correct cells for zoomed out view', () => {
    const zoomedOutCamera: CameraState = { ...camera, zoom: 0.5 };
    const cells = getVisibleCells(zoomedOutCamera, 500, 1.0);

    // Zoomed out = larger world area visible = more cells
    const normalCells = getVisibleCells(camera, 500, 1.0);
    expect(cells.length).toBeGreaterThan(normalCells.length);
  });
});
