import { ref, watch, onMounted, onBeforeUnmount, unref, computed } from 'vue';
import { parseRaceTimeToEpoch } from './raceTime';

/**
 * Cronómetro de manga (TRANSCURRIDO) que se congela al cerrar.
 *
 * @param {import('vue').Ref|import('vue').ComputedRef|(() => object|null)} competitionSource
 *   Objeto competencia con start_time y opcionalmente closed_at / duration_ms / manga_closed
 * @param {object} [options]
 * @param {import('vue').Ref|import('vue').ComputedRef|(() => boolean)} [options.isCompleted]
 *   Señal local (ej. faltan 0 en carrera) para congelar aunque el WS llegue tarde
 */
export function useMangaElapsedStopwatch(competitionSource, options = {}) {
  const stopwatchTime = ref('00:00:00');
  const isFrozen = ref(false);
  let intervalId = null;

  function readCompetition() {
    const src = typeof competitionSource === 'function' ? competitionSource() : unref(competitionSource);
    return src || null;
  }

  function readCompletedFlag() {
    if (options.isCompleted == null) return false;
    const v = typeof options.isCompleted === 'function' ? options.isCompleted() : unref(options.isCompleted);
    return !!v;
  }

  function formatElapsed(ms) {
    if (ms == null || ms < 0 || Number.isNaN(ms)) return '00:00:00';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return (
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0')
    );
  }

  function clearTicker() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function computeLiveMs(comp) {
    if (!comp?.start_time) return null;
    const start = parseRaceTimeToEpoch(comp.start_time);
    if (start == null) return null;
    return Date.now() - start;
  }

  function computeFrozenMs(comp, eventDetail = null) {
    if (eventDetail?.duration_ms != null) return eventDetail.duration_ms;
    if (eventDetail?.duration_formatted && eventDetail.duration_formatted !== '—') {
      // Prefer explicit ms; formatted string from backend is HH:MM:SS(.mmm)
    }
    if (comp?.duration_ms != null) return comp.duration_ms;

    const start = parseRaceTimeToEpoch(comp?.start_time);
    const end =
      parseRaceTimeToEpoch(eventDetail?.closed_at) ??
      parseRaceTimeToEpoch(comp?.closed_at);
    if (start != null && end != null) return end - start;

    return computeLiveMs(comp);
  }

  function freeze(eventDetail = null) {
    const comp = readCompetition();
    const ms = computeFrozenMs(comp, eventDetail);
    stopwatchTime.value = formatElapsed(ms);
    isFrozen.value = true;
    clearTicker();
  }

  function unfreeze() {
    isFrozen.value = false;
    restartTicker();
  }

  function tick() {
    if (isFrozen.value) return;
    const comp = readCompetition();
    if (!comp?.start_time) {
      stopwatchTime.value = '00:00:00';
      return;
    }
    // Backend ya marcó cerrado (p.ej. al recargar)
    if (comp.manga_closed || comp.closed_at) {
      freeze();
      return;
    }
    if (readCompletedFlag()) {
      freeze();
      return;
    }
    stopwatchTime.value = formatElapsed(computeLiveMs(comp));
  }

  function restartTicker() {
    clearTicker();
    tick();
    if (!isFrozen.value) {
      intervalId = setInterval(tick, 1000);
    }
  }

  function onMangaCompleted(e) {
    freeze(e?.detail || null);
  }

  function onMangaStarted() {
    unfreeze();
  }

  const competitionRef = computed(() => readCompetition());

  watch(
    competitionRef,
    () => {
      if (readCompetition()?.start_time) {
        if (readCompetition()?.manga_closed || readCompetition()?.closed_at || readCompletedFlag()) {
          freeze();
        } else {
          isFrozen.value = false;
          restartTicker();
        }
      } else {
        clearTicker();
        stopwatchTime.value = '00:00:00';
        isFrozen.value = false;
      }
    },
    { immediate: true, deep: true },
  );

  if (options.isCompleted != null) {
    watch(
      () => readCompletedFlag(),
      (done) => {
        if (done) freeze();
      },
    );
  }

  onMounted(() => {
    window.addEventListener('category-manga-completed', onMangaCompleted);
    window.addEventListener('category-manga-started', onMangaStarted);
  });

  onBeforeUnmount(() => {
    clearTicker();
    window.removeEventListener('category-manga-completed', onMangaCompleted);
    window.removeEventListener('category-manga-started', onMangaStarted);
  });

  return {
    stopwatchTime,
    isFrozen,
    freeze,
    unfreeze,
  };
}
