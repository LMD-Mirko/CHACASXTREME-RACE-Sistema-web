import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import api from '../../../core/network/axios';

const STATUS_ORDER = { 'LLEGÓ': 1, 'EN RUTA': 2, 'DNF': 3, 'PRE_INSCRITO': 4, 'DNS': 5 };

function parseNetToMs(net) {
  if (net == null || net === '' || net === 'N/A' || net === '—') return null;
  const s = String(net).trim();
  const parts = s.split(':');
  try {
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const secParts = String(parts[2]).split('.');
      const sec = parseInt(secParts[0], 10) || 0;
      const ms = parseInt(String(secParts[1] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;
      return ((h * 3600 + m * 60 + sec) * 1000) + ms;
    }
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const secParts = String(parts[1]).split('.');
      const sec = parseInt(secParts[0], 10) || 0;
      const ms = parseInt(String(secParts[1] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;
      return ((m * 60 + sec) * 1000) + ms;
    }
  } catch (_) { /* ignore */ }
  return null;
}

function formatMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const milli = String(Math.floor(ms % 1000)).padStart(3, '0');
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}:${seconds}.${milli}`;
  }
  return `${minutes}:${seconds}.${milli}`;
}

function formatGapMs(gapMs) {
  if (!Number.isFinite(gapMs) || gapMs <= 0) return 'Líder';
  const mins = Math.floor(gapMs / 60000);
  const secs = Math.floor((gapMs % 60000) / 1000);
  const ms = Math.floor(gapMs % 1000);
  return `+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/** Ordena y asigna puestos 1..N a quienes ya llegaron (en vivo). */
function recomputeLiveClassifications(list) {
  const rows = (list || []).map((r) => {
    const pos = r.position;
    const normalizedPos = (typeof pos === 'number' && Number.isFinite(pos))
      ? pos
      : (pos != null && String(pos) !== '—' ? Number(pos) : null);
    return {
      ...r,
      position: Number.isFinite(normalizedPos) ? normalizedPos : '—',
      duration_ms: r.duration_ms ?? null,
      time_formatted: r.time_formatted && r.time_formatted !== '—' ? r.time_formatted : (r.time_formatted || '—'),
    };
  });

  const arrived = rows.filter((r) => r.status === 'LLEGÓ');
  arrived.sort((a, b) => {
    const da = a.duration_ms ?? parseNetToMs(a.time_formatted) ?? Number.POSITIVE_INFINITY;
    const db = b.duration_ms ?? parseNetToMs(b.time_formatted) ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return (a.plate_number ?? 0) - (b.plate_number ?? 0);
  });

  const leaderMs = arrived.length
    ? (arrived[0].duration_ms ?? parseNetToMs(arrived[0].time_formatted))
    : null;

  const byId = {};
  arrived.forEach((r, i) => {
    const ms = r.duration_ms ?? parseNetToMs(r.time_formatted);
    byId[r.id] = {
      position: i + 1,
      duration_ms: ms ?? r.duration_ms ?? null,
      time_formatted: (r.time_formatted && r.time_formatted !== '—')
        ? r.time_formatted
        : (formatMs(ms) || r.time_formatted || '—'),
      gap: (i === 0 || leaderMs == null || ms == null) ? 'Líder' : formatGapMs(ms - leaderMs),
    };
  });

  const next = rows.map((r) => {
    if (r.status !== 'LLEGÓ' || !byId[r.id]) {
      return { ...r, position: r.status === 'LLEGÓ' ? r.position : '—' };
    }
    return { ...r, ...byId[r.id] };
  });

  return next.sort((a, b) => {
    const oa = STATUS_ORDER[a.status] ?? 6;
    const ob = STATUS_ORDER[b.status] ?? 6;
    if (oa !== ob) return oa - ob;
    if (a.status === 'LLEGÓ' && b.status === 'LLEGÓ') {
      const pa = typeof a.position === 'number' ? a.position : 9999;
      const pb = typeof b.position === 'number' ? b.position : 9999;
      return pa - pb;
    }
    if (a.status === 'EN RUTA' && b.status === 'EN RUTA') {
      const pa = a.intermediate_passed ? 0 : 1;
      const pb = b.intermediate_passed ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (a.intermediate_passed && b.intermediate_passed) {
        return String(a.intermediate_time || '').localeCompare(String(b.intermediate_time || ''));
      }
    }
    return (a.plate_number ?? 0) - (b.plate_number ?? 0);
  });
}

export function useClassification() {
  const activeCompetition = ref(null);
  const classifications = ref([]);
  const categories = ref([]);
  const activeCategoryId = ref('all');
  const viewPhase = ref('practica');
  const searchQuery = ref('');
  const isLoading = ref(false);
  const errorMessage = ref(null);
  const isOnline = ref(true);
  const manga = ref(null);
  const markingDnfId = ref(null);

  let classReqId = 0;
  let finishReloadTimer = null;

  const userRole = computed(() => localStorage.getItem('user_role')?.toUpperCase() || '');
  const canMarkDnf = computed(() => ['ADMIN', 'PARTIDA', 'INTERMEDIO'].includes(userRole.value));

  async function loadCategories() {
    try {
      const response = await api.get('/api/categories');
      categories.value = response.data.data;
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  }

  async function loadActiveCompetition() {
    try {
      const response = await api.get('/api/competitions/active');
      activeCompetition.value = response.data.data;
      if (activeCompetition.value?.current_phase) {
        viewPhase.value = activeCompetition.value.current_phase;
      }
    } catch (err) {
      errorMessage.value = 'No se encontró una competencia activa.';
    }
  }

  async function loadClassifications({ soft = false } = {}) {
    if (!activeCompetition.value) return;

    const reqId = ++classReqId;

    if (!soft) {
      isLoading.value = true;
      errorMessage.value = null;
    }

    try {
      const response = await api.get(`/api/competitions/${activeCompetition.value.id}/classifications`, {
        params: {
          category_id: activeCategoryId.value,
          phase: viewPhase.value,
        }
      });
      if (reqId !== classReqId) return;

      const incoming = response.data.classifications || [];
      const prevById = Object.fromEntries(
        (classifications.value || []).map((r) => [r.id, r])
      );
      const merged = incoming.map((row) => {
        const prev = prevById[row.id];
        if (!prev) return row;

        let next = { ...row };
        if (prev.intermediate_passed && !row.intermediate_passed) {
          next = {
            ...next,
            intermediate_passed: true,
            intermediate_time: prev.intermediate_time,
            status: row.status === 'LLEGÓ' ? 'LLEGÓ' : 'EN RUTA',
          };
        }
        if (prev.status === 'LLEGÓ') {
          if (next.status !== 'LLEGÓ') next.status = 'LLEGÓ';
          if ((!next.time_formatted || next.time_formatted === '—') && prev.time_formatted && prev.time_formatted !== '—') {
            next.time_formatted = prev.time_formatted;
          }
          if (next.duration_ms == null && prev.duration_ms != null) next.duration_ms = prev.duration_ms;
          if ((next.position == null || next.position === '—') && prev.position != null && prev.position !== '—') {
            next.position = prev.position;
          }
        }
        return next;
      });
      classifications.value = recomputeLiveClassifications(merged);
      manga.value = response.data.manga || null;
    } catch (err) {
      if (!soft && reqId === classReqId) {
        errorMessage.value = 'Error al cargar la tabla de posiciones.';
      }
    } finally {
      if (!soft && reqId === classReqId) isLoading.value = false;
    }
  }

  function applyCheckpointPassLocal(detail) {
    if (!detail) return;
    const cp = String(detail.checkpoint_name || '').toUpperCase();
    if (cp === 'META') return;

    const riderId = detail.rider_id;
    const plate = detail.plate_number;
    const list = classifications.value || [];
    const idx = list.findIndex(
      (r) => (riderId != null && r.id === riderId)
        || (plate != null && Number(r.plate_number) === Number(plate))
    );
    if (idx < 0) return;

    const raw = detail.exact_time || '';
    const s = String(raw).trim();
    const timePart = s.includes('T')
      ? s.split('T')[1]
      : (s.includes(' ') ? s.split(' ')[1] : s);
    const hora = (timePart || s).slice(0, 8) || null;

    const next = [...list];
    const cur = next[idx];
    next[idx] = {
      ...cur,
      intermediate_passed: true,
      intermediate_time: hora || cur.intermediate_time,
      status: cur.status === 'LLEGÓ' ? 'LLEGÓ' : 'EN RUTA',
    };

    classifications.value = recomputeLiveClassifications(next);
  }

  function applyFinishLocal(detail) {
    if (!detail) return;
    const riderId = detail.rider_id;
    const plate = detail.plate_number;
    const list = classifications.value || [];
    const idx = list.findIndex(
      (r) => (riderId != null && r.id === riderId)
        || (plate != null && Number(r.plate_number) === Number(plate))
    );
    if (idx < 0) return;

    const net = detail.net_time && detail.net_time !== 'N/A' ? detail.net_time : null;
    const durationMs = detail.duration_ms ?? parseNetToMs(net);
    const next = [...list];
    const cur = next[idx];
    next[idx] = {
      ...cur,
      status: 'LLEGÓ',
      time_formatted: net || cur.time_formatted,
      duration_ms: durationMs ?? cur.duration_ms ?? null,
      position: detail.current_position ?? cur.position,
    };
    classifications.value = recomputeLiveClassifications(next);
  }

  function setViewPhase(phase) {
    viewPhase.value = phase;
  }

  async function markRiderDnf(rider) {
    if (!canMarkDnf.value || !rider || rider.status !== 'EN RUTA') return;

    const ok = confirm(
      `¿Marcar a ${rider.full_name} (#${rider.plate_number}) como DNF (no llegó)?\n\nSi era el último en pista, la manga se cierra sola.`
    );
    if (!ok) return;

    markingDnfId.value = rider.id;
    try {
      const res = await api.post(`/api/riders/${rider.id}/retire`, {
        checkpoint_name: 'Puestos / Admin',
      });
      if (res.data?.manga) {
        manga.value = res.data.manga;
      }
      await loadClassifications();
    } catch (err) {
      alert(err.friendlyMessage || 'No se pudo marcar DNF.');
    } finally {
      markingDnfId.value = null;
    }
  }

  const filteredClassifications = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return classifications.value;

    return classifications.value.filter(c =>
      c.plate_number.toString().includes(query) ||
      c.full_name.toLowerCase().includes(query) ||
      (c.club_team && c.club_team.toLowerCase().includes(query)) ||
      (c.origin && c.origin.toLowerCase().includes(query))
    );
  });

  const isFinalView = computed(() => viewPhase.value === 'final');

  const mangaDurationLabel = computed(() => manga.value?.duration_formatted || '—');
  const mangaIsClosed = computed(() => !!manga.value?.is_closed);
  const stillRacing = computed(() => manga.value?.still_racing ?? 0);

  function setupWebSocketListener() {
    // Usa el bus DOM del NotificationCenter — NO suscribir Echo aquí
  }

  function cleanupWebSocketListener() {
    // no-op
  }

  const handleLiveClassUpdate = () => {
    loadClassifications({ soft: true });
  };

  const handlePassedCheckpoint = (e) => {
    applyCheckpointPassLocal(e?.detail);
    loadClassifications({ soft: true });
  };

  const handleRiderFinished = (e) => {
    applyFinishLocal(e?.detail);
    if (finishReloadTimer) clearTimeout(finishReloadTimer);
    finishReloadTimer = setTimeout(() => {
      finishReloadTimer = null;
      loadClassifications({ soft: true });
    }, 300);
  };

  const handlePhaseChanged = (e) => {
    const phase = e?.detail?.phase;
    if (phase && activeCompetition.value) {
      activeCompetition.value.current_phase = phase;
    }
    loadClassifications({ soft: true });
  };

  const handleResetClass = async () => {
    await loadActiveCompetition();
    await loadClassifications();
  };

  watch([activeCategoryId, viewPhase], () => {
    loadClassifications();
  });

  onMounted(async () => {
    await loadActiveCompetition();
    await loadCategories();
    await loadClassifications();
    setupWebSocketListener();

    window.addEventListener('race-reset', handleResetClass);
    window.addEventListener('rider-passed-checkpoint', handlePassedCheckpoint);
    window.addEventListener('rider-incident-reported', handleLiveClassUpdate);
    window.addEventListener('rider-finished', handleRiderFinished);
    window.addEventListener('corrections-applied', handleLiveClassUpdate);
    window.addEventListener('category-manga-completed', handleLiveClassUpdate);
    window.addEventListener('rider-estimated-arrival', handleLiveClassUpdate);
    window.addEventListener('competition-phase-changed', handlePhaseChanged);
  });

  onBeforeUnmount(() => {
    cleanupWebSocketListener();
    if (finishReloadTimer) clearTimeout(finishReloadTimer);
    window.removeEventListener('race-reset', handleResetClass);
    window.removeEventListener('rider-passed-checkpoint', handlePassedCheckpoint);
    window.removeEventListener('rider-incident-reported', handleLiveClassUpdate);
    window.removeEventListener('rider-finished', handleRiderFinished);
    window.removeEventListener('corrections-applied', handleLiveClassUpdate);
    window.removeEventListener('category-manga-completed', handleLiveClassUpdate);
    window.removeEventListener('rider-estimated-arrival', handleLiveClassUpdate);
    window.removeEventListener('competition-phase-changed', handlePhaseChanged);
  });

  return {
    activeCompetition,
    classifications,
    categories,
    activeCategoryId,
    viewPhase,
    isFinalView,
    searchQuery,
    isLoading,
    errorMessage,
    isOnline,
    filteredClassifications,
    manga,
    mangaDurationLabel,
    mangaIsClosed,
    stillRacing,
    canMarkDnf,
    markingDnfId,
    loadClassifications,
    setViewPhase,
    markRiderDnf,
  };
}
