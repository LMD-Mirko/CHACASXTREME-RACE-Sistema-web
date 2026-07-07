import { ref, computed, watch, onMounted } from 'vue';
import { useOnline } from '@vueuse/core';
import {
  storeCheckpointPass, updateCheckpointPass, deleteCheckpointPass,
  offlineSync, retireRider, revertRetireRider, getInRaceRiders
} from '../services/checkpointService';
import { addPass, getPasses, deletePass, clearPasses } from '../utils/indexedDB';

// Global shared state for intermediate checkpoint
const checkpointName = ref(localStorage.getItem('checkpoint_name') || 'Control Intermedio');
const activeCompetition = ref(null);
const selectedPhase = ref('practica');
const hasStart = ref(false);
const riders = ref([]);
const searchQuery = ref('');
const offlinePasses = ref([]);
const historyPasses = ref([]); // Last 5 passes recorded
const showCheckModal = ref(false);
const lastCheckedRider = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');

const isOnline = useOnline();

// Auto sync when online detects back connectivity
watch(isOnline, (online) => {
  if (online && offlinePasses.value.length > 0) {
    syncOfflineQueue();
  }
});

// Watch checkpoint name to persist
watch(checkpointName, (newVal) => {
  localStorage.setItem('checkpoint_name', newVal);
});

