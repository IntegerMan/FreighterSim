/**
 * Docking Port Utilities
 * 
 * Shared logic for docking port filtering, position calculation, and rendering.
 * Used by both HelmMap.vue and SystemMap.vue for consistent docking graphics.
 * 
 * @module core/rendering/dockingUtils
 */

import type { Vector2, DockingPort, Station, StationModulePlacement } from '@/models';
import { getStationTemplateById, getStationModule } from '@/data/shapes';
import { MAP_COLORS, MODULE_SCALE_FACTOR, STATION_VISUAL_MULTIPLIER, getVisualDockingRange, type CameraState, worldToScreen } from './mapUtils';

// =============================================================================
// Constants
// =============================================================================

/** Default docking range if not specified on port */
export const DEFAULT_DOCKING_RANGE = 25;

/** Get the docking range for a port, with default fallback */
export function getDockingRange(port: DockingPort): number {
  return port.dockingRange ?? DEFAULT_DOCKING_RANGE;
}

// =============================================================================
// Port Filtering Logic
// =============================================================================

/**
 * Determine if a cargo port should be visible based on module position.
 * 
 * Cargo modules have ports on all 4 sides, but when attached to station arms,
 * only the port facing directly away from the station core is safely accessible:
 * - The inward-facing port is blocked by the corridor connection
 * - The perpendicular ports have approach corridors that pass through station structure
 * 
 * @param portId - The port ID (e.g., 'cargo-dock-east')
 * @param modulePosition - The module's position in station-local coordinates
 * @returns true if the port should be visible/usable
 */
export function isCargoPortAccessible(portId: string, modulePosition: Vector2): boolean {
  const moduleX = modulePosition.x;
  const moduleY = modulePosition.y;
  const absX = Math.abs(moduleX);
  const absY = Math.abs(moduleY);
  
  // Determine which arm this module is on
  const isOnEastArm = absX > absY && moduleX > 0;
  const isOnWestArm = absX > absY && moduleX < 0;
  const isOnNorthArm = absY > absX && moduleY > 0;
  const isOnSouthArm = absY > absX && moduleY < 0;
  
  // Only the port facing directly away from the station is accessible
  if (isOnEastArm) return portId === 'cargo-dock-east';
  if (isOnWestArm) return portId === 'cargo-dock-west';
  if (isOnNorthArm) return portId === 'cargo-dock-north';
  if (isOnSouthArm) return portId === 'cargo-dock-south';
  
  // If not on any arm (shouldn't happen), show all ports
  return true;
}

/**
 * Check if a docking port should be visible/usable based on module type and position.
 * 
 * @param port - The docking port
 * @param modulePlacement - The module placement info
 * @returns true if the port should be visible/usable
 */
export function isDockingPortAccessible(port: DockingPort, modulePlacement: StationModulePlacement): boolean {
  if (modulePlacement.moduleType === 'cargo') {
    return isCargoPortAccessible(port.id, modulePlacement.position);
  }
  // All other module types: all ports are accessible
  return true;
}

// =============================================================================
// Port Position Calculation
// =============================================================================

/** Docking port with calculated world coordinates */
export interface WorldDockingPort {
  /** Original port definition */
  port: DockingPort;
  /** Module placement this port belongs to */
  modulePlacement: StationModulePlacement;
  /** World position of the port */
  worldPosition: Vector2;
  /** World-space approach vector (normalized) */
  worldApproachVector: Vector2;
}

/**
 * Get all accessible docking ports for a station with their world positions.
 * This is the single source of truth for docking port positions and filtering.
 * 
 * @param station - The station to get ports for
 * @returns Array of docking ports with world positions
 */
