import { ref, computed, watch } from 'vue';
import {
  freezeTime, getQueue, assignPlate, annulTime, clearAllPendingTimes
} from '../services/metaService';
import { getActiveCompetition, getRidersByCategory } from '../../partida/services/partidaService';

const activeCompetition = ref(null);
const finishTimeQueue = ref([]);
const riders = ref([]); // Flat list of all riders
const isLoading = ref(false);
const errorMessage = ref('');

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

  function getFormattedCurrentTime() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  }

  async function triggerBlindTime() {
    if (!activeCompetition.value) return;
    const timeStr = getFormattedCurrentTime();
    try {
      const createdItem = await freezeTime({
        competition_id: activeCompetition.value.id,
        blind_timestamp: timeStr
      });
      // Add locally if not present (websocket will also trigger this)
      addQueueItemLocally(createdItem);
    } catch (err) {
      errorMessage.value = 'Fallo al enviar la marca de tiempo.';
    }
  }

  function addQueueItemLocally(item) {
    const exists = finishTimeQueue.value.some(q => q.id === item.id);
    if (!exists) {
      finishTimeQueue.value.push(item);
      // Sort ascending by blind_timestamp
      finishTimeQueue.value.sort((a, b) => new Date(a.blind_timestamp) - new Date(b.blind_timestamp));
    }
  }

  async function assignBlindTime(queueId, plateNumber) {
    isLoading.value = true;
    try {
      await assignPlate(queueId, plateNumber);
      // Remove from local queue
      finishTimeQueue.value = finishTimeQueue.value.filter(q => q.id !== queueId);
      // Refresh riders list
      const ridersList = await getRidersByCategory('');
      riders.value = ridersList || [];
    } catch (err) {
      alert(err.response?.data?.message || 'Error al asignar la placa.');
    } finally {
      isLoading.value = false;
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
    // A rider finished, meaning its queue item has been assigned
    // We should filter out any matching item by exact_time
    // Since exactTime matches the stored blind_timestamp
    finishTimeQueue.value = finishTimeQueue.value.filter(q => {
      // Compare dates by timestamp
      const qTime = new Date(q.blind_timestamp).getTime();
      const eventTime = new Date(exactTime).getTime();
      return Math.abs(qTime - eventTime) > 50; // allow small tolerance
    });
  }

  return {
    activeCompetition, finishTimeQueue, riders, isLoading, errorMessage,
    loadInitialData, refreshQueue, triggerBlindTime, addQueueItemLocally,
    assignBlindTime, annulBlindTime, purgeQueue, handleRiderFinishedEvent
  };
}
