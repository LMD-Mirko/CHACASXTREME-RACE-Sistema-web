import { ref, computed, watch } from 'vue';
import {
  freezeTime, getQueue, assignPlate, annulTime, clearAllPendingTimes
} from '../services/metaService';
import { getActiveCompetition } from '../../partida/services/partidaService';

const activeCompetition = ref(null);
const finishTimeQueue = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

export function useMeta() {
  async function loadInitialData() {
    isLoading.value = true;
    try {
      activeCompetition.value = await getActiveCompetition();
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
    return new Date().toISOString().replace('T', ' ').substring(0, 23);
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
    activeCompetition, finishTimeQueue, isLoading, errorMessage,
    loadInitialData, refreshQueue, triggerBlindTime, addQueueItemLocally,
    assignBlindTime, annulBlindTime, purgeQueue, handleRiderFinishedEvent
  };
}
