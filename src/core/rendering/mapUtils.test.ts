import { describe, it, expect } from 'vitest';
import { headingDegToCanvasRad } from './mapUtils';

const PI = Math.PI;

describe('headingDegToCanvasRad', () => {
  // The function converts game heading degrees to canvas radians
  // using direct conversion: degrees * (PI/180)
  // Game coordinate system: 0° = North, 90° = East, 180° = South, 270° = West

  it('maps 0° (north) to 0 radians', () => {
    const rad = headingDegToCanvasRad(0);
    expect(rad).toBeCloseTo(0, 6);
  });

  it('maps 90° (east) to π/2 radians', () => {
    const rad = headingDegToCanvasRad(90);
    expect(rad).toBeCloseTo(PI / 2, 6);
  });

  it('maps 180° (south) to π radians', () => {
    const rad = headingDegToCanvasRad(180);
    expect(rad).toBeCloseTo(PI, 6);
  });

  it('maps 270° (west) to 3π/2 radians', () => {
    const rad = headingDegToCanvasRad(270);
    expect(rad).toBeCloseTo((3 * PI) / 2, 6);
  });
});