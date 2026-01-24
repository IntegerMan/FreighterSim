import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Contact, RadarSegment, Vector2, Shape } from '@/models';
import { createContact, updateContactRelative, getThreatLevelFromDistance } from '@/models';
import { useShipStore } from './shipStore';
import { useNavigationStore } from './navigationStore';
import { useSettingsStore } from './settingsStore';
import type { GameTime } from '@/core/game-loop';
import { hasLineOfSight, raycast, createRay } from '@/core/physics/raycasting';
import type { RaycastTarget } from '@/core/physics/raycasting';
import { getStationVisualBoundingRadius } from '@/core/physics/collision';

/**
 * Angular extent of an object as seen from the ship
 */
interface AngularExtent {
  startAngle: number;
  endAngle: number;
  edgeDistance: number;
  spansZero: boolean; // true if extent crosses 0°/360° boundary
}

/**
 * Calculate the angular extent of an object from the ship's perspective
 */
function getObjectAngularExtent(
  contactPosition: Vector2,
  contactRadius: number,
  shipPosition: Vector2
): AngularExtent {
  const dx = contactPosition.x - shipPosition.x;
  const dy = contactPosition.y - shipPosition.y;
  const centerDistance = Math.sqrt(dx * dx + dy * dy);
  
  // Bearing to center - use atan2(dx, dy) for North-Up coordinate system per ADR-0011
  // 0° = North (+Y), 90° = East (+X), 180° = South, 270° = West
  let centerBearing = Math.atan2(dx, dy) * (180 / Math.PI);
  if (centerBearing < 0) centerBearing += 360;
  
  // Angular half-width based on apparent size
  // Use atan2 for better numerical stability
  const halfAngle = Math.min(
    Math.atan2(contactRadius, Math.max(centerDistance, 1)) * (180 / Math.PI),
    90 // Max 180° total span
  );
  
  let startAngle = centerBearing - halfAngle;
  let endAngle = centerBearing + halfAngle;
  
  // Check if extent crosses 0°/360° boundary
  const spansZero = startAngle < 0 || endAngle >= 360;
  
  // Normalize angles to 0-360
  if (startAngle < 0) startAngle += 360;
  if (endAngle >= 360) endAngle -= 360;
  
  return {
    startAngle,
    endAngle,
    edgeDistance: Math.max(0, centerDistance - contactRadius),
    spansZero,
  };
}

/**
 * Check if an angular extent overlaps a segment
 */
function extentOverlapsSegment(
  extent: AngularExtent,
  segmentStart: number,
  segmentEnd: number
): boolean {
  if (extent.spansZero) {
    // Extent crosses 0°: it spans [startAngle, 360) and [0, endAngle]
    // Segment overlaps if it touches either range
    const overlapsHighPart = segmentEnd > extent.startAngle || segmentStart >= extent.startAngle;
    const overlapsLowPart = segmentStart < extent.endAngle;
    return overlapsHighPart || overlapsLowPart;
  } else {
    // Normal case: extent is continuous [startAngle, endAngle]
    // Overlap if: NOT (segmentEnd <= extent.startAngle OR segmentStart >= extent.endAngle)
    return !(segmentEnd <= extent.startAngle || segmentStart >= extent.endAngle);
  }
}

/**
 * Generate vertices for a regular polygon approximating a circle (normalized coords)
 */
function generateCircleVertices(sides: number): Vector2[] {
  const vertices: Vector2[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    vertices.push({
      x: Math.cos(angle),
      y: Math.sin(angle),
    });
  }
  return vertices;
}

/**
 * Create a circular Shape for occlusion calculations
 */
function createCircleShape(id: string, sides: number = 8): Shape {
  return {
    id,
    name: `Circle-${id}`,
    vertices: generateCircleVertices(sides),
    boundingRadius: 1,
  };
}

/**
 * Convert a Contact to a RaycastTarget for occlusion calculation
 */
function contactToRaycastTarget(contact: Contact): RaycastTarget {
  return {
    id: contact.id,
    position: contact.position,
    rotation: 0,
    scale: contact.radius,
    shape: createCircleShape(contact.id),
  };
}

/**
 * Calculate visibility for a contact considering occlusion from other objects
 * Returns { visibility: number, occludedBy?: string }
 */
