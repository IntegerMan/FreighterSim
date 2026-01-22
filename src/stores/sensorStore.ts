import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Contact, RadarSegment, Vector2 } from '@/models';
import { createContact, updateContactRelative, getThreatLevelFromDistance } from '@/models';
import { useShipStore } from './shipStore';
import { useNavigationStore } from './navigationStore';
import { useSettingsStore } from './settingsStore';
import type { GameTime } from '@/core/game-loop';

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
  
  // Bearing to center
  let centerBearing = Math.atan2(dy, dx) * (180 / Math.PI);
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
    const range = sensorRange.value;
    const shipPosition = shipStore.position;
    const segments: RadarSegment[] = [];

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
        threatLevel: nearestContact
          ? getThreatLevelFromDistance(nearestContact.distance, range)
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
    const maxObjectRadius = Math.max(
      starRadius,
      ...navStore.planets.map(p => p.radius),
      ...navStore.stations.map(s => s.dockingRange),
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
      const dx = shipPosition.x - station.position.x;
      const dy = shipPosition.y - station.position.y;
      const distSq = dx * dx + dy * dy;
      
      // Spatial culling: skip if center is beyond cull range
      if (distSq > cullRange * cullRange) continue;

      const existing = contacts.value.find(c => c.id === station.id);
      const contact = createContact({
        id: station.id,
        type: 'station',
        name: station.name,
        position: station.position,
        shipPosition,
        radius: station.dockingRange, // Use docking range as station "size"
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
