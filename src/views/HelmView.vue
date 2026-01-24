<script setup lang="ts">
import { computed } from 'vue';
import { useShipStore, useSensorStore, useNavigationStore } from '@/stores';
import { HelmMap } from '@/components/map';
import { LcarsButton, HeadingGauge, SpeedSlider } from '@/components/ui';
import { CompactRadar } from '@/components/sensors';
import { formatDistance, getDockingRange, getAlignmentTolerance } from '@/models';

const shipStore = useShipStore();
const sensorStore = useSensorStore();
const navStore = useNavigationStore();

// Waypoint heading for compass display
const waypointHeading = computed(() => {
  if (!navStore.currentWaypoint) return null;
  return navStore.getHeadingToWaypoint(shipStore.position, navStore.currentWaypoint.position);
});

// Docking logic (moved from DockingPanel)
const nearestStation = computed(() => {
  const stationContacts = sensorStore.stationContacts;
  if (stationContacts.length === 0) return null;
  const sorted = [...stationContacts].sort((a, b) => a.distance - b.distance);
  return sorted[0];
});

const nearestStationData = computed(() => {
  if (!nearestStation.value) return null;
  return navStore.stations.find(s => s.id === nearestStation.value!.id);
});

const isInDockingRange = computed(() => {
  if (!nearestStation.value || !nearestStationData.value) return false;
  return nearestStation.value.distance <= nearestStationData.value.dockingRange;
});

const dockedStation = computed(() => {
  if (!shipStore.dockedAtId) return null;
  return navStore.stations.find(s => s.id === shipStore.dockedAtId);
});

// Find nearest docking port across ALL stations (no selection required)
const nearestDockingPortStatus = computed(() => {
  return navStore.findNearestDockingPort(
    shipStore.position,
    shipStore.heading
  );
});

// T049: Docking port status - prefer selected station, fall back to nearest
const activeDockingStatus = computed(() => {
  // If a station is selected, use its docking status
  const station = navStore.selectedStation;
  if (station) {
    return {
      ...navStore.checkDockingPortAvailability(
        station,
        shipStore.position,
        shipStore.heading
      ),
      station,
    };
  }
  
  // Otherwise, find the nearest docking port across all stations
  return nearestDockingPortStatus.value;
});

// Updated canDock that considers port alignment (T050)
const canDockAtPort = computed(() => {
  if (shipStore.isDocked) return false;
  if (Math.abs(shipStore.speed) > 5) return false;
  if (!activeDockingStatus.value) return false;
  return activeDockingStatus.value.available;
});

// Enhanced docking status message - simplified since ship auto-rotates
const dockingStatusMessage = computed(() => {
  if (shipStore.isDocked) return 'DOCKED';
  
  const status = activeDockingStatus.value;
  
  // Check distance/range first
  if (!status) return 'NO PORTS';
  if (!status.inRange) return 'OUT OF RANGE';
  
  // Then check speed
  if (Math.abs(shipStore.speed) > 5) return 'TOO FAST';
  
  // If in range and slow enough, docking is available
  return 'DOCK';
});

// Docking port info for display
const dockingPortInfo = computed(() => {
  const status = activeDockingStatus.value;
  if (!status || !status.port) return null;
  
  return {
    portId: status.port.id,
    distance: status.distance,
    range: getDockingRange(status.port),
    alignmentAngle: status.alignmentAngle,
    tolerance: getAlignmentTolerance(status.port),
    inRange: status.inRange,
    headingAligned: status.headingAligned,
    approachAligned: status.approachAligned,
    available: status.available,
  };
});

// Check if tractor beam is active
const isTractorBeamActive = computed(() => shipStore.isTractorBeamActive);