export function getStationDockingPorts(station: Station): WorldDockingPort[] {
  const templateId = station.templateId ?? station.type;
  const template = getStationTemplateById(templateId);
  if (!template) return [];

  const ports: WorldDockingPort[] = [];
  const stationRotationRad = ((station.rotation ?? 0) * Math.PI) / 180;
  const stationScale = station.dockingRange * STATION_VISUAL_MULTIPLIER;

  for (const modulePlacement of template.modules) {
    const module = getStationModule(modulePlacement.moduleType);
    if (!module?.dockingPorts) continue;

    const moduleRotationRad = (modulePlacement.rotation * Math.PI) / 180;
    const totalRotation = stationRotationRad + moduleRotationRad;
    const modulePositionScale = stationScale;
    const modulePortScale = stationScale * MODULE_SCALE_FACTOR;

    for (const port of module.dockingPorts) {
      // Apply port filtering
      if (!isDockingPortAccessible(port, modulePlacement)) continue;

      // Transform port position from module local → station local → world
      const moduleLocalX = port.position.x * modulePortScale * Math.cos(moduleRotationRad) 
                         - port.position.y * modulePortScale * Math.sin(moduleRotationRad);
      const moduleLocalY = port.position.x * modulePortScale * Math.sin(moduleRotationRad) 
                         + port.position.y * modulePortScale * Math.cos(moduleRotationRad);
      
      const stationLocalX = moduleLocalX + modulePlacement.position.x * modulePositionScale;
      const stationLocalY = moduleLocalY + modulePlacement.position.y * modulePositionScale;
      
      const worldX = stationLocalX * Math.cos(stationRotationRad) 
                   - stationLocalY * Math.sin(stationRotationRad) + station.position.x;
      const worldY = stationLocalX * Math.sin(stationRotationRad) 
                   + stationLocalY * Math.cos(stationRotationRad) + station.position.y;

      // Transform approach vector
      const approachX = port.approachVector.x * Math.cos(totalRotation) 
                      - port.approachVector.y * Math.sin(totalRotation);
      const approachY = port.approachVector.x * Math.sin(totalRotation) 
                      + port.approachVector.y * Math.cos(totalRotation);

      ports.push({
        port,
        modulePlacement,
        worldPosition: { x: worldX, y: worldY },
        worldApproachVector: { x: approachX, y: approachY },
      });
    }
  }

  return ports;
}

// =============================================================================
// Docking Port Rendering
// =============================================================================

/** Options for drawing docking ports */
export interface DrawDockingPortsOptions {
  /** Whether the station is selected */
  isSelected?: boolean;
  /** ID of the active/target port (for colored lights) */
  activePortId?: string | null;
  /** Whether to draw runway lights */
  drawRunwayLights?: boolean;
  /** Current time for animation (Date.now() / 1000) */
  animationTime?: number;
}

/**
 * Draw all docking port indicators for a station.
 * Renders port markers, docking range circles, and optional runway lights.
 * 
 * @param ctx - Canvas rendering context
 * @param station - The station to draw ports for
 * @param camera - Camera state for coordinate conversion
 * @param options - Drawing options
 */
export function drawDockingPorts(
  ctx: CanvasRenderingContext2D,
  station: Station,
  camera: CameraState,
  options: DrawDockingPortsOptions = {}
): void {
  const {
    isSelected = false,
    activePortId = null,
    drawRunwayLights = true,
    animationTime = Date.now() / 1000,
  } = options;

  const ports = getStationDockingPorts(station);
  const zoom = camera.zoom;

  for (const { port, worldPosition, worldApproachVector } of ports) {
    const screenPos = worldToScreen(worldPosition, camera);
    
    // Port marker color
    const portColor = isSelected ? MAP_COLORS.dockingPort : MAP_COLORS.dockingPortRange;
    
    // Draw port marker (small circle)
    const portSize = Math.max(5, 8 * zoom);
    ctx.fillStyle = portColor;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, portSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw docking range indicator circle
    const baseDockingRange = getDockingRange(port);
    const visualDockingRange = getVisualDockingRange(baseDockingRange);
    const screenDockingRange = visualDockingRange * zoom;

    ctx.strokeStyle = isSelected ? MAP_COLORS.dockingPortRangeSelected : MAP_COLORS.dockingPortRange;
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, screenDockingRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw runway lights (if enabled and not the active port)
    if (drawRunwayLights && port.id !== activePortId) {
      // white mode for non-active ports (appearance matches approach guidance placement)
      drawRunwayLightsForPort(ctx, worldPosition, worldApproachVector, baseDockingRange, camera, animationTime, 'white');
    }
  }
}