function calculateContactVisibility(
  contact: Contact,
  shipPosition: Vector2,
  allContacts: Contact[]
): { visibility: number; occludedBy?: string } {
  // Build blocking targets (all contacts except this one)
  const blockingTargets = allContacts
    .filter(c => c.id !== contact.id)
    .map(contactToRaycastTarget);
  
  if (blockingTargets.length === 0) {
    return { visibility: 1 };
  }
  
  // Sample multiple points around the contact to determine visibility
  const sampleCount = 5;
  const sampleRadius = contact.radius * 0.8;
  let visibleCount = 0;
  let occluder: string | undefined;
  
  // Check center point
  if (hasLineOfSight(shipPosition, contact.position, blockingTargets)) {
    visibleCount++;
  }
  
  // Check sample points around the edge
  for (let i = 0; i < sampleCount; i++) {
    const angle = (i / sampleCount) * Math.PI * 2;
    const samplePoint: Vector2 = {
      x: contact.position.x + Math.cos(angle) * sampleRadius,
      y: contact.position.y + Math.sin(angle) * sampleRadius,
    };
    
    if (hasLineOfSight(shipPosition, samplePoint, blockingTargets)) {
      visibleCount++;
    }
  }
  
  const visibility = visibleCount / (sampleCount + 1);
  
  // Find which object is blocking (if any) - use raycast to find actual blocker
  if (visibility < 1) {
    const targetDistance = Math.hypot(
      contact.position.x - shipPosition.x,
      contact.position.y - shipPosition.y
    );
    
    // Cast ray to contact center and check what's actually blocking it
    const ray = createRay(shipPosition, contact.position);
    const hit = raycast(ray, blockingTargets, targetDistance);
    
    if (hit.hit && hit.objectId) {
      occluder = hit.objectId;
    }
  }
  
  return { visibility, occludedBy: occluder };
}

/**
 * Sensor store - manages sensor contacts and detection
 */
