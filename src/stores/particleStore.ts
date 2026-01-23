import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameTime } from '@/core/game-loop';
import type { Vector2, ParticleGrid, ParticleCell, ParticleGridConfig, ParticleEmitter, EngineMount } from '@/models';
import { DEFAULT_PARTICLE_CONFIG, createCellKey, parseCellKey, worldToGridCoord } from '@/models';
import { rotatePoint, vec2Add, vec2Scale } from '@/core/physics/vectorMath';

/**
 * Ship engine registration data for multi-engine particle emission
 */
export interface ShipEngineRegistration {
  shipId: string;
  getPosition: () => Vector2;
  getHeading: () => number;
  getScale: () => number;
  getThrottle: () => number;
  engineMounts: EngineMount[];
}

/**
 * Transform an engine mount position from local ship space to world space
 * 
 * @param mount - Engine mount with local position
 * @param shipPosition - Ship center in world coordinates
 * @param shipHeading - Ship heading in degrees (navigation: 0=N, 90=E, clockwise)
 * @param shipScale - Ship size/scale in world units
 * @returns World position of the engine mount
 */
export function engineMountToWorld(
  mount: EngineMount,
  shipPosition: Vector2,
  shipHeading: number,
  shipScale: number
): Vector2 {
  // Scale the mount's local position
  const scaled = vec2Scale(mount.position, shipScale);
  // Rotate to match ship heading
  // Negate rotation for navigation convention (clockwise positive)
  const rotated = rotatePoint(scaled, -shipHeading);
  // Translate to ship's world position
  return vec2Add(shipPosition, rotated);
}

/**
 * Particle store - manages engine particle traces for all ships
 */