function handleDock() {
  // T050: Use port-based docking with tractor beam - auto-rotates ship
  const status = activeDockingStatus.value;
  if (canDockAtPort.value && status?.station) {
    if (status.portWorldPosition && status.port) {
      // Calculate docking position (60% of range along approach vector)
      const dockingRange = getDockingRange(status.port);
      const dockingPositionDistance = dockingRange * 0.6;
      
      // Get approach vector from port world position
      const ports = navStore.getStationDockingPorts(status.station);
      const portData = ports.find(p => p.port.id === status.port?.id);
      
      if (portData) {
        const dockingPosition = {
          x: portData.worldPosition.x + portData.worldApproachVector.x * dockingPositionDistance,
          y: portData.worldPosition.y + portData.worldApproachVector.y * dockingPositionDistance,
        };
        
        // Use the pre-calculated required heading from docking status
        // This rotates the ship so its docking port faces the station's port
        const normalizedHeading = status.requiredHeading ?? 0;
        
        // Engage tractor beam to pull ship to docking position AND rotate to correct heading
        shipStore.engageTractorBeam(
          status.station.id,
          status.port.id,
          dockingPosition,
          normalizedHeading
        );
        return;
      }
    }
    // Fallback to instant docking if tractor beam calculation fails
    shipStore.dock(status.station.id);
  }
}

function handleUndock() {
  shipStore.undock();
}

function setHeading(heading: number) {
  // Manual heading adjustment - disable autopilot
  navStore.disableAutopilot();
  shipStore.setTargetHeading(heading);
}

function setSpeed(speed: number) {
  shipStore.setTargetSpeed(speed);
}

function handleRadarSelect(contactId: string) {
  sensorStore.selectContact(contactId);
  navStore.selectStation(contactId);
}
</script>

