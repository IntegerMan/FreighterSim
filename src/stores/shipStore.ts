import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Vector2, ShipEngines, ShipSensors, CargoBay, CargoItem } from '@/models';
import { vec2, normalizeAngle, clamp, DEFAULT_ENGINES, DEFAULT_SENSORS, DEFAULT_CARGO_BAY } from '@/models';
import { updateMovement } from '@/core/physics';
import type { GameTime } from '@/core/game-loop';

/**
 * Default cargo items (empty - cargo must be loaded during gameplay)
 */
const DEFAULT_CARGO_ITEMS: CargoItem[] = [];

/** Tractor beam speed - how fast the station pulls the ship in (units per second) */
const TRACTOR_BEAM_SPEED = 15;

/** Tractor beam turn rate - how fast heading aligns during tractor beam (degrees per second) */
const TRACTOR_BEAM_TURN_RATE = 30;

/** Distance threshold to consider docking complete */
const DOCKING_COMPLETE_DISTANCE = 5;

/**
 * Tractor beam state for docking assistance
 */
interface TractorBeamState {
  /** Whether tractor beam is actively pulling the ship */
  active: boolean;
  /** Station ID that engaged the tractor beam */
  stationId: string | null;
  /** Target world position to pull ship to */
  targetPosition: Vector2 | null;
  /** Target heading for docking alignment */
  targetHeading: number;
  /** Callback when docking position reached */
  onComplete: (() => void) | null;
}

/**
 * Ship state store - manages the player's ship state and movement
 */
