import type { Vector2 } from './math';

/**
 * Types of sensor contacts
 */
export type ContactType = 'station' | 'planet' | 'ship' | 'jump-gate' | 'unknown';

/**
 * A sensor contact representing a detected object
 */
export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  position: Vector2;
  distance: number;
  bearing: number;
  isSelected: boolean;
}

/**
 * Create a contact from a detected object
 */
export function createContact(config: {
  id: string;
  type: ContactType;
  name: string;
  position: Vector2;
  shipPosition: Vector2;
}): Contact {
  const dx = config.position.x - config.shipPosition.x;
  const dy = config.position.y - config.shipPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  let bearing = Math.atan2(dy, dx) * (180 / Math.PI);
  if (bearing < 0) bearing += 360;
  
  return {
    id: config.id,
    type: config.type,
    name: config.name,
    position: config.position,
    distance,
    bearing,
    isSelected: false,
  };
}

/**
 * Update contact distance and bearing relative to ship
 */
export function updateContactRelative(contact: Contact, shipPosition: Vector2): Contact {
  const dx = contact.position.x - shipPosition.x;
  const dy = contact.position.y - shipPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  let bearing = Math.atan2(dy, dx) * (180 / Math.PI);
  if (bearing < 0) bearing += 360;
  
  return {
    ...contact,
    distance,
    bearing,
  };
}

/**
 * Get the icon/symbol for a contact type
 */
export function getContactSymbol(type: ContactType): string {
  switch (type) {
    case 'station': return '◇';
    case 'planet': return '○';
    case 'ship': return '△';
    case 'jump-gate': return '⬡';
    case 'unknown': return '?';
    default: return '•';
  }
}

/**
 * Format bearing for display (e.g., "045°")
 */
export function formatBearing(bearing: number): string {
  return bearing.toFixed(0).padStart(3, '0') + '°';
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return distance.toFixed(0) + ' u';
  }
  return (distance / 1000).toFixed(1) + ' ku';
}
