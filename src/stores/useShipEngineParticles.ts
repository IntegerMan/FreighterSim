/**
 * Ship Engine Particle Registration Composable
 * 
 * Handles registering ship engine mounts with the particle system
 * for multi-point particle emission.
 * 
 * This composable should be called once during application initialization
 * to set up the connection between ship templates and particle emission.
 * 
 * @module stores/useShipEngineParticles
 */

import { useShipStore } from './shipStore';
import { useParticleStore, type ShipEngineRegistration } from './particleStore';
import { getShipTemplate } from '@/data/shapes';

/**
 * Register the player ship's engines with the particle system
 * 
 * @returns Function to unregister (for cleanup)
 */
export function usePlayerShipEngines(): () => void {
  const shipStore = useShipStore();
  const particleStore = useParticleStore();
  
  // Get the ship template
  const template = getShipTemplate(shipStore.templateId);
  
  if (template && template.engineMounts.length > 0) {
    // Register engine mounts for multi-point emission
    const registration: ShipEngineRegistration = {
      shipId: 'player',
      getPosition: () => shipStore.position,
      getHeading: () => shipStore.heading,
      getScale: () => shipStore.size,
      getThrottle: () => {
        // Throttle based on whether ship is accelerating
        // Emit particles when moving or accelerating
        const movingSpeed = Math.abs(shipStore.speed);
        const accelerating = shipStore.speed !== shipStore.targetSpeed;
        if (accelerating || movingSpeed > 1) {
          return Math.min(1, movingSpeed / shipStore.engines.maxSpeed + 0.2);
        }
        return 0;
      },
      engineMounts: template.engineMounts,
    };
    
    particleStore.registerShipEngines(registration);
    
    // Return cleanup function
    return () => {
      particleStore.unregisterShipEngines('player');
    };
  } else {
    // Fallback to legacy single-point emission
    particleStore.registerEmitter(
      'player',
      () => shipStore.position,
      () => {
        const movingSpeed = Math.abs(shipStore.speed);
        const accelerating = shipStore.speed !== shipStore.targetSpeed;
        if (accelerating || movingSpeed > 1) {
          return Math.min(1, movingSpeed / shipStore.engines.maxSpeed + 0.2);
        }
        return 0;
      }
    );
    
    return () => {
      particleStore.unregisterEmitter('player');
    };
  }
}

/**
 * Register an NPC ship's engines with the particle system
 * 
 * @param shipId - Unique identifier for the NPC ship
 * @param templateId - Ship template ID
 * @param getPosition - Function returning ship world position
 * @param getHeading - Function returning ship heading in degrees
 * @param getScale - Function returning ship size
 * @param getThrottle - Function returning throttle (0-1)
 * @returns Function to unregister (for cleanup)
 */
export function useNPCShipEngines(
  shipId: string,
  templateId: string,
  getPosition: () => { x: number; y: number },
  getHeading: () => number,
  getScale: () => number,
  getThrottle: () => number
): () => void {
  const particleStore = useParticleStore();
  const template = getShipTemplate(templateId);
  
  if (template && template.engineMounts.length > 0) {
    const registration: ShipEngineRegistration = {
      shipId,
      getPosition,
      getHeading,
      getScale,
      getThrottle,
      engineMounts: template.engineMounts,
    };
    
    particleStore.registerShipEngines(registration);
    
    return () => {
      particleStore.unregisterShipEngines(shipId);
    };
  } else {
    // Fallback to legacy single-point emission
    particleStore.registerEmitter(shipId, getPosition, getThrottle);
    
    return () => {
      particleStore.unregisterEmitter(shipId);
    };
  }
}
