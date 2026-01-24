import { describe, it, expect } from 'vitest';
import type { DockingPort } from '@/models/DockingPort';
import { isPortNearby, shouldShowColoredLandingLights, computeRunwayCorners } from './dockingGuidance';

describe('dockingGuidance helpers', () => {
  const fakeGetRange = (_p: DockingPort) => 10;
  const mkPort = (id: string): DockingPort => ({ id, position: { x: 0, y: 0 }, approachVector: { x: 0, y: 1 }, size: 'small' });

  it('isPortNearby returns true when inRange', () => {
    const status = { port: mkPort('p1'), inRange: true, distance: 100 };
    expect(isPortNearby(status, fakeGetRange, 60)).toBe(true);
  });

  it('isPortNearby returns true when nearLights', () => {
    const status = { port: mkPort('p1'), nearLights: true, distance: 100 };
    expect(isPortNearby(status, fakeGetRange, 60)).toBe(true);
  });

  it('isPortNearby returns true when distance <= threshold', () => {
    const status = { port: mkPort('p1'), distance: 500 };// 500 <= 10*60 = 600
    expect(isPortNearby(status, fakeGetRange, 60)).toBe(true);
  });

  it('isPortNearby returns false when none of conditions met', () => {
    const status = { port: mkPort('p1'), distance: 700 };
    expect(isPortNearby(status, fakeGetRange, 60)).toBe(false);
  });

  it('shouldShowColoredLandingLights true when nearest matches and distance <= portRange*60', () => {
    const nearest = { port: mkPort('p1') };
    const docking = { port: mkPort('p1'), distance: 300 };// 300 <= 10*60 = 600
    expect(shouldShowColoredLandingLights(nearest, docking, fakeGetRange)).toBe(true);
  });

  it('shouldShowColoredLandingLights false when ids differ', () => {
    const nearest = { port: mkPort('p2') };
    const docking = { port: mkPort('p1'), distance: 100 };
    expect(shouldShowColoredLandingLights(nearest, docking, fakeGetRange)).toBe(false);
  });

  it('computeRunwayCorners returns sanity-checked corners', () => {
    const port = { x: 0, y: 0 };
    const approach = { x: 0, y: 1 };
    const { p1, p2, p3, p4 } = computeRunwayCorners(port, approach, 100, 10);
    expect(p1.y).toBeGreaterThanOrEqual(0);
    expect(p2.y).toBeGreaterThan(p1.y);
    expect(p3.x).toBe(-p2.x);
    expect(p4.x).toBe(-p1.x);
  });
});