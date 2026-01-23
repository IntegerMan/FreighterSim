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

  // Derived limits
  const minSpeed = computed(() => -engines.value.maxSpeed * 0.25); // Reverse speed limit (25% of max)

  // Docking state
  const isDocked = ref(false);
  const dockedAtId = ref<string | null>(null);

  // Computed
  const isMoving = computed(() => speed.value !== 0);
  const isReversing = computed(() => speed.value < 0 || targetSpeed.value < 0);
  const isTurning = computed(() => heading.value !== targetHeading.value);
  const isAccelerating = computed(() => speed.value !== targetSpeed.value);
  const speedPercent = computed(() => (speed.value / engines.value.maxSpeed) * 100);

  const headingFormatted = computed(() => {
    return normalizeAngle(heading.value).toFixed(0).padStart(3, '0') + '°';
  });

  const speedFormatted = computed(() => {
    return speed.value.toFixed(0) + ' u/s';
  });

  // Actions
  function setTargetHeading(degrees: number) {
    if (isDocked.value) return;
    targetHeading.value = normalizeAngle(degrees);
  }

  function setTargetSpeed(newSpeed: number) {
    if (isDocked.value) return;
    targetSpeed.value = clamp(newSpeed, minSpeed.value, engines.value.maxSpeed);
  }

  function allStop() {
    targetSpeed.value = 0;
  }

  function fullSpeed() {
    if (isDocked.value) return;
    targetSpeed.value = engines.value.maxSpeed;
  }

  function adjustSpeed(delta: number) {
    if (isDocked.value) return;
    setTargetSpeed(targetSpeed.value + delta);
  }

  function adjustHeading(delta: number) {
    if (isDocked.value) return;
    setTargetHeading(targetHeading.value + delta);
  }

  function dock(stationId: string) {
    if (speed.value > 5) return false; // Can't dock at high speed

    isDocked.value = true;
    dockedAtId.value = stationId;
    targetSpeed.value = 0;
    speed.value = 0;
    return true;
  }

  function undock() {
    isDocked.value = false;
    dockedAtId.value = null;
  }

  function update(gameTime: GameTime) {
    if (isDocked.value || gameTime.paused) return;

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
    // Computed
    minSpeed,
    isMoving,
    isReversing,
    isTurning,
    isAccelerating,
    speedPercent,
    headingFormatted,
    speedFormatted,
    // Actions
    setTargetHeading,
    setTargetSpeed,
    allStop,
    fullSpeed,
    adjustSpeed,
    adjustHeading,
    dock,
    undock,
    update,
    setPosition,
    reset,
  };
});
