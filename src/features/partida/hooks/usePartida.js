import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import {
  getActiveCompetition, getCategories, getRidersByCategory,
  triggerCategoryStart, resetCategoryStart, closeDeparture, updateRiderStatus,
  notifyRollCallStart
} from '../services/partidaService';

const activeCompetition = ref(null);
const categories = ref([]);
const selectedCategoryId = ref('');
const selectedPhase = ref('practica');
const riders = ref([]);
const searchQuery = ref('');
const isGridConfirmed = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const presentRiderIds = ref(new Set());
const lastCheckedRider = ref(null);
const showCheckModal = ref(false);
const raceState = ref('idle'); // 'idle', 'counting', 'active'
const countdown = ref(3);
const startTime = ref(null);
const startTimeStr = ref('');
const elapsedTimeMs = ref(0);
const currentStep = ref(1);
const isSyncingRiders = ref(false);
let animationFrameId = null;
let modalTimeout = null;

function parseServerTimeToEpoch(serverTimeStr) {
  if (!serverTimeStr) return null;
  // If the server string lacks timezone info, append 'Z' for UTC parsing
  let isoStr = serverTimeStr.trim();
  if (!isoStr.includes('T') && !isoStr.includes('Z') && !isoStr.includes('+')) {
    isoStr = isoStr.replace(' ', 'T') + 'Z';
  }
  const epoch = new Date(isoStr).getTime();
  return isNaN(epoch) ? null : epoch;
}

