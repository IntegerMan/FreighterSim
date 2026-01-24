import type { Vector2 } from '@/models/math';
import type { DockingPort } from '@/models/DockingPort';

/**
 * Distance multiplier for colored landing lights visibility.
 * This is intentionally larger than RUNWAY_LENGTH_FACTOR (10) because
 * landing lights should be visible from much farther away to help
 * pilots locate ports during approach - 6x the runway length.
 */
export const COLORED_LIGHTS_DISTANCE_FACTOR = 60;

/** Determines whether a port should be considered "nearby" (active) */
export function isPortNearby(
  portStatus: { port?: DockingPort | null; inRange?: boolean; nearLights?: boolean; distance?: number } | null | undefined,
  getDockingRange: (port: DockingPort) => number,
  runwayLengthFactor: number
): boolean {
  if (!portStatus || !portStatus.port) return false;
  const portRange = getDockingRange(portStatus.port);
  return !!(
    portStatus.inRange || portStatus.nearLights || (typeof portStatus.distance === 'number' && portStatus.distance <= portRange * runwayLengthFactor)
  );
}

/** Determines whether guidance overlay should show colored landing lights */
export function shouldShowColoredLandingLights(
  nearestPortForGuidance: { port?: DockingPort | null } | null | undefined,
  dockingStatus: { port?: DockingPort | null; distance?: number } | null | undefined,
  getDockingRange: (port: DockingPort) => number
): boolean {
  if (!nearestPortForGuidance || !dockingStatus || !dockingStatus.port) return false;
  const portRange = getDockingRange(dockingStatus.port);
  return nearestPortForGuidance.port?.id === dockingStatus.port.id && typeof dockingStatus.distance === 'number' && dockingStatus.distance <= portRange * COLORED_LIGHTS_DISTANCE_FACTOR;
}

/** Compute world-space rectangle corners for the runway approach corridor */
export function computeRunwayCorners(
  portWorldPosition: Vector2,
  worldApproachVector: Vector2,
  runwayLength: number,
  runwayWidth: number
): { p1: Vector2; p2: Vector2; p3: Vector2; p4: Vector2 } {
  const startWorld = { x: portWorldPosition.x, y: portWorldPosition.y };
  const endWorld = { x: portWorldPosition.x + worldApproachVector.x * runwayLength, y: portWorldPosition.y + worldApproachVector.y * runwayLength };

  const p1 = { x: startWorld.x + -worldApproachVector.y * runwayWidth, y: startWorld.y + worldApproachVector.x * runwayWidth };
  const p2 = { x: endWorld.x + -worldApproachVector.y * runwayWidth, y: endWorld.y + worldApproachVector.x * runwayWidth };
  const p3 = { x: endWorld.x - -worldApproachVector.y * runwayWidth, y: endWorld.y - worldApproachVector.x * runwayWidth };
  const p4 = { x: startWorld.x - -worldApproachVector.y * runwayWidth, y: startWorld.y - worldApproachVector.x * runwayWidth };

  return { p1, p2, p3, p4 };
}