export const useSensorStore = defineStore('sensor', () => {
  // Contacts
  const contacts = ref<Contact[]>([]);
  
  // Internal state
  const timeSinceUpdate = ref(0);

  // Get sensor range from ship
  const sensorRange = computed(() => {
    const shipStore = useShipStore();
    return shipStore.sensors.range;
  });

  // Get update interval (could be made configurable via ship sensors)
  const updateInterval = computed(() => 0.5);

  // Computed
  const contactCount = computed(() => contacts.value.length);
  
  const sortedByDistance = computed(() => {
    return [...contacts.value].sort((a, b) => a.distance - b.distance);
  });

  const nearestContact = computed(() => {
    return sortedByDistance.value[0] ?? null;
  });

  const stationContacts = computed(() => {
    return contacts.value.filter(c => c.type === 'station');
  });

  const planetContacts = computed(() => {
    return contacts.value.filter(c => c.type === 'planet');
  });

  /**
   * Contacts that are fully or mostly visible (visibility >= 0.5)
   */
  const visibleContacts = computed(() => {
    return contacts.value.filter(c => c.visibility >= 0.5);
  });

  /**
   * Contacts that are partially or fully occluded (visibility < 1)
   */
  const occludedContacts = computed(() => {
    return contacts.value.filter(c => c.visibility < 1);
  });

  /**
   * Contacts that are fully occluded (visibility === 0)
   */
  const fullyOccludedContacts = computed(() => {
    return contacts.value.filter(c => c.visibility === 0);
  });

  const selectedContact = computed(() => {
    return contacts.value.find(c => c.isSelected) ?? null;
  });

  /**
   * Radar segments for proximity display with true angular extent raytracing
   */
  const radarSegments = computed((): RadarSegment[] => {
    const shipStore = useShipStore();
    const segmentCount = shipStore.sensors.segmentCount;
    const segmentSize = 360 / segmentCount;
    const shipPosition = shipStore.position;
    const segments: RadarSegment[] = [];
    const proxRange = proximityDisplayRange.value;

    // Pre-compute angular extents for all contacts (spatial culling already done in contacts)
    const contactExtents = contacts.value.map(contact => ({
      contact,
      extent: getObjectAngularExtent(contact.position, contact.radius, shipPosition),
    }));

    for (let i = 0; i < segmentCount; i++) {
      const startAngle = i * segmentSize;
      const endAngle = startAngle + segmentSize;

      // Find nearest contact whose angular extent overlaps this segment
      let nearestContact: RadarSegment['nearestContact'] = null;
      let minEdgeDistance = Infinity;

      for (const { contact, extent } of contactExtents) {
        if (extentOverlapsSegment(extent, startAngle, endAngle)) {
          if (extent.edgeDistance < minEdgeDistance) {
            minEdgeDistance = extent.edgeDistance;
            nearestContact = {
              id: contact.id,
              name: contact.name,
              type: contact.type,
              distance: extent.edgeDistance, // Use edge distance, not center
              bearing: contact.bearing,
            };
          }
        }
      }

      segments.push({
        index: i,
        startAngle,
        endAngle,
        nearestContact,
        // Use proximity display range for threat calculation so objects within
        // proximity range are always visible on the radar overlay
        threatLevel: nearestContact
          ? getThreatLevelFromDistance(nearestContact.distance, proxRange)
          : 'none',
      });
    }

    return segments;
  });

  /**
   * Proximity display range (scaled for localized display around ship)
   */
  const proximityDisplayRange = computed(() => {
    const settingsStore = useSettingsStore();
    return sensorRange.value * settingsStore.proximityDisplayScale;
  });

  // Actions
  function selectContact(contactId: string) {
    contacts.value = contacts.value.map(c => ({
      ...c,
      isSelected: c.id === contactId,
    }));
  }

  function clearSelection() {
    contacts.value = contacts.value.map(c => ({
      ...c,
      isSelected: false,
    }));
  }

  function refreshContacts() {
    const shipStore = useShipStore();
    const navStore = useNavigationStore();
    const shipPosition = shipStore.position;
    const range = sensorRange.value;

    // Find max object radius for spatial culling (include star)
    const starRadius = navStore.currentSystem?.star?.radius ?? 0;
    const stationVisualRadii = navStore.stations.map(s => getStationVisualBoundingRadius(s));
    const maxObjectRadius = Math.max(
      starRadius,
      ...navStore.planets.map(p => p.radius),
      ...stationVisualRadii,
      50 // Default minimum
    );
    const cullRange = range + maxObjectRadius;

    const newContacts: Contact[] = [];

    // Add star contact (at origin)
    if (navStore.currentSystem?.star) {
      const star = navStore.currentSystem.star;
      const starPosition = { x: 0, y: 0 }; // Stars are at system origin
      const dx = shipPosition.x - starPosition.x;
      const dy = shipPosition.y - starPosition.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= cullRange * cullRange) {
        const existing = contacts.value.find(c => c.id === star.id);
        const contact = createContact({
          id: star.id,
          type: 'star',
          name: star.name,
          position: starPosition,
          shipPosition,
          radius: star.radius,
        });
        contact.isSelected = existing?.isSelected ?? false;
        newContacts.push(contact);
      }
    }

    // Add station contacts
    for (const station of navStore.stations) {
      // Get the actual visual bounding radius of the station (includes all modules)
      const visualRadius = getStationVisualBoundingRadius(station);
      
      const dx = shipPosition.x - station.position.x;
      const dy = shipPosition.y - station.position.y;
      const distSq = dx * dx + dy * dy;
      
      // Spatial culling: skip if center is beyond cull range (using visual radius)
      if (distSq > (cullRange + visualRadius) * (cullRange + visualRadius)) continue;

      const existing = contacts.value.find(c => c.id === station.id);
      const contact = createContact({
        id: station.id,
        type: 'station',
        name: station.name,
        position: station.position,
        shipPosition,
        radius: visualRadius, // Use actual visual bounding radius, not just docking range
      });
      contact.isSelected = existing?.isSelected ?? false;
      newContacts.push(contact);
    }

    // Add planet contacts
    for (const planet of navStore.planets) {
      const dx = shipPosition.x - planet.position.x;
      const dy = shipPosition.y - planet.position.y;
      const distSq = dx * dx + dy * dy;
      
      // Spatial culling
      if (distSq > cullRange * cullRange) continue;

      const existing = contacts.value.find(c => c.id === planet.id);
      const contact = createContact({
        id: planet.id,
        type: 'planet',
        name: planet.name,
        position: planet.position,
        shipPosition,
        radius: planet.radius,
      });
      contact.isSelected = existing?.isSelected ?? false;
      newContacts.push(contact);
    }

    // Add jump gate contacts
    for (const gate of navStore.jumpGates) {
      const dx = shipPosition.x - gate.position.x;
      const dy = shipPosition.y - gate.position.y;
      const distSq = dx * dx + dy * dy;
      
      // Spatial culling
      if (distSq > cullRange * cullRange) continue;

      const existing = contacts.value.find(c => c.id === gate.id);
      const contact = createContact({
        id: gate.id,
        type: 'jump-gate',
        name: gate.name,
        position: gate.position,
        shipPosition,
        radius: 30, // Default size for jump gates
      });
      contact.isSelected = existing?.isSelected ?? false;
      newContacts.push(contact);
    }

    // Calculate occlusion for each contact using raycasting
    // Calculate visibility for each contact
    for (const contact of newContacts) {
      const { visibility, occludedBy } = calculateContactVisibility(
        contact,
        shipPosition,
        newContacts
      );
      contact.visibility = visibility;
      contact.occludedBy = occludedBy;
    }

    contacts.value = newContacts;
  }

  function updateContactDistances() {
    const shipStore = useShipStore();
    const shipPosition = shipStore.position;

    contacts.value = contacts.value.map(contact => 
      updateContactRelative(contact, shipPosition)
    );
  }

  function update(gameTime: GameTime) {
    if (gameTime.paused) return;

    timeSinceUpdate.value += gameTime.deltaTime;

    // Update distances every frame for smooth display
    updateContactDistances();

    // Full refresh at intervals
    if (timeSinceUpdate.value >= updateInterval.value) {
      refreshContacts();
      timeSinceUpdate.value = 0;
    }
  }

  function reset() {
    contacts.value = [];
    timeSinceUpdate.value = 0;
  }

  return {
    // State
    contacts,
    sensorRange,
    // Computed
    contactCount,
    sortedByDistance,
    nearestContact,
    stationContacts,
    planetContacts,
    visibleContacts,
    occludedContacts,
    fullyOccludedContacts,
    selectedContact,
    radarSegments,
    proximityDisplayRange,
    // Actions
    selectContact,
    clearSelection,
    refreshContacts,
    update,
    reset,
  };
});
