import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useShipStore } from './shipStore';

describe('shipStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should start at origin', () => {
      const store = useShipStore();
      expect(store.position).toEqual({ x: 0, y: 0 });
    });

    it('should start with 0 speed', () => {
      const store = useShipStore();
      expect(store.speed).toBe(0);
    });

    it('should start undocked', () => {
      const store = useShipStore();
      expect(store.isDocked).toBe(false);
      expect(store.dockedAtId).toBeNull();
    });
  });

  describe('setTargetHeading', () => {
    it('should set target heading', () => {
      const store = useShipStore();
      store.setTargetHeading(90);
      expect(store.targetHeading).toBe(90);
    });

    it('should normalize heading to 0-360', () => {
      const store = useShipStore();
      store.setTargetHeading(450);
      expect(store.targetHeading).toBe(90);
    });

    it('should handle negative angles', () => {
      const store = useShipStore();
      store.setTargetHeading(-90);
      expect(store.targetHeading).toBe(270);
    });

    it('should not change heading when docked', () => {
      const store = useShipStore();
      store.dock('station-1');
      store.setTargetHeading(90);
      expect(store.targetHeading).toBe(0);
    });
  });

  describe('setTargetSpeed', () => {
    it('should set target speed', () => {
      const store = useShipStore();
      store.setTargetSpeed(50);
      expect(store.targetSpeed).toBe(50);
    });

    it('should clamp to max speed', () => {
      const store = useShipStore();
      store.setTargetSpeed(200);
      expect(store.targetSpeed).toBe(store.engines.maxSpeed);
    });

    it('should not go below min speed', () => {
      const store = useShipStore();
      store.setTargetSpeed(-50);
      expect(store.targetSpeed).toBe(store.minSpeed);
    });

    it('should not change speed when docked', () => {
      const store = useShipStore();
      store.dock('station-1');
      store.setTargetSpeed(50);
      expect(store.targetSpeed).toBe(0);
    });
  });

  describe('allStop', () => {
    it('should set target speed to 0', () => {
      const store = useShipStore();
      store.setTargetSpeed(50);
      store.allStop();
      expect(store.targetSpeed).toBe(0);
    });
  });

  describe('fullSpeed', () => {
    it('should set target speed to max', () => {
      const store = useShipStore();
      store.fullSpeed();
      expect(store.targetSpeed).toBe(store.engines.maxSpeed);
    });
  });

  describe('dock/undock', () => {
    it('should dock at a station', () => {
      const store = useShipStore();
      const result = store.dock('station-1');
      expect(result).toBe(true);
      expect(store.isDocked).toBe(true);
      expect(store.dockedAtId).toBe('station-1');
    });

    it('should set speed to 0 when docking', () => {
      const store = useShipStore();
      store.speed = 3;
      store.dock('station-1');
      expect(store.speed).toBe(0);
    });

    it('should not dock at high speed', () => {
      const store = useShipStore();
      store.speed = 50;
      const result = store.dock('station-1');
      expect(result).toBe(false);
      expect(store.isDocked).toBe(false);
    });

    it('should undock', () => {
      const store = useShipStore();
      store.dock('station-1');
      store.undock();
      expect(store.isDocked).toBe(false);
      expect(store.dockedAtId).toBeNull();
    });
  });

  describe('update', () => {
    it('should not update when docked', () => {
      const store = useShipStore();
      store.dock('station-1');
      store.targetHeading = 90;
      
      store.update({ deltaTime: 1, elapsed: 1, realDeltaTime: 1, timeScale: 1, paused: false });
      
      expect(store.heading).toBe(0);
    });

    it('should not update when paused', () => {
      const store = useShipStore();
      store.setTargetSpeed(50);
      
      store.update({ deltaTime: 0, elapsed: 1, realDeltaTime: 1, timeScale: 1, paused: true });
      
      expect(store.speed).toBe(0);
    });

    it('should move ship based on heading and speed', () => {
      const store = useShipStore();
      store.heading = 0;
      store.speed = 100;
      store.targetSpeed = 100;
      
      store.update({ deltaTime: 1, elapsed: 1, realDeltaTime: 1, timeScale: 1, paused: false });
      
      expect(store.position.x).toBeCloseTo(100, 0);
      expect(store.position.y).toBeCloseTo(0, 0);
    });
  });

  describe('computed', () => {
    it('should format heading with leading zeros', () => {
      const store = useShipStore();
      store.heading = 45;
      expect(store.headingFormatted).toBe('045°');
    });

    it('should format speed', () => {
      const store = useShipStore();
      store.speed = 50;
      expect(store.speedFormatted).toBe('50 u/s');
    });

    it('should compute isMoving', () => {
      const store = useShipStore();
      expect(store.isMoving).toBe(false);
      store.speed = 10;
      expect(store.isMoving).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const store = useShipStore();
      store.setPosition({ x: 100, y: 200 });
      store.heading = 90;
      store.speed = 50;
      store.dock('station-1');
      
      store.reset();
      
      expect(store.position).toEqual({ x: 0, y: 0 });
      expect(store.heading).toBe(0);
      expect(store.speed).toBe(0);
      expect(store.isDocked).toBe(false);
    });

    it('should accept initial position', () => {
      const store = useShipStore();
      store.reset({ x: 500, y: 300 });
      expect(store.position).toEqual({ x: 500, y: 300 });
    });
  });
});
