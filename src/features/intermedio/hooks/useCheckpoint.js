import { ref, computed, watch } from 'vue';
import { useOnline } from '@vueuse/core';
import {
  storeCheckpointPass, updateCheckpointPass, deleteCheckpointPass,
  offlineSync, retireRider, revertRetireRider, getInRaceRiders
} from '../services/checkpointService';
import { addPass, getPasses, clearPasses } from '../utils/indexedDB';
import { formatDeviceRaceTime } from '../../../core/time/raceTime';

/** Un solo punto medio físico — todos los celulares Intermedio usan este nombre. */
export const SHARED_CHECKPOINT_NAME = 'Control Intermedio';

localStorage.setItem('checkpoint_name', SHARED_CHECKPOINT_NAME);

const checkpointName = ref(SHARED_CHECKPOINT_NAME);
const activeCompetition = ref(null);
const selectedPhase = ref('practica');
const hasStart = ref(false);
const riders = ref([]);
const searchQuery = ref('');
const offlinePasses = ref([]);
/** Historial de mesa compartida (local + otros celulares). */
const historyPasses = ref([]);
const showCheckModal = ref(false);
const lastCheckedRider = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
/** Placa que acaba de marcar otro celular (flash UI). */
const remoteFlashPlate = ref(null);
/** Aviso de sync multi-dispositivo para toast en scanner. */
const meshNotice = ref(null);

const pendingPlates = new Set();
let remoteFlashTimer = null;
let meshNoticeTimer = null;

const isOnline = useOnline();

watch(isOnline, (online) => {
  if (online && offlinePasses.value.length > 0) {
    syncOfflineQueue();
  }
});

function sameCheckpoint(name) {
  return String(name || '').toUpperCase() === SHARED_CHECKPOINT_NAME.toUpperCase();
}

function samePhase(phase) {
  return String(phase || '') === selectedPhase.value;
}

function hasRiderPassed(rider) {
  if (!rider || !rider.checkpoint_passes) return false;
  return rider.checkpoint_passes.some(
    (p) => sameCheckpoint(p.checkpoint_name) && samePhase(p.phase)
  );
}

function markRiderPassedLocal(rider, exactTime, phase = selectedPhase.value) {
  if (!rider) return;
  if (!rider.checkpoint_passes) rider.checkpoint_passes = [];
  const already = rider.checkpoint_passes.some(
    (p) => sameCheckpoint(p.checkpoint_name) && String(p.phase) === String(phase)
  );
  if (!already) {
    rider.checkpoint_passes.push({
      checkpoint_name: SHARED_CHECKPOINT_NAME,
      phase,
      exact_time: exactTime,
    });
  }
}

function pushHistory(entry) {
  const plate = parseInt(entry.plate_number, 10);
  const phase = entry.phase || selectedPhase.value;
  // Evitar duplicar misma placa+fase en el feed
  historyPasses.value = historyPasses.value.filter(
    (h) => !(parseInt(h.plate_number, 10) === plate && (h.phase || selectedPhase.value) === phase)
  );
  historyPasses.value.unshift({
    id: entry.id ?? `tmp_${plate}_${Date.now()}`,
    plate_number: plate,
    full_name: entry.full_name || 'Desconocido',
    exact_time: entry.exact_time,
    phase,
    isOffline: !!entry.isOffline,
    source: entry.source || 'local', // local | remote | offline
  });
  historyPasses.value = historyPasses.value.slice(0, 12);
}

function flashRemotePlate(plate) {
  remoteFlashPlate.value = parseInt(plate, 10);
  if (remoteFlashTimer) clearTimeout(remoteFlashTimer);
  remoteFlashTimer = setTimeout(() => {
    remoteFlashPlate.value = null;
  }, 2200);
}

function showMeshNotice(message, type = 'info') {
  meshNotice.value = { message, type, at: Date.now() };
  if (meshNoticeTimer) clearTimeout(meshNoticeTimer);
  meshNoticeTimer = setTimeout(() => {
    meshNotice.value = null;
  }, 3200);
}