// Runway & lighting configuration - single source of truth for length / width / spacing
export const RUNWAY_LENGTH_FACTOR = 10; // runway length = dockingRange * RUNWAY_LENGTH_FACTOR
export const RUNWAY_WIDTH = 40;        // wider hitbox to make lining up easier
export const LIGHT_SPACING = 30;       // distance between light pairs in world units

/**
 * Draw runway lights along a docking approach corridor.
 * Supports both 'white' (default) runway marker lights and 'colored' landing lights
 * used for the active runway (green/amber/red chasing effect).
 */
export function drawRunwayLightsForPort(
  ctx: CanvasRenderingContext2D,
  portWorldPosition: Vector2,
  worldApproachVector: Vector2,
  dockingRange: number,
  camera: CameraState,
  animationTime: number = Date.now() / 1000,
  mode: 'white' | 'colored' = 'white'
): void {
  const runwayLength = dockingRange * RUNWAY_LENGTH_FACTOR;
  const runwayWidth = RUNWAY_WIDTH;
  const lightSpacing = LIGHT_SPACING;
  const numLights = Math.floor(runwayLength / lightSpacing);
  const zoom = camera.zoom;

  // Perpendicular vector for light positioning
  const perpX = -worldApproachVector.y;
  const perpY = worldApproachVector.x;

  for (let i = 0; i < numLights; i++) {
    const distanceFromPort = (i + 1) * lightSpacing;

    const centerWorldX = portWorldPosition.x + worldApproachVector.x * distanceFromPort;
    const centerWorldY = portWorldPosition.y + worldApproachVector.y * distanceFromPort;

    const leftWorldX = centerWorldX + perpX * runwayWidth;
    const leftWorldY = centerWorldY + perpY * runwayWidth;
    const rightWorldX = centerWorldX - perpX * runwayWidth;
    const rightWorldY = centerWorldY - perpY * runwayWidth;

    const leftScreen = worldToScreen({ x: leftWorldX, y: leftWorldY }, camera);
    const rightScreen = worldToScreen({ x: rightWorldX, y: rightWorldY }, camera);

    if (mode === 'white') {
      // Pulsing white marker lights (subtle guidance)
      const pulsePhase = (Math.sin(animationTime * Math.PI) + 1) / 2;
      const lightBrightness = 0.4 + pulsePhase * 0.6;
      const color = `rgba(255, 255, 255, ${lightBrightness})`;

      const lightSize = Math.max(2, 3 * zoom);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(leftScreen.x, leftScreen.y, lightSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightScreen.x, rightScreen.y, lightSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Colored landing lights with chasing/phase effect
      const time = animationTime * 1000 / 200; // match previous animation speed
      const lightIndex = i;
      const phase = (lightIndex + time) % 4;
      const brightness = phase < 1 ? 1 : 0.3;

      const distanceRatio = distanceFromPort / runwayLength;
      let lightColor: string;
      if (distanceRatio > 0.7) {
        lightColor = `rgba(0, 255, 128, ${brightness})`; // Green
      } else if (distanceRatio > 0.3) {
        lightColor = `rgba(255, 200, 0, ${brightness})`; // Amber
      } else {
        lightColor = `rgba(255, 80, 80, ${brightness})`; // Red
      }

      const lightSize = Math.max(3, 5 * zoom);
      ctx.fillStyle = lightColor;
      ctx.beginPath();
      ctx.arc(leftScreen.x, leftScreen.y, lightSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightScreen.x, rightScreen.y, lightSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
