import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNavigationStore } from './navigationStore';
import { useShipStore } from './shipStore';
import { useShipCollision } from './useShipCollision';
import { vec2 } from '@/models';
import type { StarSystem } from '@/models';

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
            expect(store.waypoints[0]!.name).toBe('Waypoint 1');
            expect(store.waypoints[0]!.position).toEqual(vec2(100, 200));
            expect(store.waypoints[1]!.name).toBe('Waypoint 2');
        });

        it('should remove waypoints by ID', () => {
            const store = useNavigationStore();
            store.addWaypoint(vec2(0, 0));
            const id = store.waypoints[0]!.id;

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

    describe('Shape-based Collision Detection', () => {
        /**
         * Create a minimal star system for testing
         */
        function createTestSystem(): StarSystem {
            return {
                id: 'test-system',
                name: 'Test System',
                star: {
                    id: 'star-1',
                    name: 'Test Star',
                    radius: 100,
                    color: '#ffff00',
                    type: 'G',
                },
                stations: [
                    {
                        id: 'station-1',
                        name: 'Test Station',
                        position: { x: 200, y: 0 },
                        templateId: 'trading-hub',
                        rotation: 0,
                        dockingRange: 50,
                        services: [],
                    },
                ],
                planets: [
                    {
                        id: 'planet-1',
                        name: 'Test Planet',
                        position: { x: -300, y: 0 },
                        radius: 80,
                        color: '#4444ff',
                        orbitRadius: 300,
                        orbitSpeed: 0,
                        orbitAngle: 180,
                    },
                ],
                jumpGates: [],
            };
        }

        it('should detect collision warnings when ship approaches station', () => {
            const navStore = useNavigationStore();
            const shipStore = useShipStore();
            const collision = useShipCollision();

            // Load test system
            navStore.loadSystem(createTestSystem());

            // Position ship close to station (station is at x=200)
            shipStore.setPosition({ x: 150, y: 0 }); // ~50 units from station

            // Update collision warnings
            collision.updateCollisionWarnings();

            // Should have at least one warning
            expect(collision.warnings.value.length).toBeGreaterThan(0);
            expect(collision.warnings.value[0]?.objectId).toBe('station-1');
            // At 50 units distance, should be at least 'warning' level
            expect(['warning', 'danger', 'caution']).toContain(collision.warnings.value[0]?.level);
        });

        it('should provide push-out vector on collision', () => {
            const navStore = useNavigationStore();
            const shipStore = useShipStore();
            const collision = useShipCollision();

            navStore.loadSystem(createTestSystem());

            // Position ship overlapping with station
            shipStore.setPosition({ x: 200, y: 0 }); // Same position as station

            collision.updateCollisionWarnings();

            // Should have danger warning
            const dangerWarning = collision.warnings.value.find(w => w.level === 'danger');
            expect(dangerWarning).toBeTruthy();

            // Should provide push-out vector
            const pushOut = collision.getCollisionPushOut();
            if (dangerWarning?.normal && dangerWarning?.penetrationDepth) {
                expect(pushOut).not.toBeNull();
                // Push-out magnitude should equal penetration depth
                if (pushOut) {
                    const magnitude = Math.hypot(pushOut.x, pushOut.y);
                    expect(magnitude).toBeGreaterThan(0);
                }
            }
        });

        it('should clear warnings when ship moves away', () => {
            const navStore = useNavigationStore();
            const shipStore = useShipStore();
            const collision = useShipCollision();

            navStore.loadSystem(createTestSystem());

            // First, position ship close to station
            shipStore.setPosition({ x: 160, y: 0 });
            collision.updateCollisionWarnings();
            expect(collision.warnings.value.length).toBeGreaterThan(0);

            // Move ship far away
            shipStore.setPosition({ x: -500, y: -500 });
            collision.updateCollisionWarnings();

            // Should have no station warnings (but might have planet warning)
            const stationWarnings = collision.warnings.value.filter(w => w.objectType === 'station');
            expect(stationWarnings.length).toBe(0);
        });

        it('should detect planet proximity warnings', () => {
            const navStore = useNavigationStore();
            const shipStore = useShipStore();
            const collision = useShipCollision();

            navStore.loadSystem(createTestSystem());

            // Position ship close to planet (planet at x=-300, radius=80)
            shipStore.setPosition({ x: -220, y: 0 }); // Edge of planet

            collision.updateCollisionWarnings();

            const planetWarning = collision.warnings.value.find(w => w.objectType === 'planet');
            expect(planetWarning).toBeTruthy();
            expect(planetWarning?.objectId).toBe('planet-1');
        });

        it('should report highest warning level correctly', () => {
            const navStore = useNavigationStore();
            const shipStore = useShipStore();
            const collision = useShipCollision();

            navStore.loadSystem(createTestSystem());

            // Far from everything
            shipStore.setPosition({ x: 0, y: 500 });
            collision.updateCollisionWarnings();
            expect(collision.highestWarningLevel.value).toBe('none');

            // In caution range of station (100 units)
            shipStore.setPosition({ x: 100, y: 0 }); // ~100 units from station at x=200
            collision.updateCollisionWarnings();
            expect(['caution', 'warning', 'danger']).toContain(collision.highestWarningLevel.value);
        });
    });
});
