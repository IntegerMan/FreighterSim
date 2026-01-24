/**
 * Station Template Registry
 * 
 * Central registry for looking up station templates by ID or type.
 * 
 * @module data/shapes/stationRegistry
 */

import type { StationTemplate } from '@/models';
import { STATION_TEMPLATES } from './stations';

/**
 * Registry of all station templates by ID
 */
export const STATION_REGISTRY: Map<string, StationTemplate> = new Map(
  STATION_TEMPLATES.map(t => [t.id, t])
);

/**
 * Get a station template by ID
 * @param id - Template ID
 * @returns StationTemplate or undefined if not found
 */
export function getStationTemplateById(id: string): StationTemplate | undefined {
  return STATION_REGISTRY.get(id);
}

/**
 * Get all registered station templates
 * @returns Array of all station templates
 */
export function getAllStationTemplates(): StationTemplate[] {
  return Array.from(STATION_REGISTRY.values());
}

/**
 * Get station templates by type
 * @param type - Station type to filter by
 * @returns Array of matching station templates
 */
export function getStationTemplatesByType(type: string): StationTemplate[] {
  return getAllStationTemplates().filter(t => t.type === type);
}

/**
 * Check if a station template exists
 * @param id - Template ID to check
 * @returns true if template exists
 */
export function hasStationTemplate(id: string): boolean {
  return STATION_REGISTRY.has(id);
}

/**
 * Get the default rotation for a station template
 * @param id - Template ID
 * @param fallback - Fallback rotation if template not found
 * @returns Rotation in degrees
 */
export function getStationDefaultRotation(id: string, fallback: number = 0): number {
  const template = getStationTemplateById(id);
  return template?.defaultRotation ?? fallback;
}