function seedHistoryFromRiders(list) {
  if (historyPasses.value.length > 0) return;

  const entries = [];
  for (const rider of list || []) {
    if (!hasRiderPassed(rider)) continue;
    const pass = (rider.checkpoint_passes || []).find(
      (p) => sameCheckpoint(p.checkpoint_name) && samePhase(p.phase)
    );
    if (!pass) continue;
    entries.push({
      id: pass.id || `seed_${rider.plate_number}`,
      plate_number: rider.plate_number,
      full_name: rider.full_name,
      exact_time: pass.exact_time,
      phase: pass.phase || selectedPhase.value,
      isOffline: false,
      source: 'remote',
    });
  }

  entries.sort((a, b) => String(b.exact_time || '').localeCompare(String(a.exact_time || '')));
  historyPasses.value = entries.slice(0, 12);
}

function isAlreadyRegisteredError(err) {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  if (status === 409 || code === 'ALREADY_REGISTERED') return true;
  const msg = String(err?.friendlyMessage || err?.response?.data?.message || '').toLowerCase();
  return msg.includes('ya tiene una marca') || msg.includes('ya fue marcado') || msg.includes('ya registrado');
}

function isNetworkError(err) {
  if (!err) return true;
  if (!err.response) return true; // timeout / offline / CORS
  const status = err.response.status;
  return status >= 500;
}

