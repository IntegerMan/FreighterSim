import { describe, it, expect } from 'vitest';
import { headingDegToCanvasRad } from './mapUtils';

const PI = Math.PI;
const EPS = 1e-6;

describe('headingDegToCanvasRad', () => {
  it('maps 0° (east) to +90° on canvas', () => {
    const rad = headingDegToCanvasRad(0);
    expect(rad).toBeCloseTo(PI / 2, EPS);
  });

  it('maps 90° (south) to 180° on canvas', () => {
    const rad = headingDegToCanvasRad(90);
    expect(rad).toBeCloseTo(PI, EPS);
  });

  it('maps 180° (west) to 270° on canvas', () => {
    const rad = headingDegToCanvasRad(180);
    expect(rad).toBeCloseTo((3 * PI) / 2, EPS);
  });

  it('maps 270° (north) to 360° on canvas', () => {
    const rad = headingDegToCanvasRad(270);
    expect(rad).toBeCloseTo(2 * PI, EPS);
  });
});