export const useParticleStore = defineStore('particle', () => {
  // Configuration
  const config = ref<ParticleGridConfig>({ ...DEFAULT_PARTICLE_CONFIG });

  // Particle grid (sparse Map for efficiency)
  const grid = ref<ParticleGrid>(new Map());

  // Legacy single-point emitters (ships without engine mounts)
  const emitters = ref<Map<string, ParticleEmitter>>(new Map());

  // New: ships with engine mount registration
  const shipEngines = ref<Map<string, ShipEngineRegistration>>(new Map());

  // Computed: cells with density > threshold for rendering
  const activeCells = computed((): ParticleCell[] => {
    const cells: ParticleCell[] = [];
    for (const cell of grid.value.values()) {
      if (cell.density > 0.05) {
        cells.push(cell);
      }
    }
    return cells;
  });

  // Computed: total active cell count
  const activeCellCount = computed(() => grid.value.size);

  /**
   * Register a particle emitter (e.g., a ship) - LEGACY single-point emission
   * @deprecated Use registerShipEngines for multi-engine ships
   */
  function registerEmitter(
    id: string,
    getPosition: () => Vector2,
    getThrottle: () => number
  ): void {
    emitters.value.set(id, { id, getPosition, getThrottle });
  }

  /**
   * Unregister an emitter (e.g., when ship is destroyed) - LEGACY
   * @deprecated Use unregisterShipEngines for multi-engine ships
   */
  function unregisterEmitter(id: string): void {
    emitters.value.delete(id);
  }

  /**
   * Register a ship's engine mounts for multi-point particle emission
   * 
   * @param registration - Ship engine registration data
   */
  function registerShipEngines(registration: ShipEngineRegistration): void {
    // Remove any legacy single-point emitter
    emitters.value.delete(registration.shipId);
    // Register engine mounts
    shipEngines.value.set(registration.shipId, registration);
  }

  /**
   * Unregister a ship's engines
   * 
   * @param shipId - Ship ID to unregister
   */
  function unregisterShipEngines(shipId: string): void {
    shipEngines.value.delete(shipId);
    emitters.value.delete(shipId);
  }

  /**
   * Get density at a specific world position
   */
  function getDensityAt(worldPos: Vector2): number {
    const gridPos = worldToGridCoord(worldPos, config.value.cellSize);
    const key = createCellKey(gridPos.x, gridPos.y);
    return grid.value.get(key)?.density ?? 0;
  }

  /**
   * Emit particles at a position
   */
  function emitParticles(worldPos: Vector2, amount: number): void {
    if (amount <= 0) return;

    const gridPos = worldToGridCoord(worldPos, config.value.cellSize);
    const key = createCellKey(gridPos.x, gridPos.y);

    let cell = grid.value.get(key);
    if (!cell) {
      cell = {
        x: gridPos.x,
        y: gridPos.y,
        density: 0,
        age: 0,
      };
      grid.value.set(key, cell);
    }

    cell.density = Math.min(cell.density + amount, config.value.maxDensity);
    cell.age = 0;
  }

  /**
   * Process legacy single-point emitters
   */
  function processLegacyEmitters(dt: number): void {
    for (const emitter of emitters.value.values()) {
      const throttle = emitter.getThrottle();
      if (throttle > 0) {
        const position = emitter.getPosition();
        const emissionAmount = config.value.baseEmissionRate * throttle * dt;
        emitParticles(position, emissionAmount);
      }
    }
  }

  /**
   * Process ships with engine mounts - emit from each engine position
   */
  function processShipEngines(dt: number): void {
    for (const reg of shipEngines.value.values()) {
      const throttle = reg.getThrottle();
      if (throttle <= 0) continue;

      const shipPosition = reg.getPosition();
      const shipHeading = reg.getHeading();
      const shipScale = reg.getScale();

      // Emit from each engine mount
      for (const mount of reg.engineMounts) {
        // Calculate world position of this engine
        const engineWorldPos = engineMountToWorld(mount, shipPosition, shipHeading, shipScale);
        
        // Emission amount scaled by mount's thrust multiplier
        const emissionAmount = config.value.baseEmissionRate * throttle * mount.thrustMultiplier * dt;
        emitParticles(engineWorldPos, emissionAmount);
      }
    }
  }

  /**
   * Process all emitters and emit particles based on their throttle
   */
  function processEmitters(dt: number): void {
    // Process legacy single-point emitters
    processLegacyEmitters(dt);
    
    // Process ships with engine mount registration
    processShipEngines(dt);
  }

  /**
   * Update particle grid: decay and spread
   */
  function updateParticleGrid(dt: number): void {
    const { spreadRate, decayRate } = config.value;
    const cellsToRemove: string[] = [];
    const spreadDeltas = new Map<string, number>();

    // First pass: decay and calculate spread
    for (const [key, cell] of grid.value.entries()) {
      // Decay
      cell.density -= decayRate * dt;
      cell.age += dt;

      if (cell.density <= 0.01) {
        cellsToRemove.push(key);
        continue;
      }

      // Calculate spread to neighbors (only if density is significant)
      if (cell.density > 0.1) {
        const spreadAmount = cell.density * spreadRate * dt * 0.25; // 25% to each neighbor

        if (spreadAmount > 0.005) {
          const neighbors = [
            createCellKey(cell.x - 1, cell.y),
            createCellKey(cell.x + 1, cell.y),
            createCellKey(cell.x, cell.y - 1),
            createCellKey(cell.x, cell.y + 1),
          ];

          for (const neighborKey of neighbors) {
            const current = spreadDeltas.get(neighborKey) ?? 0;
            spreadDeltas.set(neighborKey, current + spreadAmount);
          }

          // Reduce source cell by total spread
          cell.density -= spreadAmount * 4;
        }
      }
    }

    // Remove dead cells
    for (const key of cellsToRemove) {
      grid.value.delete(key);
    }

    // Apply spread to neighbors
    for (const [key, delta] of spreadDeltas.entries()) {
      let cell = grid.value.get(key);
      if (!cell) {
        const { x, y } = parseCellKey(key);
        cell = { x, y, density: 0, age: 0 };
        grid.value.set(key, cell);
      }
      cell.density = Math.min(cell.density + delta, config.value.maxDensity);
    }
  }

  /**
   * Main update function called from game loop
   */
  function update(gameTime: GameTime): void {
    if (gameTime.paused) return;

    const dt = gameTime.deltaTime;

    // 1. Process emitters (emit particles from ships)
    processEmitters(dt);

    // 2. Update particle grid (decay and spread)
    updateParticleGrid(dt);
  }

  /**
   * Reset particle system
   */
  function reset(): void {
    grid.value.clear();
  }

  return {
    // State
    config,
    grid,
    shipEngines,
    // Computed
    activeCells,
    activeCellCount,
    // Actions
    registerEmitter,
    unregisterEmitter,
    registerShipEngines,
    unregisterShipEngines,
    getDensityAt,
    emitParticles,
    update,
    reset,
  };
});
