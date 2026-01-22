import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNavigationStore } from './navigationStore';
import { vec2 } from '@/models';

describe('navigationStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('Waypoints', () => {
        it('should add waypoints with auto-incremented names', () => {
            const store = useNavigationStore();

            store.addWaypoint(vec2(100, 200));
            store.addWaypoint(vec2(300, 400));

            expect(store.waypoints).toHaveLength(2);
            expect(store.waypoints[0].name).toBe('Waypoint 1');
            expect(store.waypoints[0].position).toEqual(vec2(100, 200));
            expect(store.waypoints[1].name).toBe('Waypoint 2');
        });

        it('should remove waypoints by ID', () => {
            const store = useNavigationStore();
            store.addWaypoint(vec2(0, 0));
            const id = store.waypoints[0].id;

            store.removeWaypoint(id);
            expect(store.waypoints).toHaveLength(0);
        });

        it('should return the first waypoint as currentWaypoint', () => {
            const store = useNavigationStore();
            store.addWaypoint(vec2(10, 10));
            store.addWaypoint(vec2(20, 20));

            expect(store.currentWaypoint?.name).toBe('Waypoint 1');
        });

        it('should remove waypoint when ship is reached', () => {
            const store = useNavigationStore();
            store.addWaypoint(vec2(100, 100)); // Current

            // Far away
            store.checkWaypointReached(vec2(0, 0));
            expect(store.waypoints).toHaveLength(1);

            // Close (threshold is 50)
            store.checkWaypointReached(vec2(90, 90));
            expect(store.waypoints).toHaveLength(0);
        });

        it('should NOT disable autopilot when no more waypoints remain', () => {
            const store = useNavigationStore();
            store.addWaypoint(vec2(100, 100));
            store.autopilotEnabled = true;

            store.checkWaypointReached(vec2(100, 100));
            expect(store.autopilotEnabled).toBe(true);
        });
    });

    describe('Autopilot Steering', () => {
        it('should calculate correct heading to waypoint (North=0 system)', () => {
            const store = useNavigationStore();
            const shipPos = vec2(0, 0);

            // North
            expect(store.getHeadingToWaypoint(shipPos, vec2(0, 100))).toBeCloseTo(0);
            // East
            expect(store.getHeadingToWaypoint(shipPos, vec2(100, 0))).toBeCloseTo(90);
            // South
            expect(store.getHeadingToWaypoint(shipPos, vec2(0, -100))).toBeCloseTo(180);
            // West
            expect(store.getHeadingToWaypoint(shipPos, vec2(-100, 0))).toBeCloseTo(270);
        });

        it('should allow enabling autopilot even if no waypoints exist', () => {
            const store = useNavigationStore();

            // Toggle on without waypoints
            store.toggleAutopilot();
            expect(store.autopilotEnabled).toBe(true);

            // Toggle off
            store.toggleAutopilot();
            expect(store.autopilotEnabled).toBe(false);
        });
    });

    describe('Selection Maintenance', () => {
        it('should select stations, planets, and jump gates', () => {
            const store = useNavigationStore();

            store.selectStation('st-1');
            expect(store.selectedObjectId).toBe('st-1');
            expect(store.selectedObjectType).toBe('station');

            store.clearSelection();
            expect(store.selectedObjectId).toBeNull();
        });
    });
});
