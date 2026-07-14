import { ref, computed, watch, onBeforeUnmount } from 'vue';
import {
  getActiveCompetition, getCategories, getRidersByCategory,
  triggerCategoryStart, resetCategoryStart, closeDeparture, updateRiderStatus,
  notifyRollCallStart, notifyRollCallFinish, notifyCountdownStart,
  getRollCallState, updateRollCallPresence,
} from '../services/partidaService';
import { formatDeviceRaceTime, parseRaceTimeToEpoch } from '../../../core/time/raceTime';
import api from '../../../core/network/axios';

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
const classifiedIds = ref(new Set());
let animationFrameId = null;
let modalTimeout = null;

function sameCategoryKey(a, b) {
  return String(a) === String(b);
}

export function usePartida() {
  const isIdle = computed(() => raceState.value === 'idle');
  const isCounting = computed(() => raceState.value === 'counting');
  const isActive = computed(() => raceState.value === 'active');
  const isFinalPhase = computed(() => selectedPhase.value === 'final');

  const activeRiders = computed(() => {
    return riders.value.filter(r => {
      const matchesSearch = searchQuery.value.trim() === '' ||
        r.plate_number.toString().includes(searchQuery.value) ||
        r.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch && r.race_status !== 'DNS';
    });
  });

  const dnsRiders = computed(() => riders.value.filter(r => r.race_status === 'DNS'));

  const allActiveRidersPresent = computed(() => {
    const active = riders.value.filter(r => r.race_status !== 'DNS');
    if (active.length === 0) return false;
    return active.every(r => presentRiderIds.value.has(r.id));
  });

  function applyPresentIds(ids) {
    presentRiderIds.value = new Set((ids || []).map((id) => Number(id)));
  }

  async function hydrateRollCallState() {
    if (!selectedCategoryId.value) return null;
    try {
      const state = await getRollCallState({
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value,
      });
      applyPresentIds(state.present_rider_ids);
      return state;
    } catch (err) {
      console.error('Error hidratando pase de lista:', err);
      return null;
    }
  }

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

  async function fetchClassifiedIds() {
    if (!activeCompetition.value) {
      classifiedIds.value = new Set();
      return;
    }
    try {
      const response = await api.get(
        `/api/competitions/${activeCompetition.value.id}/classifications`,
        { params: { phase: 'practica', category_id: 'all' } }
      );
      const rows = response.data.classifications || [];
      // Clasificado = llegó a META en clasificación
      const ids = rows
        .filter(r => r.meta_time || r.status === 'LLEGÓ')
        .map(r => r.id);
      classifiedIds.value = new Set(ids);
    } catch (err) {
      console.error('Error cargando clasificados', err);
      classifiedIds.value = new Set();
    }
  }

  async function loadRiders() {
    if (!selectedCategoryId.value) return;
    isLoading.value = true;
    stopStopwatch();
    if (currentStep.value !== 2) {
      presentRiderIds.value.clear();
      isGridConfirmed.value = false;
    }

    try {
      if (selectedCategoryId.value === 'all') {
        riders.value = await getRidersByCategory(undefined);
      } else {
        riders.value = await getRidersByCategory(selectedCategoryId.value);
      }

      if (selectedPhase.value === 'final') {
        await fetchClassifiedIds();
        // Solo clasificados en grilla de final
        riders.value = riders.value.filter(r => classifiedIds.value.has(r.id));
        riders.value.forEach(r => {
          if (r.race_status === 'DNS') r.race_status = 'pre_inscrito';
        });
      }

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
          const epoch = parseRaceTimeToEpoch(regTime);
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

      if (currentStep.value === 2) {
        await hydrateRollCallState();
      }
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al cargar los pilotos.';
    } finally {
      isLoading.value = false;
    }
  }

  async function startRollCall() {
    if (selectedPhase.value === 'final' && riders.value.length === 0) {
      errorMessage.value = 'No hay clasificados para la Final. Completa la Clasificación primero.';
      return;
    }
    currentStep.value = 2;
    isGridConfirmed.value = false;
    try {
      const res = await notifyRollCallStart({
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value
      });
      const state = res?.data;
      if (state?.present_rider_ids) {
        applyPresentIds(state.present_rider_ids);
      } else if (selectedPhase.value === 'final') {
        presentRiderIds.value = new Set(
          riders.value.filter(r => r.race_status !== 'DNS').map(r => r.id)
        );
      } else {
        presentRiderIds.value = new Set();
      }
    } catch (error) {
      console.error('Error al notificar inicio de pase de lista:', error);
      if (selectedPhase.value === 'final') {
        presentRiderIds.value = new Set(
          riders.value.filter(r => r.race_status !== 'DNS').map(r => r.id)
        );
      }
    }
  }

  /** Otro teléfono inició pase de lista → entrar a la misma grilla sincronizada */
  async function joinRemoteRollCall(detail) {
    if (!detail) return;
    if (raceState.value === 'active' || currentStep.value === 3) return;

    if (detail.phase && detail.phase !== selectedPhase.value) {
      selectedPhase.value = detail.phase;
    }
    if (detail.category_id != null && !sameCategoryKey(detail.category_id, selectedCategoryId.value)) {
      selectedCategoryId.value =
        detail.category_id === 'all' || detail.category_id === '0'
          ? 'all'
          : Number(detail.category_id);
    }

    currentStep.value = 2;
    isGridConfirmed.value = false;
    await loadRiders();
    await hydrateRollCallState();
  }

  function onRemotePresenceUpdated(detail) {
    if (!detail) return;
    if (!sameCategoryKey(detail.category_id, selectedCategoryId.value)) return;
    if (detail.phase && detail.phase !== selectedPhase.value) return;
    if (currentStep.value !== 2) return;
    applyPresentIds(detail.present_rider_ids);
  }

  /** En final: tocar = marcar AUSENTE (DNS). En clasificación: toggle presente. */
  async function toggleRiderPresence(rider) {
    if (selectedPhase.value === 'final') {
      setRiderDNS(rider.id);
      return;
    }

    const willBePresent = !presentRiderIds.value.has(rider.id);
    // Optimista
    const next = new Set(presentRiderIds.value);
    if (willBePresent) {
      next.add(rider.id);
      lastCheckedRider.value = rider;
      showCheckModal.value = true;
      if (modalTimeout) clearTimeout(modalTimeout);
      modalTimeout = setTimeout(() => {
        showCheckModal.value = false;
      }, 1800);
    } else {
      next.delete(rider.id);
    }
    presentRiderIds.value = next;

    try {
      const state = await updateRollCallPresence({
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value,
        rider_id: rider.id,
        present: willBePresent,
      });
      applyPresentIds(state.present_rider_ids);
    } catch (error) {
      // Revertir
      const revert = new Set(presentRiderIds.value);
      if (willBePresent) revert.delete(rider.id);
      else revert.add(rider.id);
      presentRiderIds.value = revert;
      alert(error.friendlyMessage || 'No se pudo sincronizar la asistencia.');
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
        presentRiderIds.value = new Set(presentRiderIds.value);
      }
      if (currentStep.value === 2) {
        try {
          const state = await updateRollCallPresence({
            category_id: selectedCategoryId.value,
            phase: selectedPhase.value,
            rider_id: riderId,
            present: false,
          });
          applyPresentIds(state.present_rider_ids);
        } catch (_) { /* DNS ya quedó en API */ }
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
      if (idx !== -1) {
        riders.value[idx].race_status = 'pre_inscrito';
      }
      if (currentStep.value === 2) {
        const state = await updateRollCallPresence({
          category_id: selectedCategoryId.value,
          phase: selectedPhase.value,
          rider_id: riderId,
          present: selectedPhase.value === 'final',
        });
        applyPresentIds(state.present_rider_ids);
      } else if (selectedPhase.value === 'final') {
        presentRiderIds.value.add(riderId);
        presentRiderIds.value = new Set(presentRiderIds.value);
      }
    } catch (error) {
      alert(error.friendlyMessage || 'Error al revertir DNS.');
    } finally {
      isSyncingRiders.value = false;
    }
  }

  async function startLaunchCountdown() {
    if (!isGridConfirmed.value || !allActiveRidersPresent.value) return;
    raceState.value = 'counting';
    countdown.value = 3;

    try {
      await notifyCountdownStart({
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value,
        duration_seconds: 3
      });
    } catch (err) {
      console.error('Error al iniciar cuenta regresiva remota:', err);
    }

    const countInterval = setInterval(() => {
      countdown.value--;
      if (countdown.value === 0) {
        clearInterval(countInterval);
        triggerLaunch();
      }
    }, 1000);
  }

  watch(isGridConfirmed, async (newVal) => {
    if (newVal) {
      try {
        await notifyRollCallFinish({
          category_id: selectedCategoryId.value,
          phase: selectedPhase.value,
          present_rider_ids: Array.from(presentRiderIds.value)
        });
      } catch (err) {
        console.error('Error al enviar notificación de grilla confirmada:', err);
      }
    }
  });

  async function triggerLaunch() {
    if (!activeCompetition.value || !selectedCategoryId.value) return;
    isLoading.value = true;
    try {
      const clientStartTime = formatDeviceRaceTime();
      const data = await triggerCategoryStart({
        competition_id: activeCompetition.value.id,
        category_id: selectedCategoryId.value,
        phase: selectedPhase.value,
        start_time: clientStartTime,
      });
      const savedStart = data.start_time || clientStartTime;
      const epoch = parseRaceTimeToEpoch(savedStart);
      startTime.value = epoch;
      startTimeStr.value = savedStart;
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
      await loadRiders();
    } catch (error) {
      errorMessage.value = error.friendlyMessage || 'Error al revertir la largada.';
    } finally {
      isLoading.value = false;
    }
  }

  function startStopwatch() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    const updateTime = () => {
      if (!startTime.value || !animationFrameId) return;
      elapsedTimeMs.value = Date.now() - startTime.value;
      animationFrameId = requestAnimationFrame(updateTime);
    };
    animationFrameId = requestAnimationFrame(updateTime);
  }

  function stopStopwatch() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  const timeFormatted = computed(() => {
    const ms = elapsedTimeMs.value;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);
    return (
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0') + '.' +
      String(millis).padStart(3, '0')
    );
  });

  const totalRidersToStart = computed(() => activeRiders.value.length);
  const totalCategoriesToStart = computed(() => {
    if (selectedCategoryId.value === 'all') return Math.max(categories.value.length - 1, 0);
    return 1;
  });

  const activeCategoryLabel = computed(() => {
    const cat = categories.value.find(c => c.id === selectedCategoryId.value);
    return cat?.name || '';
  });

  const arrivedRidersCount = computed(() =>
    riders.value.filter(r => r.race_status === 'llego').length
  );

  const isMangaCompleted = computed(() => {
    const racing = riders.value.filter(r => r.race_status === 'en_carrera');
    if (racing.length > 0) return false;
    const done = riders.value.some(r => r.race_status === 'llego' || r.race_status === 'DNF');
    return done && !!startTime.value;
  });

  // Al cerrar manga (todos llego/DNF), congelar el cronómetro local
  watch(isMangaCompleted, (done) => {
    if (done) stopStopwatch();
  });

  async function confirmMangaClosure() {
    currentStep.value = 1;
    stopStopwatch();
    raceState.value = 'idle';
    await loadRiders();
  }

  watch([selectedCategoryId, selectedPhase], () => loadRiders());

  onBeforeUnmount(() => {
    stopStopwatch();
    if (modalTimeout) clearTimeout(modalTimeout);
  });

  return {
    activeCompetition, categories, selectedCategoryId, selectedPhase, riders,
    searchQuery, isGridConfirmed, isLoading, errorMessage, raceState, countdown,
    startTime, startTimeStr, elapsedTimeMs, currentStep, isSyncingRiders,
    presentRiderIds, lastCheckedRider, showCheckModal, allActiveRidersPresent, timeFormatted,
    isIdle, isCounting, isActive, isFinalPhase,
    activeRiders, dnsRiders, totalRidersToStart, totalCategoriesToStart,
    activeCategoryLabel, arrivedRidersCount, isMangaCompleted,
    loadInitialData, loadRiders, toggleRiderPresence, setRiderDNS, revertRiderDNS,
    startRollCall, joinRemoteRollCall, onRemotePresenceUpdated,
    startLaunchCountdown, triggerLaunch, panicReset, confirmMangaClosure,
    closeDeparture, stopStopwatch,
  };
}