<template>
  <div class="helm-view">
    <!-- Main Map Area -->
    <div class="helm-view__map">
      <HelmMap />
    </div>

    <!-- Left Panel Column -->
    <div class="helm-view__sidebar">
      <div class="helm-view__panel">
        <!-- Heading Section -->
        <div class="helm-view__section">
          <div class="helm-view__section-header">
            Heading
          </div>
          <HeadingGauge
            :current-heading="shipStore.heading"
            :target-heading="shipStore.targetHeading"
            :waypoint-heading="waypointHeading"
            :disabled="shipStore.isDocked"
            @set-heading="setHeading"
          />
        </div>

        <!-- Divider -->
        <div class="helm-view__divider" />

        <!-- Speed Section -->
        <div class="helm-view__section">
          <div class="helm-view__section-header">
            Speed
          </div>
          <SpeedSlider
            :current-speed="shipStore.speed"
            :target-speed="shipStore.targetSpeed"
            :max-speed="shipStore.engines.maxSpeed"
            :min-speed="shipStore.minSpeed"
            :disabled="shipStore.isDocked || isTractorBeamActive"
            @set-speed="setSpeed"
          />
        </div>

        <!-- Divider -->
        <div class="helm-view__divider" />

        <!-- Emergency Controls -->
        <div class="helm-view__controls">
          <LcarsButton 
            label="ALL STOP" 
            color="danger" 
            full-width 
            :disabled="shipStore.isDocked || isTractorBeamActive"
            @click="shipStore.allStop()" 
          />
          
          <!-- Tractor Beam Active Status -->
          <template v-if="isTractorBeamActive">
            <div class="helm-view__tractor-beam-info">
              <span class="helm-view__tractor-beam-label">TRACTOR BEAM</span>
              <span class="helm-view__tractor-beam-status">ENGAGED</span>
            </div>
            <LcarsButton 
              label="CANCEL DOCK" 
              color="warning" 
              full-width 
              @click="shipStore.disengageTractorBeam()" 
            />
          </template>
          <!-- Docked: show undock button -->
          <template v-else-if="shipStore.isDocked">
            <div class="helm-view__docked-info">
              <span class="helm-view__docked-label">DOCKED AT</span>
              <span class="helm-view__docked-station">{{ dockedStation?.name }}</span>
            </div>
            <LcarsButton 
              label="UNDOCK" 
              color="warning" 
              full-width 
              @click="handleUndock" 
            />
          </template>
          <!-- Not docked: always show dock button (enabled/disabled based on status) -->
          <template v-else>
            <LcarsButton 
              :label="canDockAtPort ? 'DOCK' : dockingStatusMessage" 
              :color="canDockAtPort ? 'success' : 'purple'" 
              full-width 
              :disabled="!canDockAtPort"
              @click="handleDock" 
            />
          </template>

          <LcarsButton 
            :label="navStore.autopilotEnabled ? 'AUTOPILOT ON' : 'AUTOPILOT OFF'" 
            :color="navStore.autopilotEnabled ? 'success' : 'purple'" 
            full-width 
            :disabled="shipStore.isDocked"
            @click="navStore.toggleAutopilot()" 
          />
        </div>

        <!-- Divider -->
        <div class="helm-view__divider" />

        <!-- Proximity Radar -->
        <div class="helm-view__section">
          <div class="helm-view__section-header">
            Proximity
          </div>
          <div class="helm-view__radar-container">
            <CompactRadar
              :segments="sensorStore.radarSegments"
              :contacts="sensorStore.contacts"
              :range="sensorStore.sensorRange"
              :display-range="sensorStore.proximityDisplayRange"
              :ship-heading="shipStore.heading"
              :size="120"
              @select-contact="handleRadarSelect"
            />
          </div>
          <div
            v-if="nearestStation"
            class="helm-view__nearest"
          >
            <span class="helm-view__nearest-label">{{ nearestStation.name }}</span>
            <span
              class="helm-view__nearest-distance"
              :class="{ 'helm-view__nearest-distance--in-range': isInDockingRange }"
            >
              {{ formatDistance(nearestStation.distance) }}
            </span>
          </div>
        </div>

        <!-- T049: Docking Status Indicator -->
        <div
          v-if="navStore.selectedStation && !shipStore.isDocked"
          class="helm-view__section"
        >
          <div class="helm-view__section-header">
            Docking Status
          </div>
          <div class="helm-view__docking-status">
            <div class="helm-view__docking-station">
              {{ navStore.selectedStation.name }}
            </div>
            <div
              class="helm-view__docking-message"
              :class="{
                'helm-view__docking-message--ready': dockingPortInfo?.available,
                'helm-view__docking-message--warning': !dockingPortInfo?.available && dockingPortInfo
              }"
            >
              {{ dockingStatusMessage }}
            </div>
            <div
              v-if="dockingPortInfo"
              class="helm-view__docking-details"
            >
              <div class="helm-view__docking-row">
                <span class="helm-view__docking-label">Distance:</span>
                <span
                  class="helm-view__docking-value"
                  :class="{ 'helm-view__docking-value--ok': dockingPortInfo.inRange }"
                >
                  {{ Math.round(dockingPortInfo.distance) }} / {{ dockingPortInfo.range }}
                </span>
              </div>
              <div class="helm-view__docking-row">
                <span class="helm-view__docking-label">Alignment:</span>
                <span
                  class="helm-view__docking-value"
                  :class="{ 'helm-view__docking-value--ok': dockingPortInfo.headingAligned }"
                >
                  {{ Math.round(dockingPortInfo.alignmentAngle) }}° / {{ dockingPortInfo.tolerance }}°
                </span>
              </div>
              <div class="helm-view__docking-row">
                <span class="helm-view__docking-label">Approach:</span>
                <span
                  class="helm-view__docking-value"
                  :class="{ 'helm-view__docking-value--ok': dockingPortInfo.approachAligned }"
                >
                  {{ dockingPortInfo.approachAligned ? 'OK' : 'ADJUST' }}
                </span>
              </div>
            </div>
            <LcarsButton
              v-if="canDockAtPort"
              label="DOCK"
              color="success"
              full-width
              @click="handleDock"
            />
          </div>
        </div>

        <!-- Docked indicator -->
        <div
          v-if="shipStore.isDocked"
          class="helm-view__docked-notice"
        >
          HELM DISABLED WHILE DOCKED
        </div>
      </div>
    </div>

    <!-- Station Title -->
    <div class="helm-view__title">
      <span
        v-if="navStore.autopilotEnabled"
        class="helm-view__autopilot-badge"
      >AUTOPILOT</span>
      <span class="helm-view__title-text">HELM CONTROL</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.helm-view {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr;
  gap: $space-sm;
  padding: $space-sm;
  background-color: $color-black;
  overflow: hidden;

  &__title {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $space-xs $space-md;
    background-color: $color-gold-dark;
    border-radius: $radius-md;
  }

  &__title-text {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-black;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  &__autopilot-badge {
    padding: $space-xs $space-sm;
    background-color: $color-success;
    color: $color-black;
    font-family: $font-display;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: $radius-sm;
    margin-right: $space-md;
    animation: helm-pulse-glow 2s ease-in-out infinite;
  }

  &__map {
    grid-column: 2;
    grid-row: 2;
    border-radius: $radius-lcars-corner;
    overflow: hidden;
    border: $panel-border-width solid $color-gold;
  }

  &__sidebar {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-sm;
    padding: $space-sm;
    background-color: $color-black;
    border: $panel-border-width solid $color-gold;
    border-radius: $radius-lcars-corner;
    overflow-y: auto;
    
    // Custom scrollbar styling
    scrollbar-width: thin;
    scrollbar-color: $color-gold $color-black;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: $color-black;
    }
    
    &::-webkit-scrollbar-thumb {
      background: $color-gold;
      border-radius: $radius-pill;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;
  }

  &__section-header {
    width: 100%;
    font-family: $font-display;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__divider {
    height: 1px;
    background-color: $color-gray-dark;
    margin: $space-xs 0;
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
    width: 100%;
  }

  &__docked-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: $space-xs;
    background-color: rgba($color-success, 0.1);
    border-radius: $radius-sm;
  }

  &__docked-label {
    font-family: $font-display;
    font-size: 10px;
    color: $color-success;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__docked-station {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gold;
  }

  &__tractor-beam-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: $space-xs;
    background-color: rgba($color-purple, 0.2);
    border-radius: $radius-sm;
    animation: tractor-pulse 1s ease-in-out infinite;
  }

  &__tractor-beam-label {
    font-family: $font-display;
    font-size: 10px;
    color: $color-purple;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__tractor-beam-status {
    font-family: $font-mono;
    font-size: $font-size-xs;
    color: $color-gold;
    animation: tractor-text-pulse 0.5s ease-in-out infinite;
  }

  @keyframes tractor-pulse {
    0%, 100% {
      background-color: rgba($color-purple, 0.1);
      box-shadow: 0 0 5px rgba($color-purple, 0.3);
    }
    50% {
      background-color: rgba($color-purple, 0.3);
      box-shadow: 0 0 15px rgba($color-purple, 0.6);
    }
  }

  @keyframes tractor-text-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  &__radar-container {
    display: flex;
    justify-content: center;
  }

  &__nearest {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: $space-xs;
    background-color: rgba($color-purple, 0.1);
    border-radius: $radius-sm;
  }

  &__nearest-label {
    font-family: $font-mono;
    font-size: 10px;
    color: $color-gold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__nearest-distance {
    font-family: $font-mono;
    font-size: 10px;
    color: $color-warning;

    &--in-range {
      color: $color-success;
    }
  }

  // T049: Docking Status Indicator styles
  &__docking-status {
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__docking-station {
    font-family: $font-mono;
    font-size: 11px;
    color: $color-gold;
    text-align: center;
    padding-bottom: $space-xs;
    border-bottom: 1px solid rgba($color-gold, 0.3);
  }

  &__docking-message {
    font-family: $font-display;
    font-size: 10px;
    text-align: center;
    padding: $space-xs;
    border-radius: $radius-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background-color: rgba($color-purple, 0.2);
    color: $color-purple;

    &--ready {
      background-color: rgba($color-success, 0.2);
      color: $color-success;
    }

    &--warning {
      background-color: rgba($color-warning, 0.2);
      color: $color-warning;
    }
  }

  &__docking-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $space-xs;
    background-color: rgba($color-black, 0.3);
    border-radius: $radius-sm;
  }

  &__docking-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__docking-label {
    font-family: $font-display;
    font-size: 9px;
    color: $color-gray;
    text-transform: uppercase;
  }

  &__docking-value {
    font-family: $font-mono;
    font-size: 10px;
    color: $color-warning;

    &--ok {
      color: $color-success;
    }
  }

  &__docked-notice {
    margin-top: auto;
    padding: $space-xs;
    background-color: $color-warning-dim;
    color: $color-black;
    text-align: center;
    font-family: $font-display;
    font-size: 10px;
    border-radius: $radius-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Responsive adjustments
@media (max-width: $breakpoint-lg) {
  .helm-view {
    grid-template-columns: 180px 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .helm-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;

    &__map {
      grid-column: 1;
      grid-row: 2;
    }

    &__sidebar {
      grid-column: 1;
      grid-row: 3;
      max-height: 300px;
    }
  }
}

@keyframes helm-pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
