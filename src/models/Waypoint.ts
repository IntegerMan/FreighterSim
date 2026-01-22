import type { Vector2 } from './math';

/**
 * Waypoint interface for navigation system
 */
export interface Waypoint {
    id: string;
    position: Vector2;
    name: string;
}
