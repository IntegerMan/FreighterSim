import type { Vector2 } from './math';

/**
 * Types of sensor contacts
 */
export type ContactType = 'station' | 'planet' | 'ship' | 'jump-gate' | 'star' | 'unknown';

/**
 * Default radius for contacts without explicit size
 */
export const DEFAULT_CONTACT_RADIUS = 10;

/**
 * A sensor contact representing a detected object
 */
export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  position: Vector2;
  radius: number;
  distance: number;
  bearing: number;
  isSelected: boolean;
  /** Visibility percentage (0-1): 1 = fully visible, 0 = fully occluded */
  visibility: number;
  /** ID of the object blocking this contact (if partially or fully occluded) */
  occludedBy?: string;
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
  radius?: number;
}): Contact {
  const dx = config.position.x - config.shipPosition.x;
  const dy = config.position.y - config.shipPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Use atan2(dx, dy) for North-Up coordinate system per ADR-0011
  // 0° = North (+Y), 90° = East (+X), 180° = South, 270° = West
  let bearing = Math.atan2(dx, dy) * (180 / Math.PI);
  if (bearing < 0) bearing += 360;
  
  return {
    id: config.id,
    type: config.type,
    name: config.name,
    position: config.position,
    radius: config.radius ?? DEFAULT_CONTACT_RADIUS,
    distance,
    bearing,
    isSelected: false,
    visibility: 1, // Default to fully visible
  };
}

/**
 * Update contact distance and bearing relative to ship
 */
export function updateContactRelative(contact: Contact, shipPosition: Vector2): Contact {
  const dx = contact.position.x - shipPosition.x;
  const dy = contact.position.y - shipPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Use atan2(dx, dy) for North-Up coordinate system per ADR-0011
  let bearing = Math.atan2(dx, dy) * (180 / Math.PI);
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
