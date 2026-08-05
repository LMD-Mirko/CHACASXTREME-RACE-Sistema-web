import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  assignRaceMedia,
  assignRaceMediaBulk,
  downloadAdminRaceMediaOriginal,
  listAdminRaceMedia,
  searchRidersForAssign,
  unassignRaceMedia,
} from '../services/classifyMediaService.js';
import { storageUrl } from '../../../core/network/storageUrl.js';
import api from '../../../core/network/axios';

const RECENT_KEY = 'cxr_classify_recent_riders';
const MAX_RECENT = 6;
const PAGE_SIZE = 10;

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
  const downloading = ref(false);
  const error = ref('');
  const toast = ref('');
  let toastTimer = null;

  const competition = ref(null);
  const items = ref([]);
  const photographers = ref([]);
  const counts = ref({ general: 0, assigned: 0, photos: 0, videos: 0, total: 0 });
  const meta = ref({ current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });
  const page = ref(1);

  const filters = ref({
    scope: 'general',
    media_type: 'all',
    photographer_id: '',
  });

  const selectedId = ref(null);
  /** @type {import('vue').Ref<Record<number, true>>} */
  const selectedMap = ref({});
  const multiMode = ref(false);

  const allRiders = ref([]);
  const selectedRiderId = ref('');
  const selectedRider = computed(() => {
    const id = Number(selectedRiderId.value);
    if (!id) return null;
    return allRiders.value.find((r) => Number(r.id) === id)
      || recentRiders.value.find((r) => Number(r.id) === id)
      || null;
  });
  const recentRiders = ref(loadRecent());

  const riderSelectOptions = computed(() => allRiders.value.map((r) => ({
    value: r.id,
    label: `#${r.plate_number || '—'} · ${r.full_name}${r.category?.name ? ` (${r.category.name})` : ''}`,
  })));

  const current = computed(() => {
    if (!selectedId.value) return items.value[0] || null;
    return items.value.find((m) => m.id === selectedId.value) || items.value[0] || null;
  });

  const currentIndex = computed(() => {
    if (!current.value) return -1;
    return items.value.findIndex((m) => m.id === current.value.id);
  });

  /** Índice global 1-based del ítem actual (para UI). */
  const globalIndex = computed(() => {
    if (currentIndex.value < 0) return 0;
    return (meta.value.current_page - 1) * meta.value.per_page + currentIndex.value + 1;
  });

  const pendingCount = computed(() => counts.value.general || 0);
  const selectedCount = computed(() => Object.keys(selectedMap.value).length);
  const canPrevPage = computed(() => page.value > 1);
  const canNextPage = computed(() => page.value < (meta.value.last_page || 1));

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

  async function downloadOriginal(item = current.value) {
    if (!item?.id || downloading.value) return false;
    downloading.value = true;
    try {
      await downloadAdminRaceMediaOriginal(item);
      showToast('Descarga del original iniciada');
      return true;
    } catch (e) {
      showToast(e?.message || 'No se pudo descargar el original');
      return false;
    } finally {
      downloading.value = false;
    }
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

  async function loadRiders() {
    try {
      const { data } = await api.get('/api/riders', { params: { has_plate: 1 } });
      allRiders.value = (data.data || []).slice().sort((a, b) => {
        const pa = Number(a.plate_number) || 9999;
        const pb = Number(b.plate_number) || 9999;
        return pa - pb;
      });
    } catch {
      // fallback search API if list fails
      try {
        allRiders.value = await searchRidersForAssign(' ');
      } catch {
        allRiders.value = [];
      }
    }
  }

  async function load(opts = {}) {
    const keepSelection = opts.keepSelection === true;
    const prevId = selectedId.value;
    const targetPage = opts.page != null ? opts.page : page.value;

    loading.value = true;
    error.value = '';
    try {
      const params = {
        scope: filters.value.scope,
        media_type: filters.value.media_type,
        per_page: PAGE_SIZE,
        page: targetPage,
      };
      if (filters.value.photographer_id) {
        params.photographer_id = filters.value.photographer_id;
      }

      const res = await listAdminRaceMedia(params);
      competition.value = res.competition;
      photographers.value = res.photographers || [];
      counts.value = res.counts || counts.value;
      meta.value = res.meta || meta.value;
      page.value = res.meta?.current_page || targetPage;

      const pageItems = [...(res.data || [])];
      items.value = pageItems;

      // Si la página quedó vacía (p.ej. tras asignar todo) y hay anteriores, retrocede
      if (!pageItems.length && page.value > 1) {
        loading.value = false;
        return load({ page: page.value - 1 });
      }

      if (keepSelection && prevId && pageItems.some((m) => m.id === prevId)) {
        selectedId.value = prevId;
      } else {
        selectedId.value = pageItems[0]?.id ?? null;
      }

      const alive = new Set(pageItems.map((m) => m.id));
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

  function goToPage(p) {
    const next = Math.max(1, Math.min(meta.value.last_page || 1, Number(p) || 1));
    selectedMap.value = {};
    return load({ page: next });
  }

  function nextPage() {
    if (canNextPage.value) return goToPage(page.value + 1);
  }

  function prevPage() {
    if (canPrevPage.value) return goToPage(page.value - 1);
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

  async function selectNext(delta = 1) {
    if (!items.value.length) return;
    const idx = currentIndex.value < 0 ? 0 : currentIndex.value;
    const next = idx + delta;
    if (next < 0) {
      if (canPrevPage.value) {
        await prevPage();
        if (items.value.length) selectedId.value = items.value[items.value.length - 1].id;
      }
      return;
    }
    if (next >= items.value.length) {
      if (canNextPage.value) {
        await nextPage();
      }
      return;
    }
    selectedId.value = items.value[next].id;
  }

  function pickRecent(rider) {
    if (!rider?.id) return;
    selectedRiderId.value = rider.id;
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
      selectedMap.value = {};
      multiMode.value = false;

      // Recargar página actual (el total baja; puede vaciar la página)
      await load({ page: page.value });
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
      await load({ page: page.value });
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
    const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable
      || e.target?.closest?.('.app-select');

    if (e.key === 'Escape') {
      if (multiMode.value || selectedCount.value) {
        clearMulti();
        e.preventDefault();
      }
      return;
    }

    if (typing) return;

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
    }
  }

  // Al cambiar filtros → página 1
  watch(filters, () => {
    selectedMap.value = {};
    multiMode.value = false;
    load({ page: 1 });
  }, { deep: true });

  onMounted(() => {
    load({ page: 1 });
    loadRiders();
    window.addEventListener('keydown', onKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    if (toastTimer) clearTimeout(toastTimer);
  });

  return {
    PAGE_SIZE,
    loading,
    assigning,
    downloading,
    error,
    toast,
    competition,
    items,
    photographers,
    counts,
    meta,
    page,
    filters,
    selectedId,
    selectedMap,
    multiMode,
    selectedRiderId,
    selectedRider,
    recentRiders,
    riderSelectOptions,
    current,
    currentIndex,
    globalIndex,
    pendingCount,
    selectedCount,
    canPrevPage,
    canNextPage,
    load,
    goToPage,
    nextPage,
    prevPage,
    selectItem,
    selectNext,
    toggleSelectAllVisible,
    clearMulti,
    pickRecent,
    assignCurrent,
    unassignCurrent,
    mediaPreviewUrl,
    downloadOriginal,
    formatBytes,
    formatWhen,
    showToast,
  };
}
