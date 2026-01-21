import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Contact } from '@/models';
import { createContact, updateContactRelative, vec2Distance } from '@/models';
import { useShipStore } from './shipStore';
import { useNavigationStore } from './navigationStore';
import type { GameTime } from '@/core/game-loop';

/**
 * Sensor store - manages sensor contacts and detection
 */
export const useSensorStore = defineStore('sensor', () => {
  // Contacts
  const contacts = ref<Contact[]>([]);
  
  // Sensor properties
  const sensorRange = ref(2000); // Maximum detection range
  const updateInterval = ref(0.5); // How often to refresh contacts (seconds)
  
  // Internal state
  const timeSinceUpdate = ref(0);

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

    const newContacts: Contact[] = [];

    // Add station contacts
    for (const station of navStore.stations) {
      const distance = vec2Distance(shipPosition, station.position);
      if (distance <= sensorRange.value) {
        const existing = contacts.value.find(c => c.id === station.id);
        const contact = createContact({
          id: station.id,
          type: 'station',
          name: station.name,
          position: station.position,
          shipPosition,
        });
        contact.isSelected = existing?.isSelected ?? false;
        newContacts.push(contact);
      }
    }

    // Add planet contacts
    for (const planet of navStore.planets) {
      const distance = vec2Distance(shipPosition, planet.position);
      if (distance <= sensorRange.value) {
        const existing = contacts.value.find(c => c.id === planet.id);
        const contact = createContact({
          id: planet.id,
          type: 'planet',
          name: planet.name,
          position: planet.position,
          shipPosition,
        });
        contact.isSelected = existing?.isSelected ?? false;
        newContacts.push(contact);
      }
    }

    // Add jump gate contacts
    for (const gate of navStore.jumpGates) {
      const distance = vec2Distance(shipPosition, gate.position);
      if (distance <= sensorRange.value) {
        const existing = contacts.value.find(c => c.id === gate.id);
        const contact = createContact({
          id: gate.id,
          type: 'jump-gate',
          name: gate.name,
          position: gate.position,
          shipPosition,
        });
        contact.isSelected = existing?.isSelected ?? false;
        newContacts.push(contact);
      }
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
    // Actions
    selectContact,
    clearSelection,
    refreshContacts,
    update,
    reset,
  };
});