export function usePartida() {
  const isIdle = computed(() => raceState.value === 'idle');
  const isCounting = computed(() => raceState.value === 'counting');
  const isActive = computed(() => raceState.value === 'active');

  const activeRiders = computed(() => {
    return riders.value.filter(r => {
      const matchesSearch = searchQuery.value.trim() === '' || 
        r.plate_number.toString().includes(searchQuery.value) ||
        r.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch && r.race_status !== 'DNS';
    });
  });

  const dnsRiders = computed(() => riders.value.filter(r => r.race_status === 'DNS'));

  // Verifica si todos los corredores activos en grilla fueron confirmados como presentes
  const allActiveRidersPresent = computed(() => {
    const active = riders.value.filter(r => r.race_status !== 'DNS');
    if (active.length === 0) return false;
    return active.every(r => presentRiderIds.value.has(r.id));
  });

  async function loadInitialData() {
    isLoading.value = true;
    try {
      activeCompetition.value = await getActiveCompetition();
      const fetchedCategories = await getCategories();
      categories.value = [
        { id: 'all', name: '⚡ MEGA AVALANCHA (TODAS)' },
        ...fetchedCategories
      ];
      if (categories.value.length > 0 && !selectedCategoryId.value) {
        selectedCategoryId.value = 'all';
      }
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al conectar con la base de datos.';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadRiders() {
    if (!selectedCategoryId.value) return;
    isLoading.value = true;
    stopStopwatch();
    presentRiderIds.value.clear();
    
    try {
      if (selectedCategoryId.value === 'all') {
        riders.value = await getRidersByCategory(undefined);
      } else {
        riders.value = await getRidersByCategory(selectedCategoryId.value);
      }
      isGridConfirmed.value = false;

      if (activeCompetition.value?.category_starts) {
        let regTime = null;
        if (selectedCategoryId.value === 'all') {
          const activeStarts = activeCompetition.value.category_starts.filter(
            s => selectedPhase.value === 'practica' ? s.practice_start_time : s.final_start_time
          );
          if (activeStarts.length > 0) {
            regTime = selectedPhase.value === 'practica'
              ? activeStarts[0].practice_start_time
              : activeStarts[0].final_start_time;
          }
        } else {
          const startRecord = activeCompetition.value.category_starts.find(
            s => s.category_id === parseInt(selectedCategoryId.value)
          );
          regTime = startRecord 
            ? (selectedPhase.value === 'practica' ? startRecord.practice_start_time : startRecord.final_start_time)
            : null;
        }

        if (regTime) {
          const epoch = parseServerTimeToEpoch(regTime);
          if (epoch) {
            startTime.value = epoch;
            startTimeStr.value = regTime;
            raceState.value = 'active';
            currentStep.value = 3;
            startStopwatch();
            return;
          }
        }
      }
      if (currentStep.value === 3) {
        currentStep.value = 1;
      }
      raceState.value = 'idle';
      elapsedTimeMs.value = 0;
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al cargar los pilotos.';
    } finally {
      isLoading.value = false;
    }
  }

  async function startRollCall() {
    currentStep.value = 2;
    try {
      await notifyRollCallStart({
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value
      });
    } catch (error) {
      console.error('Error al notificar inicio de pase de lista:', error);
    }
  }

  // Alterna presencia física de piloto
  function toggleRiderPresence(rider) {
    if (presentRiderIds.value.has(rider.id)) {
      presentRiderIds.value.delete(rider.id);
    } else {
      presentRiderIds.value.add(rider.id);
      
      // Mostrar modal animado de 2 segundos
      lastCheckedRider.value = rider;
      showCheckModal.value = true;
      if (modalTimeout) clearTimeout(modalTimeout);
      modalTimeout = setTimeout(() => {
        showCheckModal.value = false;
      }, 1800);
    }
  }

  async function setRiderDNS(riderId) {
    isSyncingRiders.value = true;
    try {
      await updateRiderStatus(riderId, 'DNS');
      const idx = riders.value.findIndex(r => r.id === riderId);
      if (idx !== -1) {
        riders.value[idx].race_status = 'DNS';
        presentRiderIds.value.delete(riderId);
      }
    } catch (error) {
      alert(error.friendlyMessage || 'Error al marcar DNS.');
    } finally {
      isSyncingRiders.value = false;
    }
  }

  async function revertRiderDNS(riderId) {
    isSyncingRiders.value = true;
    try {
      await updateRiderStatus(riderId, 'pre_inscrito');
      const idx = riders.value.findIndex(r => r.id === riderId);
      if (idx !== -1) riders.value[idx].race_status = 'pre_inscrito';
    } catch (error) {
      alert(error.friendlyMessage || 'Error al revertir DNS.');
    } finally {
      isSyncingRiders.value = false;
    }
  }

  function startLaunchCountdown() {
    if (!isGridConfirmed.value || !allActiveRidersPresent.value) return;
    raceState.value = 'counting';
    countdown.value = 3;
    const countInterval = setInterval(() => {
      countdown.value--;
      if (countdown.value === 0) {
        clearInterval(countInterval);
        triggerLaunch();
      }
    }, 1000);
  }

  async function triggerLaunch() {
    if (!activeCompetition.value || !selectedCategoryId.value) return;
    isLoading.value = true;
    try {
      const data = await triggerCategoryStart({
        competition_id: activeCompetition.value.id,
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value
      });
      const epoch = parseServerTimeToEpoch(data.start_time);
      startTime.value = epoch;
      startTimeStr.value = data.start_time;
      raceState.value = 'active';
      currentStep.value = 3;
      riders.value.forEach(r => {
        if (r.race_status !== 'DNS' && r.race_status !== 'DNF') r.race_status = 'en_carrera';
      });
      startStopwatch();
      activeCompetition.value = await getActiveCompetition();
    } catch (error) {
      raceState.value = 'idle';
      errorMessage.value = error.friendlyMessage || 'Error al iniciar largada.';
    } finally {
      isLoading.value = false;
    }
  }

  async function panicReset() {
    if (!activeCompetition.value || !selectedCategoryId.value) return;
    isLoading.value = true;
    try {
      await resetCategoryStart({
        competition_id: activeCompetition.value.id,
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value
      });
      stopStopwatch();
      raceState.value = 'idle';
      elapsedTimeMs.value = 0;
      isGridConfirmed.value = false;
      presentRiderIds.value.clear();
      riders.value.forEach(r => {
        if (r.race_status === 'en_carrera') r.race_status = 'pre_inscrito';
      });
      currentStep.value = 1;
      activeCompetition.value = await getActiveCompetition();
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al revertir la largada.';
    } finally {
      isLoading.value = false;
    }
  }

  function startStopwatch() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    const updateTime = () => {
      if (startTime.value) {
        elapsedTimeMs.value = Date.now() - startTime.value;
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };
    animationFrameId = requestAnimationFrame(updateTime);
  }

  function stopStopwatch() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const timeFormatted = computed(() => {
    const totalMs = elapsedTimeMs.value;
    if (totalMs <= 0) return '00:00:00.000';
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor(totalMs % 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  });

  onBeforeUnmount(() => {
    stopStopwatch();
    if (modalTimeout) clearTimeout(modalTimeout);
  });

  watch([selectedCategoryId, selectedPhase], () => loadRiders());

  return {
    activeCompetition, categories, selectedCategoryId, selectedPhase, riders,
    searchQuery, isGridConfirmed, isLoading, errorMessage, raceState, countdown,
    startTime, startTimeStr, elapsedTimeMs, isIdle, isCounting, isActive, activeRiders, dnsRiders,
    presentRiderIds, lastCheckedRider, showCheckModal, allActiveRidersPresent, timeFormatted,
    currentStep, isSyncingRiders,
    loadInitialData, loadRiders, toggleRiderPresence, setRiderDNS, revertRiderDNS,
    startLaunchCountdown, panicReset, startRollCall
  };
}