export const useShipStore = defineStore('ship', () => {
  // Position and movement
  const position = ref<Vector2>(vec2(0, 0));
  const heading = ref(0);
  const targetHeading = ref(0);
  const speed = ref(0);
  const targetSpeed = ref(0);

  // Ship subsystems
  const engines = ref<ShipEngines>({ ...DEFAULT_ENGINES });
  const sensors = ref<ShipSensors>({ ...DEFAULT_SENSORS });
  const cargoBay = ref<CargoBay>({ ...DEFAULT_CARGO_BAY, items: [...DEFAULT_CARGO_ITEMS] });

  // Ship template for 2D shape rendering
  const templateId = ref<string>('firefly');
  const size = ref<number>(40); // Ship size in world units

  // Derived limits
  const minSpeed = computed(() => -engines.value.maxSpeed * 0.25); // Reverse speed limit (25% of max)

  // Docking state
  const isDocked = ref(false);
  const dockedAtId = ref<string | null>(null);

  // Tractor beam state
  const tractorBeam = ref<TractorBeamState>({
    active: false,
    stationId: null,
    targetPosition: null,
    targetHeading: 0,
    onComplete: null,
  });

  // Computed
  const isMoving = computed(() => speed.value !== 0);
  const isReversing = computed(() => speed.value < 0 || targetSpeed.value < 0);
  const isTurning = computed(() => heading.value !== targetHeading.value);
  const isAccelerating = computed(() => speed.value !== targetSpeed.value);
  const speedPercent = computed(() => (speed.value / engines.value.maxSpeed) * 100);
  const isTractorBeamActive = computed(() => tractorBeam.value.active);

  const headingFormatted = computed(() => {
    return normalizeAngle(heading.value).toFixed(0).padStart(3, '0') + '°';
  });

  const speedFormatted = computed(() => {
    return speed.value.toFixed(0) + ' u/s';
  });

  // Actions
  function setTargetHeading(degrees: number) {
    if (isDocked.value || tractorBeam.value.active) return;
    targetHeading.value = normalizeAngle(degrees);
  }

  function setTargetSpeed(newSpeed: number) {
    if (isDocked.value || tractorBeam.value.active) return;
    targetSpeed.value = clamp(newSpeed, minSpeed.value, engines.value.maxSpeed);
  }

  function allStop() {
    if (tractorBeam.value.active) return;
    targetSpeed.value = 0;
  }

  function fullSpeed() {
    if (isDocked.value || tractorBeam.value.active) return;
    targetSpeed.value = engines.value.maxSpeed;
  }

  function adjustSpeed(delta: number) {
    if (isDocked.value || tractorBeam.value.active) return;
    setTargetSpeed(targetSpeed.value + delta);
  }

  function adjustHeading(delta: number) {
    if (isDocked.value || tractorBeam.value.active) return;
    setTargetHeading(targetHeading.value + delta);
  }

  /**
   * Engage tractor beam to pull ship to docking position
   * @param stationId - ID of station engaging tractor beam
   * @param dockingPosition - Target world position for docking
   * @param dockingHeading - Required heading for docking
   * @param onComplete - Callback when ship reaches docking position
   */
  function engageTractorBeam(
    stationId: string,
    dockingPosition: Vector2,
    dockingHeading: number,
    onComplete?: () => void
  ) {
    // Stop current movement
    targetSpeed.value = 0;
    speed.value = 0;
    
    tractorBeam.value = {
      active: true,
      stationId,
      targetPosition: { ...dockingPosition },
      targetHeading: normalizeAngle(dockingHeading),
      onComplete: onComplete ?? null,
    };
  }

  /**
   * Disengage tractor beam (cancel docking)
   */
  function disengageTractorBeam() {
    tractorBeam.value = {
      active: false,
      stationId: null,
      targetPosition: null,
      targetHeading: 0,
      onComplete: null,
    };
  }

  /**
   * Update tractor beam movement - pulls ship toward docking position
   */
  function updateTractorBeam(deltaTime: number) {
    if (!tractorBeam.value.active || !tractorBeam.value.targetPosition) return;

    const target = tractorBeam.value.targetPosition;
    const dx = target.x - position.value.x;
    const dy = target.y - position.value.y;
    const distance = Math.hypot(dx, dy);

    // Check if we've reached the docking position
    if (distance <= DOCKING_COMPLETE_DISTANCE) {
      // Snap to exact position
      position.value = { ...target };
      heading.value = tractorBeam.value.targetHeading;
      
      // Complete docking
      const stationId = tractorBeam.value.stationId;
      const callback = tractorBeam.value.onComplete;
      
      disengageTractorBeam();
      
      if (stationId) {
        dock(stationId);
      }
      
      if (callback) {
        callback();
      }
      return;
    }

    // Move toward target at tractor beam speed
    const moveDistance = TRACTOR_BEAM_SPEED * deltaTime;
    const ratio = Math.min(1, moveDistance / distance);
    
    position.value = {
      x: position.value.x + dx * ratio,
      y: position.value.y + dy * ratio,
    };

    // Rotate toward target heading
    const targetHeadingNorm = tractorBeam.value.targetHeading;
    const currentHeadingNorm = normalizeAngle(heading.value);
    
    let angleDiff = targetHeadingNorm - currentHeadingNorm;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    
    const maxTurn = TRACTOR_BEAM_TURN_RATE * deltaTime;
    const turnAmount = clamp(angleDiff, -maxTurn, maxTurn);
    
    heading.value = normalizeAngle(heading.value + turnAmount);
    targetHeading.value = heading.value;
  }

  function dock(stationId: string) {
    if (speed.value > 5 && !tractorBeam.value.active) return false; // Can't dock at high speed (unless tractor beam)

    isDocked.value = true;
    dockedAtId.value = stationId;
    targetSpeed.value = 0;
    speed.value = 0;
    disengageTractorBeam();
    return true;
  }

  function undock() {
    isDocked.value = false;
    dockedAtId.value = null;
  }

  function update(gameTime: GameTime) {
    if (isDocked.value || gameTime.paused) return;

    // If tractor beam is active, use tractor beam movement
    if (tractorBeam.value.active) {
      updateTractorBeam(gameTime.deltaTime);
      return;
    }

    const result = updateMovement({
      position: position.value,
      heading: heading.value,
      targetHeading: targetHeading.value,
      speed: speed.value,
      targetSpeed: targetSpeed.value,
      maxSpeed: engines.value.maxSpeed,
      turnRate: engines.value.turnRate,
      acceleration: engines.value.acceleration,
    }, gameTime.deltaTime);

    position.value = result.position;
    heading.value = result.heading;
    speed.value = result.speed;
  }

  function setPosition(newPosition: Vector2) {
    position.value = { ...newPosition };
  }

  function reset(initialPosition: Vector2 = vec2(0, 0)) {
    position.value = { ...initialPosition };
    heading.value = 0;
    targetHeading.value = 0;
    speed.value = 0;
    targetSpeed.value = 0;
    isDocked.value = false;
    dockedAtId.value = null;
    disengageTractorBeam();
    cargoBay.value = { ...DEFAULT_CARGO_BAY, items: [...DEFAULT_CARGO_ITEMS] };
  }

  return {
    // State
    position,
    heading,
    targetHeading,
    speed,
    targetSpeed,
    engines,
    sensors,
    cargoBay,
    isDocked,
    dockedAtId,
    templateId,
    size,
    tractorBeam,
    // Computed
    minSpeed,
    isMoving,
    isReversing,
    isTurning,
    isAccelerating,
    speedPercent,
    headingFormatted,
    speedFormatted,
    isTractorBeamActive,
    // Actions
    setTargetHeading,
    setTargetSpeed,
    allStop,
    fullSpeed,
    adjustSpeed,
    adjustHeading,
    engageTractorBeam,
    disengageTractorBeam,
    dock,
    undock,
    update,
    setPosition,
    reset,
  };
});
