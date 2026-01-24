/**
 * Ship Template Registry
 * 
 * Central registry for looking up ship templates by ID.
 * 
 * @module data/shapes/shipRegistry
 */

import type { ShipTemplate, ShipCategory } from '@/models';
import { PLAYER_SHIP_TEMPLATE } from './playerShip';
import { NPC_SHIP_TEMPLATES } from './npcShips';

/**
 * Registry of all ship templates by ID
 */
export const SHIP_REGISTRY: Map<string, ShipTemplate> = new Map([
  [PLAYER_SHIP_TEMPLATE.id, PLAYER_SHIP_TEMPLATE],
  ...NPC_SHIP_TEMPLATES.map(t => [t.id, t] as [string, ShipTemplate]),
]);

/**
 * Get a ship template by ID
 * @param id - Template ID
 * @returns ShipTemplate or undefined if not found
 */
export function getShipTemplate(id: string): ShipTemplate | undefined {
  return SHIP_REGISTRY.get(id);
}

/**
 * Get all registered ship templates
 * @returns Array of all ship templates
 */
export function getAllShipTemplates(): ShipTemplate[] {
  return Array.from(SHIP_REGISTRY.values());
}

/**
 * Get ship templates by category
 * @param category - Ship category to filter by
 * @returns Array of matching ship templates
 */
export function getShipTemplatesByCategory(category: ShipCategory): ShipTemplate[] {
  return getAllShipTemplates().filter(t => t.category === category);
}

/**
 * Check if a ship template exists
 * @param id - Template ID to check
 * @returns true if template exists
 */
export function hasShipTemplate(id: string): boolean {
  return SHIP_REGISTRY.has(id);
}

/**
 * Get the default size for a ship template
 * @param id - Template ID
 * @param fallback - Fallback size if template not found
 * @returns Size in world units
 */
export function getShipDefaultSize(id: string, fallback: number = 30): number {
  const template = getShipTemplate(id);
  return template?.defaultSize ?? fallback;
}