export function useCheckpoint() {
  const ridersInRace = computed(() => {
    return riders.value.filter(r => {
      const matchesSearch = searchQuery.value.trim() === '' ||
        r.plate_number.toString().includes(searchQuery.value) ||
        r.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch && r.race_status === 'en_carrera';
    });
  });

  async function loadInitialData() {
    isLoading.value = true;
    try {
      const response = await getInRaceRiders();
      if (response && response.success) {
        hasStart.value = response.data.has_start;
        activeCompetition.value = response.data.competition;
        if (response.data.competition) {
          selectedPhase.value = response.data.competition.phase || 'practica';
        }
        riders.value = response.data.riders || [];
      }
      await refreshOfflineCount();
    } catch (err) {
      errorMessage.value = 'Error al inicializar datos del checkpoint.';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadRiders() {
    await loadInitialData();
  }

  async function refreshOfflineCount() {
    try {
      offlinePasses.value = await getPasses();
    } catch (err) {
      console.error('IndexedDB load error', err);
    }
  }

  // Helper to check if a rider has passed the current checkpoint in the active phase
  function hasRiderPassed(rider) {
    if (!rider || !rider.checkpoint_passes) return false;
    return rider.checkpoint_passes.some(p => 
      p.checkpoint_name.toUpperCase() === checkpointName.value.toUpperCase() &&
      p.phase === selectedPhase.value
    );
  }

  const ridersAll = computed(() => {
    return riders.value.filter(r => {
      const matchesSearch = searchQuery.value.trim() === '' ||
        r.plate_number.toString().includes(searchQuery.value) ||
        r.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch && r.race_status === 'en_carrera';
    });
  });

  const ridersPending = computed(() => {
    return ridersAll.value.filter(r => !hasRiderPassed(r));
  });

  const ridersArrived = computed(() => {
    return ridersAll.value.filter(r => hasRiderPassed(r));
  });

  function getFormattedCurrentTime() {
    const d = new Date();
    const pad = (num, size) => String(num).padStart(size, '0');
    
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1, 2);
    const day = pad(d.getDate(), 2);
    const hours = pad(d.getHours(), 2);
    const minutes = pad(d.getMinutes(), 2);
    const seconds = pad(d.getSeconds(), 2);
    const ms = pad(d.getMilliseconds(), 3);
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  }

  async function registerPass(plateNumber) {
    const timeStr = getFormattedCurrentTime();
    const rider = riders.value.find(r => parseInt(r.plate_number) === parseInt(plateNumber));
    
    // Setup modal confirmation trigger
    lastCheckedRider.value = rider || { plate_number: plateNumber, full_name: 'Corredor No Registrado' };
    showCheckModal.value = true;
    setTimeout(() => { showCheckModal.value = false; }, 2000);

    const passData = {
      plate_number: parseInt(plateNumber),
      checkpoint_name: checkpointName.value,
      phase: selectedPhase.value,
      exact_time: timeStr
    };

    // Agregar localmente el pase al competidor para reactividad inmediata en la UI
    if (rider) {
      if (!rider.checkpoint_passes) {
        rider.checkpoint_passes = [];
      }
      // Evitar duplicados locales
      const alreadyHas = rider.checkpoint_passes.some(p => 
        p.checkpoint_name.toUpperCase() === checkpointName.value.toUpperCase() &&
        p.phase === selectedPhase.value
      );
      if (!alreadyHas) {
        rider.checkpoint_passes.push({
          checkpoint_name: checkpointName.value,
          phase: selectedPhase.value,
          exact_time: timeStr
        });
      }
    }

    if (isOnline.value) {
      await registerPassOnline(passData, rider);
    } else {
      await registerPassOffline(passData, rider);
    }
  }

  async function registerPassOnline(passData, rider) {
    try {
      const createdPass = await storeCheckpointPass(passData);
      // Add to history
      historyPasses.value.unshift({
        id: createdPass.id,
        plate_number: passData.plate_number,
        full_name: rider?.full_name || 'Desconocido',
        exact_time: passData.exact_time,
        isOffline: false
      });
      historyPasses.value = historyPasses.value.slice(0, 5);
      
      // If meta, change locally to llego, otherwise keep en_carrera but we can flag as passed locally
      if (checkpointName.value.toUpperCase() === 'META' && rider) {
        rider.race_status = 'llego';
      }
    } catch (err) {
      // Fallback to offline if API fails
      await registerPassOffline(passData, rider);
    }
  }

  async function registerPassOffline(passData, rider) {
    await addPass(passData);
    await refreshOfflineCount();
    historyPasses.value.unshift({
      id: 'local_' + Date.now(),
      plate_number: passData.plate_number,
      full_name: rider?.full_name || 'Desconocido',
      exact_time: passData.exact_time,
      isOffline: true
    });
    historyPasses.value = historyPasses.value.slice(0, 5);
  }

  async function syncOfflineQueue() {
    if (!isOnline.value || offlinePasses.value.length === 0) return;
    isLoading.value = true;
    try {
      const rawItems = offlinePasses.value.map(p => ({
        plate_number: p.plate_number,
        checkpoint_name: p.checkpoint_name,
        local_capture_time: p.exact_time,
        phase: p.phase
      }));
      await offlineSync(rawItems);
      await clearPasses();
      await refreshOfflineCount();
      // Update history offline flags
      historyPasses.value.forEach(h => {
        if (h.isOffline) h.isOffline = false;
      });
    } catch (err) {
      errorMessage.value = 'Fallo al sincronizar lote offline.';
    } finally {
      isLoading.value = false;
    }
  }

  async function retireRiderDNF(riderId) {
    try {
      const updated = await retireRider(riderId, checkpointName.value);
      const rIdx = riders.value.findIndex(r => r.id === riderId);
      if (rIdx !== -1) riders.value[rIdx].race_status = 'DNF';
    } catch (err) {
      alert('Error al reportar DNF.');
    }
  }

  async function revertRiderDNF(riderId) {
    try {
      await revertRetireRider(riderId);
      const rIdx = riders.value.findIndex(r => r.id === riderId);
      if (rIdx !== -1) riders.value[rIdx].race_status = 'en_carrera';
    } catch (err) {
      alert('Error al revertir DNF.');
    }
  }

  async function editPassPlate(passId, newPlate) {
    if (typeof passId === 'string' && passId.startsWith('local_')) {
      alert('Las marcas locales fuera de línea no se pueden editar hasta sincronizarse.');
      return;
    }
    try {
      await updateCheckpointPass(passId, newPlate);
      const idx = historyPasses.value.findIndex(h => h.id === passId);
      if (idx !== -1) {
        historyPasses.value[idx].plate_number = newPlate;
        // Find name
        const r = riders.value.find(r => parseInt(r.plate_number) === parseInt(newPlate));
        historyPasses.value[idx].full_name = r ? r.full_name : 'Reasignado';
      }
    } catch (err) {
      alert('Error al reasignar placa.');
    }
  }

  async function deletePassRecord(passId) {
    if (typeof passId === 'string' && passId.startsWith('local_')) {
      alert('No se puede borrar marcas offline.');
      return;
    }
    try {
      await deleteCheckpointPass(passId);
      historyPasses.value = historyPasses.value.filter(h => h.id !== passId);
    } catch (err) {
      alert('Error al eliminar registro.');
    }
  }

  return {
    checkpointName, activeCompetition, selectedPhase, riders, hasStart,
    searchQuery, offlinePasses, historyPasses, showCheckModal, lastCheckedRider,
    isLoading, errorMessage, isOnline, ridersInRace, ridersAll, ridersPending, ridersArrived,
    loadInitialData, loadRiders, registerPass, syncOfflineQueue,
    retireRiderDNF, revertRiderDNF, editPassPlate, deletePassRecord
  };
}
