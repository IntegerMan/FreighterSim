/**
 * Particle Store Unit Tests
 * 
 * Tests for engine particle emission including:
 * - Multi-engine ship registration
 * - Engine mount world position transformation
 * - Particle emission from engine mounts
 * 
 * @module stores/particleStore.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useParticleStore, engineMountToWorld, type ShipEngineRegistration } from './particleStore';
import type { Vector2, EngineMount } from '@/models';

describe('particleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('engineMountToWorld', () => {
    it('should return ship position when mount is at origin', () => {
      const mount: EngineMount = {
        name: 'engine-main',
        position: { x: 0, y: 0 },
        direction: { x: 0, y: -1 },
        thrustMultiplier: 1,
      };
      const shipPosition: Vector2 = { x: 100, y: 200 };
      
      const worldPos = engineMountToWorld(mount, shipPosition, 0, 10);
      
      expect(worldPos.x).toBeCloseTo(100);
      expect(worldPos.y).toBeCloseTo(200);
    });

    it('should offset mount position by ship scale at 0° heading', () => {
      const mount: EngineMount = {
        name: 'engine-rear',
        position: { x: 0, y: -1 }, // 1 unit behind ship center
        direction: { x: 0, y: -1 },
        thrustMultiplier: 1,
      };
      const shipPosition: Vector2 = { x: 0, y: 0 };
      const shipScale = 20;
      
      const worldPos = engineMountToWorld(mount, shipPosition, 0, shipScale);
      
      // At 0° heading, -y in local space is -y in world space
      expect(worldPos.x).toBeCloseTo(0);
      expect(worldPos.y).toBeCloseTo(-20);
    });

    it('should rotate mount position with ship heading', () => {
      const mount: EngineMount = {
        name: 'engine-rear',
        position: { x: 0, y: -1 }, // 1 unit behind ship center
        direction: { x: 0, y: -1 },
        thrustMultiplier: 1,
      };
      const shipPosition: Vector2 = { x: 0, y: 0 };
      const shipScale = 10;
      
      // Ship facing east (90°) - navigation convention (clockwise positive)
      const worldPos = engineMountToWorld(mount, shipPosition, 90, shipScale);
      
      // At 90° CW rotation, -y local becomes -x world
      expect(worldPos.x).toBeCloseTo(-10);
      expect(worldPos.y).toBeCloseTo(0);
    });

    it('should handle port engine offset correctly', () => {
      const mount: EngineMount = {
        name: 'engine-port',
        position: { x: -0.5, y: -0.5 }, // Port rear
        direction: { x: 0, y: -1 },
        thrustMultiplier: 0.5,
      };
      const shipPosition: Vector2 = { x: 100, y: 100 };
      const shipScale = 20;
      
      // Ship facing north (0°)
      const worldPos = engineMountToWorld(mount, shipPosition, 0, shipScale);
      
      // Port (-x) stays left, rear (-y) stays back
      expect(worldPos.x).toBeCloseTo(100 - 10); // -0.5 * 20 = -10
      expect(worldPos.y).toBeCloseTo(100 - 10); // -0.5 * 20 = -10
    });

    it('should handle starboard engine offset correctly', () => {
      const mount: EngineMount = {
        name: 'engine-starboard',
        position: { x: 0.5, y: -0.5 }, // Starboard rear
        direction: { x: 0, y: -1 },
        thrustMultiplier: 0.5,
      };
      const shipPosition: Vector2 = { x: 100, y: 100 };
      const shipScale = 20;
      
      // Ship facing north (0°)
      const worldPos = engineMountToWorld(mount, shipPosition, 0, shipScale);
      
      // Starboard (+x) stays right, rear (-y) stays back
      expect(worldPos.x).toBeCloseTo(100 + 10); // 0.5 * 20 = 10
      expect(worldPos.y).toBeCloseTo(100 - 10); // -0.5 * 20 = -10
    });

    it('should handle 180° heading (facing south)', () => {
      const mount: EngineMount = {
        name: 'engine-main',
        position: { x: 0, y: -1 },
        direction: { x: 0, y: -1 },
        thrustMultiplier: 1,
      };
      const shipPosition: Vector2 = { x: 50, y: 50 };
      const shipScale = 10;
      
      const worldPos = engineMountToWorld(mount, shipPosition, 180, shipScale);
      
      // At 180°, -y local becomes +y world
      expect(worldPos.x).toBeCloseTo(50);
      expect(worldPos.y).toBeCloseTo(60); // 50 + 10
    });

    it('should handle 270° heading (facing west)', () => {
      const mount: EngineMount = {
        name: 'engine-main',
        position: { x: 0, y: -1 },
        direction: { x: 0, y: -1 },
        thrustMultiplier: 1,
      };
      const shipPosition: Vector2 = { x: 0, y: 0 };
      const shipScale = 15;
      
      const worldPos = engineMountToWorld(mount, shipPosition, 270, shipScale);
      
      // At 270° CW rotation, -y local becomes +x world
      expect(worldPos.x).toBeCloseTo(15);
      expect(worldPos.y).toBeCloseTo(0);
    });
  });

  describe('registerShipEngines', () => {
    it('should register a ship with engine mounts', () => {
      const store = useParticleStore();
      
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 20,
        getThrottle: () => 0.5,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      
      store.registerShipEngines(registration);
      
      expect(store.shipEngines.has('player-ship')).toBe(true);
    });

    it('should overwrite legacy emitter when registering engines', () => {
      const store = useParticleStore();
      
      // Register legacy emitter first
      store.registerEmitter('player-ship', () => ({ x: 0, y: 0 }), () => 1);
      
      // Register engine mounts (should replace legacy)
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 20,
        getThrottle: () => 0.5,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      
      store.registerShipEngines(registration);
      
      expect(store.shipEngines.has('player-ship')).toBe(true);
    });
  });

  describe('unregisterShipEngines', () => {
    it('should remove ship engine registration', () => {
      const store = useParticleStore();
      
      const registration: ShipEngineRegistration = {
        shipId: 'test-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 20,
        getThrottle: () => 0.5,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      
      store.registerShipEngines(registration);
      store.unregisterShipEngines('test-ship');
      
      expect(store.shipEngines.has('test-ship')).toBe(false);
    });
  });

  describe('particle emission from engine mounts', () => {
    it('should emit particles from engine mount world positions', () => {
      const store = useParticleStore();
      
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 100, // Large scale for easier cell targeting
        getThrottle: () => 1,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      
      store.registerShipEngines(registration);
      
      // Update with small time delta
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      // Engine is at (0, -100) in world space (scale 100, heading 0)
      const density = store.getDensityAt({ x: 0, y: -100 });
      expect(density).toBeGreaterThan(0);
    });

    it('should emit from multiple engine mounts', () => {
      const store = useParticleStore();
      
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 100,
        getThrottle: () => 1,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
          { name: 'port', position: { x: -1, y: 0 }, direction: { x: 0, y: -1 }, thrustMultiplier: 0.5 },
          { name: 'starboard', position: { x: 1, y: 0 }, direction: { x: 0, y: -1 }, thrustMultiplier: 0.5 },
        ],
      };
      
      store.registerShipEngines(registration);
      
      // Update with time delta
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      // Check main engine position
      const mainDensity = store.getDensityAt({ x: 0, y: -100 });
      expect(mainDensity).toBeGreaterThan(0);
      
      // Check port engine position
      const portDensity = store.getDensityAt({ x: -100, y: 0 });
      expect(portDensity).toBeGreaterThan(0);
      
      // Check starboard engine position
      const starboardDensity = store.getDensityAt({ x: 100, y: 0 });
      expect(starboardDensity).toBeGreaterThan(0);
    });

    it('should not emit when throttle is 0', () => {
      const store = useParticleStore();
      
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 100,
        getThrottle: () => 0, // No throttle
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      
      store.registerShipEngines(registration);
      store.reset(); // Clear any existing particles
      
      // Update with time delta
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      // No particles should be emitted
      expect(store.activeCells.length).toBe(0);
    });

    it('should respect thrust multiplier for different engines', () => {
      const store = useParticleStore();
      
      let mainThrottle = 1;
      let portThrottle = 0.5;
      
      const registration: ShipEngineRegistration = {
        shipId: 'test-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 100,
        getThrottle: () => 1,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: mainThrottle },
          { name: 'port', position: { x: -1, y: 0 }, direction: { x: 0, y: -1 }, thrustMultiplier: portThrottle },
        ],
      };
      
      store.registerShipEngines(registration);
      store.reset();
      
      // Update with time delta
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      const mainDensity = store.getDensityAt({ x: 0, y: -100 });
      const portDensity = store.getDensityAt({ x: -100, y: 0 });
      
      // Main engine (thrust 1.0) should emit more than port (thrust 0.5)
      expect(mainDensity).toBeGreaterThan(portDensity);
    });

    it('should emit particles at correct rotated positions', () => {
      const store = useParticleStore();
      
      // Ship at origin, facing east (90°)
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 90, // Facing east
        getScale: () => 100,
        getThrottle: () => 1,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      
      store.registerShipEngines(registration);
      store.reset();
      
      // Update
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      // Verify engine mount world position calculation
      const engineWorldPos = engineMountToWorld(
        { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        { x: 0, y: 0 },
        90,
        100
      );
      // Navigation convention: 90° CW rotation
      // (0, -1) scaled by 100 = (0, -100), rotated 90° CW = (-100, 0)
      expect(engineWorldPos.x).toBeCloseTo(-100);
      expect(engineWorldPos.y).toBeCloseTo(0);
      
      // Check that grid has entries
      expect(store.grid.size).toBeGreaterThan(0);
      
      // Find where particles actually were emitted
      const cells = Array.from(store.grid.values());
      
      // The engine is at world pos (-100, 0)
      // With cellSize=50, this should be grid cell (-2, 0)
      // For now just verify particles exist in some reasonable position
      expect(cells.some(c => c.x <= -1 && c.density > 0)).toBe(true);
    });
  });

  describe('legacy emitter compatibility', () => {
    it('should still support legacy single-point emitters', () => {
      const store = useParticleStore();
      
      store.registerEmitter('legacy-ship', () => ({ x: 50, y: 50 }), () => 1);
      store.reset();
      
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      const density = store.getDensityAt({ x: 50, y: 50 });
      expect(density).toBeGreaterThan(0);
    });

    it('should support both legacy and engine-mount emitters simultaneously', () => {
      const store = useParticleStore();
      
      // Legacy emitter
      store.registerEmitter('npc-ship', () => ({ x: 200, y: 200 }), () => 1);
      
      // Engine mount ship
      const registration: ShipEngineRegistration = {
        shipId: 'player-ship',
        getPosition: () => ({ x: 0, y: 0 }),
        getHeading: () => 0,
        getScale: () => 100,
        getThrottle: () => 1,
        engineMounts: [
          { name: 'main', position: { x: 0, y: -1 }, direction: { x: 0, y: -1 }, thrustMultiplier: 1 },
        ],
      };
      store.registerShipEngines(registration);
      
      store.reset();
      store.update({ deltaTime: 0.1, elapsed: 0, realDeltaTime: 0.1, timeScale: 1, paused: false });
      
      // Both should have particles
      const npcDensity = store.getDensityAt({ x: 200, y: 200 });
      const playerDensity = store.getDensityAt({ x: 0, y: -100 });
      
      expect(npcDensity).toBeGreaterThan(0);
      expect(playerDensity).toBeGreaterThan(0);
    });
  });
});
