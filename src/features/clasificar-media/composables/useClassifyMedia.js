import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import {
  assignRaceMedia,
  assignRaceMediaBulk,
  listAdminRaceMedia,
  searchRidersForAssign,
  unassignRaceMedia,
} from '../services/classifyMediaService.js';
import { storageUrl } from '../../../core/network/storageUrl.js';

const RECENT_KEY = 'cxr_classify_recent_riders';
const MAX_RECENT = 6;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

function pushRecent(rider) {
  if (!rider?.id) return;
  const next = [
    {
      id: rider.id,
      plate_number: rider.plate_number,
      full_name: rider.full_name,
      nickname: rider.nickname,
    },
    ...loadRecent().filter((r) => r.id !== rider.id),
  ].slice(0, MAX_RECENT);
  saveRecent(next);
  return next;
}

export function useClassifyMedia() {
  const loading = ref(false);
  const assigning = ref(false);
  const error = ref('');
  const toast = ref('');
  let toastTimer = null;

  const competition = ref(null);
  const items = ref([]);
  const photographers = ref([]);
  const counts = ref({ general: 0, assigned: 0, photos: 0, videos: 0, total: 0 });
  const meta = ref({ current_page: 1, last_page: 1, total: 0, per_page: 100 });

  const filters = ref({
    scope: 'general',
    media_type: 'all',
    photographer_id: '',
  });

  const selectedId = ref(null);
  /** @type {import('vue').Ref<Record<number, true>>} */
  const selectedMap = ref({});
  const multiMode = ref(false);

  const riderQuery = ref('');
  const riderResults = ref([]);
  const searchingRiders = ref(false);
  const selectedRider = ref(null);
  const recentRiders = ref(loadRecent());

  const current = computed(() => {
    if (!selectedId.value) return items.value[0] || null;
    return items.value.find((m) => m.id === selectedId.value) || items.value[0] || null;
  });

  const currentIndex = computed(() => {
    if (!current.value) return -1;
    return items.value.findIndex((m) => m.id === current.value.id);
  });

  const pendingCount = computed(() => {
    if (filters.value.scope === 'general') return meta.value.total || items.value.length;
    return counts.value.general || 0;
  });

  const selectedIds = computed(() => new Set(Object.keys(selectedMap.value).map(Number)));
  const selectedCount = computed(() => Object.keys(selectedMap.value).length);

  function showToast(message) {
    toast.value = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.value = '';
    }, 2800);
  }

  function mediaPreviewUrl(item) {
    return storageUrl(item?.view_url || '');
  }

  function formatBytes(n) {
    const v = Number(n) || 0;
    if (v < 1024) return `${v} B`;
    if (v < 1024 * 1024) return `${(v / 1024).toFixed(0)} KB`;
    return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatWhen(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  async function load(opts = {}) {
    const keepSelection = opts.keepSelection === true;
    const prevId = selectedId.value;
    loading.value = true;
    error.value = '';
    try {
      const params = {
        scope: filters.value.scope,
        media_type: filters.value.media_type,
        per_page: 100,
        page: 1,
      };
      if (filters.value.photographer_id) {
        params.photographer_id = filters.value.photographer_id;
      }

      const first = await listAdminRaceMedia(params);
      competition.value = first.competition;
      photographers.value = first.photographers || [];
      counts.value = first.counts || counts.value;
      meta.value = first.meta || meta.value;

      let all = [...(first.data || [])];
      const lastPage = first.meta?.last_page || 1;
      for (let page = 2; page <= lastPage; page += 1) {
        const more = await listAdminRaceMedia({ ...params, page });
        all = all.concat(more.data || []);
      }

      items.value = all;

      if (keepSelection && prevId && all.some((m) => m.id === prevId)) {
        selectedId.value = prevId;
      } else if (!all.some((m) => m.id === selectedId.value)) {
        selectedId.value = all[0]?.id ?? null;
      }

      // Limpiar selección múltiple de ids que ya no existen
      const alive = new Set(all.map((m) => m.id));
      const nextMap = {};
      Object.keys(selectedMap.value).forEach((id) => {
        if (alive.has(Number(id))) nextMap[id] = true;
      });
      selectedMap.value = nextMap;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || 'No se pudo cargar el media.';
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  function selectItem(id, { toggleMulti = false } = {}) {
    if (multiMode.value || toggleMulti) {
      const next = { ...selectedMap.value };
      if (next[id]) delete next[id];
      else next[id] = true;
      selectedMap.value = next;
      selectedId.value = id;
      return;
    }
    selectedId.value = id;
  }

  function toggleSelectAllVisible() {
    if (selectedCount.value === items.value.length) {
      selectedMap.value = {};
      return;
    }
    const next = {};
    items.value.forEach((m) => { next[m.id] = true; });
    selectedMap.value = next;
  }

  function clearMulti() {
    selectedMap.value = {};
    multiMode.value = false;
  }

  function selectNext(delta = 1) {
    if (!items.value.length) return;
    const idx = currentIndex.value < 0 ? 0 : currentIndex.value;
    const next = Math.max(0, Math.min(items.value.length - 1, idx + delta));
    selectedId.value = items.value[next].id;
  }

  const runRiderSearch = useDebounceFn(async (q) => {
    searchingRiders.value = true;
    try {
      riderResults.value = await searchRidersForAssign(q);
      if (riderResults.value.length === 1) {
        selectedRider.value = riderResults.value[0];
      }
    } catch {
      riderResults.value = [];
    } finally {
      searchingRiders.value = false;
    }
  }, 220);

  watch(riderQuery, (q) => {
    selectedRider.value = null;
    if (!String(q || '').trim()) {
      riderResults.value = [];
      return;
    }
    runRiderSearch(q);
  });

  function pickRider(rider) {
    selectedRider.value = rider;
    riderQuery.value = rider.plate_number
      ? `#${rider.plate_number} ${rider.full_name}`
      : rider.full_name;
  }

  function pickRecent(rider) {
    pickRider(rider);
  }

  async function assignCurrent() {
    const rider = selectedRider.value;
    if (!rider?.id) {
      showToast('Elige un competidor primero');
      return false;
    }

    const bulkIds = Object.keys(selectedMap.value).map(Number);
    const ids = (multiMode.value || bulkIds.length > 1) && bulkIds.length
      ? bulkIds
      : (current.value ? [current.value.id] : []);

    if (!ids.length) {
      showToast('No hay media seleccionado');
      return false;
    }

    assigning.value = true;
    error.value = '';
    try {
      if (ids.length === 1) {
        const res = await assignRaceMedia(ids[0], rider.id);
        showToast(res.message || 'Asignado');
      } else {
        const res = await assignRaceMediaBulk(ids, rider.id);
        showToast(res.message || `${ids.length} asignados`);
      }

      recentRiders.value = pushRecent(rider) || recentRiders.value;

      // Quitar de la cola local si estamos en General
      if (filters.value.scope === 'general') {
        const remove = new Set(ids);
        const idxBefore = currentIndex.value;
        const nextItems = items.value.filter((m) => !remove.has(m.id));
        items.value = nextItems;
        counts.value = {
          ...counts.value,
          general: Math.max(0, (counts.value.general || 0) - ids.length),
          assigned: (counts.value.assigned || 0) + ids.length,
        };
        meta.value = { ...meta.value, total: nextItems.length };
        selectedMap.value = {};
        multiMode.value = false;
        selectedId.value = nextItems[Math.min(Math.max(idxBefore, 0), nextItems.length - 1)]?.id
          ?? nextItems[0]?.id
          ?? null;
      } else {
        await load({ keepSelection: true });
      }

      return true;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || 'No se pudo asignar.';
      showToast(error.value);
      return false;
    } finally {
      assigning.value = false;
    }
  }

  async function unassignCurrent() {
    if (!current.value) return false;
    assigning.value = true;
    try {
      const res = await unassignRaceMedia(current.value.id);
      showToast(res.message || 'Devuelto a General');
      await load({ keepSelection: false });
      return true;
    } catch (e) {
      error.value = e?.response?.data?.message || 'No se pudo devolver a General.';
      showToast(error.value);
      return false;
    } finally {
      assigning.value = false;
    }
  }

  function onKeydown(e) {
    const tag = (e.target?.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;

    if (e.key === 'Escape') {
      if (multiMode.value || selectedCount.value) {
        clearMulti();
        e.preventDefault();
      } else if (riderQuery.value) {
        riderQuery.value = '';
        selectedRider.value = null;
        riderResults.value = [];
        e.preventDefault();
      }
      return;
    }

    if (typing) {
      if (e.key === 'Enter' && selectedRider.value && !e.shiftKey) {
        e.preventDefault();
        assignCurrent();
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'j') {
      e.preventDefault();
      selectNext(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'k') {
      e.preventDefault();
      selectNext(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      assignCurrent();
    } else if (e.key === 'm') {
      e.preventDefault();
      multiMode.value = !multiMode.value;
      if (!multiMode.value) selectedMap.value = {};
    } else if (e.key === '/') {
      e.preventDefault();
      document.getElementById('classify-rider-search')?.focus();
    }
  }

  watch(filters, () => {
    selectedMap.value = {};
    multiMode.value = false;
    load();
  }, { deep: true });

  onMounted(() => {
    load();
    window.addEventListener('keydown', onKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    if (toastTimer) clearTimeout(toastTimer);
  });

  return {
    loading,
    assigning,
    error,
    toast,
    competition,
    items,
    photographers,
    counts,
    meta,
    filters,
    selectedId,
    selectedIds,
    selectedMap,
    multiMode,
    riderQuery,
    riderResults,
    searchingRiders,
    selectedRider,
    recentRiders,
    current,
    currentIndex,
    pendingCount,
    selectedCount,
    load,
    selectItem,
    selectNext,
    toggleSelectAllVisible,
    clearMulti,
    pickRider,
    pickRecent,
    assignCurrent,
    unassignCurrent,
    mediaPreviewUrl,
    formatBytes,
    formatWhen,
    showToast,
  };
}