export function useCheckpoint() {
  const ridersInRace = computed(() => {
    return riders.value.filter((r) => {
      const matchesSearch =
        searchQuery.value.trim() === '' ||
        r.plate_number.toString().includes(searchQuery.value) ||
        r.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch && r.race_status === 'en_carrera';
    });
  });

  const ridersAll = computed(() => {
    return riders.value.filter((r) => {
      const matchesSearch =
        searchQuery.value.trim() === '' ||
        r.plate_number.toString().includes(searchQuery.value) ||
        r.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch && r.race_status === 'en_carrera';
    });
  });

  const ridersPending = computed(() => ridersAll.value.filter((r) => !hasRiderPassed(r)));
  const ridersArrived = computed(() => ridersAll.value.filter((r) => hasRiderPassed(r)));

  const arrivedCount = computed(() =>
    riders.value.filter((r) => r.race_status === 'en_carrera' && hasRiderPassed(r)).length
  );
  const pendingCount = computed(() =>
    riders.value.filter((r) => r.race_status === 'en_carrera' && !hasRiderPassed(r)).length
  );

  async function loadInitialData({ soft = false } = {}) {
    if (!soft) isLoading.value = true;
    try {
      const response = await getInRaceRiders();
      if (response && response.success) {
        hasStart.value = response.data.has_start;
        activeCompetition.value = response.data.competition;
        if (response.data.competition) {
          selectedPhase.value = response.data.competition.phase || 'practica';
        }
        riders.value = response.data.riders || [];
        seedHistoryFromRiders(riders.value);
      }
      await refreshOfflineCount();
    } catch (err) {
      if (!soft) errorMessage.value = 'Error al inicializar datos del checkpoint.';
    } finally {
      if (!soft) isLoading.value = false;
    }
  }

  async function loadRiders() {
    await loadInitialData({ soft: true });
  }

  async function refreshOfflineCount() {
    try {
      offlinePasses.value = await getPasses();
    } catch (err) {
      console.error('IndexedDB load error', err);
    }
  }

  /**
   * Aplica un pase llegado por WebSocket desde otro celular de la mesa.
   */
  function applyRemoteCheckpointPass(detail) {
    if (!detail) return false;
    if (!sameCheckpoint(detail.checkpoint_name)) return false;

    const phase = detail.phase || selectedPhase.value;
    if (detail.phase && !samePhase(detail.phase)) {
      // Si el evento trae fase y no coincide con la vista, igual marcar si es la fase activa del evento
      // (selectedPhase ya viene de competencia activa)
    }

    const plate = parseInt(detail.plate_number, 10);
    let rider =
      riders.value.find((r) => r.id === detail.rider_id) ||
      riders.value.find((r) => parseInt(r.plate_number, 10) === plate);

    if (!rider) {
      // Soft reload para no perder el pase si la lista aún no tenía al piloto
      loadRiders();
      pushHistory({
        id: detail.pass_id || `remote_${plate}`,
        plate_number: plate,
        full_name: detail.full_name || 'Desconocido',
        exact_time: detail.exact_time,
        phase,
        source: 'remote',
      });
      flashRemotePlate(plate);
      return true;
    }

    if (hasRiderPassed(rider)) {
      // Ya estaba (marca local o sync previo) — no re-flashear
      return false;
    }

    markRiderPassedLocal(rider, detail.exact_time, phase || selectedPhase.value);

    if (String(detail.checkpoint_name || '').toUpperCase() === 'META') {
      rider.race_status = 'llego';
    }

    pushHistory({
      id: detail.pass_id || `remote_${plate}`,
      plate_number: plate,
      full_name: detail.full_name || rider.full_name,
      exact_time: detail.exact_time,
      phase: phase || selectedPhase.value,
      source: 'remote',
    });
    flashRemotePlate(plate);
    return true;
  }

  /**
   * @returns {Promise<{ ok: boolean, reason?: string, already?: boolean }>}
   */
  async function registerPass(plateNumber) {
    const plate = parseInt(plateNumber, 10);
    const rider = riders.value.find((r) => parseInt(r.plate_number, 10) === plate);

    lastCheckedRider.value = rider || {
      plate_number: plate,
      full_name: 'Corredor No Registrado',
    };
    showCheckModal.value = true;
    setTimeout(() => {
      showCheckModal.value = false;
    }, 2000);

    if (rider && hasRiderPassed(rider)) {
      showMeshNotice(`#${plate} ya estaba marcado en la mesa`, 'warn');
      return { ok: false, already: true, reason: 'already_local' };
    }

    if (pendingPlates.has(plate)) {
      return { ok: false, reason: 'pending' };
    }

    const timeStr = formatDeviceRaceTime();
    const passData = {
      plate_number: plate,
      checkpoint_name: SHARED_CHECKPOINT_NAME,
      phase: selectedPhase.value,
      exact_time: timeStr,
    };

    // Optimista local inmediato (los otros phones lo verán por WS)
    if (rider) markRiderPassedLocal(rider, timeStr);
    pendingPlates.add(plate);

    try {
      if (isOnline.value) {
        return await registerPassOnline(passData, rider);
      }
      await registerPassOffline(passData, rider);
      return { ok: true, reason: 'offline' };
    } finally {
      pendingPlates.delete(plate);
    }
  }

  async function registerPassOnline(passData, rider) {
    try {
      const createdPass = await storeCheckpointPass(passData);
      pushHistory({
        id: createdPass?.id,
        plate_number: passData.plate_number,
        full_name: rider?.full_name || 'Desconocido',
        exact_time: passData.exact_time,
        phase: passData.phase,
        source: 'local',
      });

      if (SHARED_CHECKPOINT_NAME.toUpperCase() === 'META' && rider) {
        rider.race_status = 'llego';
      }
      return { ok: true, reason: 'online' };
    } catch (err) {
      if (isAlreadyRegisteredError(err)) {
        const data = err?.response?.data?.data;
        if (rider) markRiderPassedLocal(rider, data?.exact_time || passData.exact_time);
        else if (data) {
          applyRemoteCheckpointPass({
            ...data,
            full_name: data.full_name || rider?.full_name,
            checkpoint_name: data.checkpoint_name || SHARED_CHECKPOINT_NAME,
          });
        }
        pushHistory({
          id: data?.pass_id || `dup_${passData.plate_number}`,
          plate_number: passData.plate_number,
          full_name: data?.full_name || rider?.full_name || 'Desconocido',
          exact_time: data?.exact_time || passData.exact_time,
          phase: data?.phase || passData.phase,
          source: 'remote',
        });
        showMeshNotice(`#${passData.plate_number} ya lo marcó otro celular`, 'warn');
        return { ok: false, already: true, reason: 'already_remote' };
      }

      // Solo red/5xx → cola offline
      if (isNetworkError(err) || !isOnline.value) {
        await registerPassOffline(passData, rider);
        return { ok: true, reason: 'offline_fallback' };
      }

      // Otros 4xx: revertir optimista
      if (rider?.checkpoint_passes) {
        rider.checkpoint_passes = rider.checkpoint_passes.filter(
          (p) =>
            !(
              sameCheckpoint(p.checkpoint_name) &&
              samePhase(p.phase) &&
              p.exact_time === passData.exact_time
            )
        );
      }
      showMeshNotice(err.friendlyMessage || 'No se pudo registrar el pase', 'error');
      return { ok: false, reason: 'error' };
    }
  }

  async function registerPassOffline(passData, rider) {
    await addPass(passData);
    await refreshOfflineCount();
    pushHistory({
      id: `local_${Date.now()}`,
      plate_number: passData.plate_number,
      full_name: rider?.full_name || 'Desconocido',
      exact_time: passData.exact_time,
      phase: passData.phase,
      isOffline: true,
      source: 'offline',
    });
    showMeshNotice('Sin red · guardado en este celular', 'warn');
  }

  async function syncOfflineQueue() {
    if (!isOnline.value || offlinePasses.value.length === 0) return;
    isLoading.value = true;
    try {
      const rawItems = offlinePasses.value.map((p) => ({
        plate_number: p.plate_number,
        checkpoint_name: SHARED_CHECKPOINT_NAME,
        local_capture_time: p.exact_time,
        phase: p.phase,
      }));
      await offlineSync(rawItems);
      await clearPasses();
      await refreshOfflineCount();
      historyPasses.value.forEach((h) => {
        if (h.isOffline) {
          h.isOffline = false;
          if (h.source === 'offline') h.source = 'local';
        }
      });
      await loadRiders();
      showMeshNotice('Cola offline sincronizada', 'info');
    } catch (err) {
      errorMessage.value = 'Fallo al sincronizar lote offline.';
    } finally {
      isLoading.value = false;
    }
  }

  async function retireRiderDNF(riderId) {
    try {
      await retireRider(riderId, SHARED_CHECKPOINT_NAME);
      const rIdx = riders.value.findIndex((r) => r.id === riderId);
      if (rIdx !== -1) riders.value[rIdx].race_status = 'DNF';
    } catch (err) {
      alert('Error al reportar DNF.');
    }
  }

  async function revertRiderDNF(riderId) {
    try {
      await revertRetireRider(riderId);
      const rIdx = riders.value.findIndex((r) => r.id === riderId);
      if (rIdx !== -1) riders.value[rIdx].race_status = 'en_carrera';
    } catch (err) {
      alert('Error al revertir DNF.');
    }
  }

  async function editPassPlate(passId, newPlate) {
    if (typeof passId === 'string' && String(passId).startsWith('local_')) {
      alert('Las marcas locales fuera de línea no se pueden editar hasta sincronizarse.');
      return;
    }
    try {
      await updateCheckpointPass(passId, newPlate);
      const idx = historyPasses.value.findIndex((h) => h.id === passId);
      if (idx !== -1) {
        historyPasses.value[idx].plate_number = newPlate;
        const r = riders.value.find((r) => parseInt(r.plate_number, 10) === parseInt(newPlate, 10));
        historyPasses.value[idx].full_name = r ? r.full_name : 'Reasignado';
      }
      await loadRiders();
    } catch (err) {
      alert('Error al reasignar placa.');
    }
  }

  async function deletePassRecord(passId) {
    if (typeof passId === 'string' && String(passId).startsWith('local_')) {
      alert('No se puede borrar marcas offline.');
      return;
    }
    try {
      await deleteCheckpointPass(passId);
      historyPasses.value = historyPasses.value.filter((h) => h.id !== passId);
      await loadRiders();
    } catch (err) {
      alert('Error al eliminar registro.');
    }
  }

  return {
    checkpointName,
    activeCompetition,
    selectedPhase,
    riders,
    hasStart,
    searchQuery,
    offlinePasses,
    historyPasses,
    showCheckModal,
    lastCheckedRider,
    isLoading,
    errorMessage,
    isOnline,
    ridersInRace,
    ridersAll,
    ridersPending,
    ridersArrived,
    arrivedCount,
    pendingCount,
    remoteFlashPlate,
    meshNotice,
    loadInitialData,
    loadRiders,
    registerPass,
    applyRemoteCheckpointPass,
    syncOfflineQueue,
    retireRiderDNF,
    revertRiderDNF,
    editPassPlate,
    deletePassRecord,
    hasRiderPassed,
  };
}
