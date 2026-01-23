/**
 * Ship Collision Checking Composable
 * 
 * Provides shape-based collision detection between the player ship
 * and other objects (stations, planets, other ships).
 * 
 * @module stores/useShipCollision
 */

import { computed, ref } from 'vue';
import { useShipStore } from './shipStore';
import { useNavigationStore } from './navigationStore';
import { getShipTemplate, getStationTemplateById } from '@/data/shapes';
import { getStationModule } from '@/data/shapes/stationModules';
import {
  getWorldVertices,
  checkBoundingBoxOverlap,
  checkPolygonCollision,
  getBoundingBox,
} from '@/core/physics/collision';
import type { Vector2, CollisionResult, BoundingBox } from '@/models';

/**
 * Collision warning levels
 */
export type CollisionWarningLevel = 'none' | 'caution' | 'warning' | 'danger';

/**
 * Collision warning data
 */
export interface CollisionWarning {
  level: CollisionWarningLevel;
  objectId: string;
  objectName: string;
  objectType: 'station' | 'planet' | 'ship';
  distance: number;
  collisionPoint?: Vector2;
  penetrationDepth?: number;
  normal?: Vector2;
}

/**
 * Distance thresholds for collision warnings (world units)
 */
const WARNING_THRESHOLDS = {
  danger: 20,   // Actual collision or very close
  warning: 50,  // Close proximity
  caution: 100, // Approaching
};

/**
 * Composable for ship collision detection
 */
export function useShipCollision() {
  const shipStore = useShipStore();
  const navStore = useNavigationStore();
  
  // Current collision warnings
  const warnings = ref<CollisionWarning[]>([]);
  
  // Highest warning level
  const highestWarningLevel = computed<CollisionWarningLevel>(() => {
    if (warnings.value.some(w => w.level === 'danger')) return 'danger';
    if (warnings.value.some(w => w.level === 'warning')) return 'warning';
    if (warnings.value.some(w => w.level === 'caution')) return 'caution';
    return 'none';
  });
  
  /**
   * Get the player ship's world vertices
   */
  function getShipWorldVertices(): Vector2[] | null {
    const template = getShipTemplate(shipStore.templateId);
    if (!template) return null;
    
    return getWorldVertices(
      template.shape,
      shipStore.position,
      shipStore.heading,
      shipStore.size
    );
  }
  
  /**
   * Get a station's world vertices
   */
  function getStationWorldVertices(
    templateId: string | undefined,
    position: Vector2,
    rotation: number
  ): Vector2[] | null {
    const template = getStationTemplateById(templateId ?? 'trading-hub');
    if (!template || template.modules.length === 0) return null;
    
    // For simplicity, use the first module's shape
    // A more complete implementation would merge all module shapes
    const modulePlacement = template.modules[0]!;
    const moduleDefinition = getStationModule(modulePlacement.moduleType);
    const stationScale = 15; // Default station scale
    
    return getWorldVertices(
      moduleDefinition.shape,
      position,
      rotation + modulePlacement.rotation,
      stationScale
    );
  }
  
  /**
   * Check collision between ship and a convex polygon
   */
  function checkShipCollision(
    targetVertices: Vector2[],
    targetBounds: BoundingBox
  ): CollisionResult | null {
    const shipVertices = getShipWorldVertices();
    if (!shipVertices) return null;
    
    const shipBounds = getBoundingBox(shipVertices);
    
    // Quick AABB check first
    if (!checkBoundingBoxOverlap(shipBounds, targetBounds)) {
      return null;
    }
    
    // Full SAT check
    return checkPolygonCollision(shipVertices, targetVertices);
  }
  
  /**
   * Calculate distance between ship center and a point
   */
  function distanceToPoint(point: Vector2): number {
    const dx = point.x - shipStore.position.x;
    const dy = point.y - shipStore.position.y;
    return Math.hypot(dx, dy);
  }
  
  /**
   * Determine warning level based on distance
   */
  function getWarningLevel(distance: number, hasCollision: boolean): CollisionWarningLevel {
    if (hasCollision || distance <= WARNING_THRESHOLDS.danger) return 'danger';
    if (distance <= WARNING_THRESHOLDS.warning) return 'warning';
    if (distance <= WARNING_THRESHOLDS.caution) return 'caution';
    return 'none';
  }
  
  /**
   * Update collision warnings for all nearby objects
   */
  function updateCollisionWarnings(): void {
    const newWarnings: CollisionWarning[] = [];
    
    // Check stations
    for (const station of navStore.stations) {
      const stationVertices = getStationWorldVertices(
        station.templateId,
        station.position,
        station.rotation ?? 0
      );
      
      if (stationVertices) {
        const bounds = getBoundingBox(stationVertices);
        const collision = checkShipCollision(stationVertices, bounds);
        const distance = distanceToPoint(station.position);
        const level = getWarningLevel(distance, collision?.collides ?? false);
        
        if (level !== 'none') {
          newWarnings.push({
            level,
            objectId: station.id,
            objectName: station.name,
            objectType: 'station',
            distance,
            collisionPoint: collision?.contactPoint,
            penetrationDepth: collision?.penetration,
            normal: collision?.normal,
          });
        }
      } else {
        // Fallback to simple distance check
        const distance = distanceToPoint(station.position) - station.dockingRange;
        const level = getWarningLevel(distance, distance < 0);
        
        if (level !== 'none') {
          newWarnings.push({
            level,
            objectId: station.id,
            objectName: station.name,
            objectType: 'station',
            distance,
          });
        }
      }
    }
    
    // Check planets (use radius-based collision for spherical objects)
    for (const planet of navStore.planets) {
      const distance = distanceToPoint(planet.position) - planet.radius - (shipStore.size / 2);
      const level = getWarningLevel(distance, distance < 0);
      
      if (level !== 'none') {
        newWarnings.push({
          level,
          objectId: planet.id,
          objectName: planet.name,
          objectType: 'planet',
          distance,
        });
      }
    }
    
    warnings.value = newWarnings;
  }
  
  /**
   * Get push-out vector if ship is colliding
   */
  function getCollisionPushOut(): Vector2 | null {
    for (const warning of warnings.value) {
      if (warning.level === 'danger' && warning.normal && warning.penetrationDepth) {
        return {
          x: warning.normal.x * warning.penetrationDepth,
          y: warning.normal.y * warning.penetrationDepth,
        };
      }
    }
    return null;
  }
  
  return {
    warnings,
    highestWarningLevel,
    updateCollisionWarnings,
    getCollisionPushOut,
    getShipWorldVertices,
  };
}
