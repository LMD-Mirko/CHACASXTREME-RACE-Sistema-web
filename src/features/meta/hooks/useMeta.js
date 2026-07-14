import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  freezeTime, getQueue, assignPlate, annulTime, clearAllPendingTimes
} from '../services/metaService';
import { getActiveCompetition, getRidersByCategory } from '../../partida/services/partidaService';
import { formatDeviceRaceTime, parseRaceTimeToEpoch } from '../../../core/time/raceTime';
import { wsStatus } from '../../../core/network/wsStatus';

const activeCompetition = ref(null);
const finishTimeQueue = ref([]);
const riders = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

let queuePollTimer = null;

export function useMeta() {
  async function loadInitialData() {
    isLoading.value = true;
    try {
      activeCompetition.value = await getActiveCompetition();
      if (activeCompetition.value) {
        const ridersList = await getRidersByCategory('');
        riders.value = ridersList || [];
      }
      await refreshQueue();
    } catch (err) {
      errorMessage.value = 'Error al rehidratar la cola de Meta.';
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshQueue() {
    try {
      const pendingItems = await getQueue({ status: 'pendiente' });
      finishTimeQueue.value = pendingItems || [];
    } catch (err) {
      console.error('Error fetching queue', err);
    }
  }

  function startQueuePollingFallback() {
    stopQueuePollingFallback();
    queuePollTimer = setInterval(() => {
      if (wsStatus.value !== 'connected') {
        refreshQueue();
      }
    }, 4000);
  }

  function stopQueuePollingFallback() {
    if (queuePollTimer) {
      clearInterval(queuePollTimer);
      queuePollTimer = null;
    }
  }

  async function triggerBlindTime() {
    if (!activeCompetition.value) return;
    const timeStr = formatDeviceRaceTime();
    try {
      const createdItem = await freezeTime({
        competition_id: activeCompetition.value.id,
        blind_timestamp: timeStr
      });
      addQueueItemLocally(createdItem);
      errorMessage.value = '';
    } catch (err) {
      errorMessage.value = err.friendlyMessage || 'Fallo al enviar la marca de tiempo.';
    }
  }

  function addQueueItemLocally(item) {
    const exists = finishTimeQueue.value.some(q => q.id === item.id);
    if (!exists) {
      finishTimeQueue.value.push(item);
      finishTimeQueue.value.sort((a, b) => {
        const aMs = parseRaceTimeToEpoch(a.blind_timestamp) ?? 0;
        const bMs = parseRaceTimeToEpoch(b.blind_timestamp) ?? 0;
        return aMs - bMs;
      });
    }
  }

  async function assignBlindTime(queueId, plateNumber) {
    isLoading.value = true;
    try {
      await assignPlate(queueId, plateNumber);
      finishTimeQueue.value = finishTimeQueue.value.filter(q => q.id !== queueId);
      const ridersList = await getRidersByCategory('');
      riders.value = ridersList || [];
    } catch (err) {
      alert(err.response?.data?.message || err.friendlyMessage || 'Error al asignar la placa.');
    } finally {
      isLoading.value = false;
    }
  }

  /** Meta QR: congela tiempo + asigna placa en un solo gesto (tras confirmar). */
  async function registerFinishFromQr(rider) {
    if (!activeCompetition.value) {
      return { ok: false, message: 'No hay competencia activa' };
    }
    if (!rider?.plate_number) {
      return { ok: false, message: 'Sin placa' };
    }

    const plate = parseInt(rider.plate_number, 10);
    const already = riders.value.find((r) => parseInt(r.plate_number, 10) === plate);
    if (already && String(already.race_status || '').toLowerCase() === 'llego') {
      return { ok: true, already: true, message: 'Ya había llegado' };
    }

    const timeStr = formatDeviceRaceTime();
    try {
      const createdItem = await freezeTime({
        competition_id: activeCompetition.value.id,
        blind_timestamp: timeStr,
      });
      await assignPlate(createdItem.id, plate);
      finishTimeQueue.value = finishTimeQueue.value.filter((q) => q.id !== createdItem.id);
      const ridersList = await getRidersByCategory('');
      riders.value = ridersList || [];
      errorMessage.value = '';
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: err.response?.data?.message || err.friendlyMessage || 'No se pudo registrar llegada',
      };
    }
  }

  async function annulBlindTime(queueId) {
    try {
      await annulTime(queueId);
      finishTimeQueue.value = finishTimeQueue.value.filter(q => q.id !== queueId);
    } catch (err) {
      alert('Error al anular la marca.');
    }
  }

  async function purgeQueue() {
    if (confirm('¿Estás seguro de anular TODOS los tiempos pendientes en la cola?')) {
      try {
        await clearAllPendingTimes();
        finishTimeQueue.value = [];
      } catch (err) {
        alert('Error al limpiar la cola.');
      }
    }
  }

  function handleRiderFinishedEvent(exactTime) {
    finishTimeQueue.value = finishTimeQueue.value.filter(q => {
      const qTime = parseRaceTimeToEpoch(q.blind_timestamp) ?? 0;
      const eventTime = parseRaceTimeToEpoch(exactTime) ?? 0;
      return Math.abs(qTime - eventTime) > 50;
    });
  }

  onMounted(() => {
    startQueuePollingFallback();
  });

  onBeforeUnmount(() => {
    stopQueuePollingFallback();
  });

  return {
    activeCompetition, finishTimeQueue, riders, isLoading, errorMessage,
    loadInitialData, refreshQueue, triggerBlindTime, addQueueItemLocally,
    assignBlindTime, registerFinishFromQr, annulBlindTime, purgeQueue, handleRiderFinishedEvent
  };
}
