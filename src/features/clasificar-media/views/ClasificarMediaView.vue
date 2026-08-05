<template>
  <div class="classify-root fade-in">
    <!-- Header -->
    <header class="classify-head">
      <div class="head-copy">
        <p class="eyebrow">Media · 4ª edición</p>
        <h1>Clasificar General</h1>
        <p class="sub">
          Asigna fotos y videos de la bandeja General a cada competidor.
          <span v-if="competition?.name" class="comp-pill">{{ competition.name }}</span>
        </p>
      </div>

      <div class="head-stats">
        <div class="stat stat--warn">
          <span class="stat-label">Pendientes</span>
          <strong class="stat-value">{{ counts.general }}</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Asignados</span>
          <strong class="stat-value">{{ counts.assigned }}</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Videos</span>
          <strong class="stat-value">{{ counts.videos }}</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Fotos</span>
          <strong class="stat-value">{{ counts.photos }}</strong>
        </div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="seg">
        <button
          type="button"
          class="seg-btn"
          :class="{ active: filters.scope === 'general' }"
          @click="filters.scope = 'general'"
        >
          General
          <span class="badge">{{ counts.general }}</span>
        </button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: filters.scope === 'assigned' }"
          @click="filters.scope = 'assigned'"
        >
          Asignados
        </button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: filters.scope === 'all' }"
          @click="filters.scope = 'all'"
        >
          Todos
        </button>
      </div>

      <div class="seg">
        <button
          type="button"
          class="seg-btn"
          :class="{ active: filters.media_type === 'all' }"
          @click="filters.media_type = 'all'"
        >Todo</button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: filters.media_type === 'video' }"
          @click="filters.media_type = 'video'"
        >Video</button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: filters.media_type === 'photo' }"
          @click="filters.media_type = 'photo'"
        >Foto</button>
      </div>

      <select v-model="filters.photographer_id" class="photo-filter" aria-label="Filtrar por camarógrafo">
        <option value="">Todos los camarógrafos</option>
        <option v-for="p in photographers" :key="p.id" :value="String(p.id)">
          {{ p.full_name }}
        </option>
      </select>

      <div class="toolbar-actions">
        <button
          type="button"
          class="tool-btn"
          :class="{ active: multiMode }"
          title="Selección múltiple (M)"
          @click="multiMode = !multiMode; if (!multiMode) clearMulti()"
        >
          <span class="material-icons">library_add_check</span>
          Multi
        </button>
        <button
          v-if="multiMode"
          type="button"
          class="tool-btn"
          @click="toggleSelectAllVisible"
        >
          <span class="material-icons">select_all</span>
          {{ selectedCount === items.length ? 'Ninguno' : 'Todos' }}
        </button>
        <button type="button" class="tool-btn" :disabled="loading" @click="load()">
          <span class="material-icons" :class="{ spin: loading }">refresh</span>
        </button>
      </div>
    </div>

    <p v-if="error" class="banner-error">{{ error }}</p>

    <!-- Mobile tabs -->
    <div class="mobile-tabs">
      <button
        type="button"
        :class="{ active: mobilePane === 'queue' }"
        @click="mobilePane = 'queue'"
      >
        Cola ({{ meta.total }})
      </button>
      <button
        type="button"
        :class="{ active: mobilePane === 'preview' }"
        @click="mobilePane = 'preview'"
      >
        Preview
      </button>
      <button
        type="button"
        :class="{ active: mobilePane === 'assign' }"
        @click="mobilePane = 'assign'"
      >
        Asignar
        <span v-if="selectedCount" class="badge">{{ selectedCount }}</span>
      </button>
    </div>

    <div class="workspace">
      <!-- Cola -->
      <aside class="pane pane-queue" :class="{ 'pane--hidden-mobile': mobilePane !== 'queue' }">
        <div class="pane-title">
          <span>{{ filters.scope === 'general' ? 'Bandeja General' : 'Resultados' }}</span>
          <strong>{{ meta.total }}</strong>
        </div>

        <div v-if="loading && !items.length" class="empty">
          <span class="material-icons spin">sync</span>
          <p>Cargando media…</p>
        </div>

        <div v-else-if="!items.length" class="empty">
          <span class="material-icons">check_circle</span>
          <p v-if="filters.scope === 'general'">¡Bandeja vacía! Todo clasificado.</p>
          <p v-else>No hay resultados con estos filtros.</p>
        </div>

        <template v-else>
          <div class="thumb-grid">
            <button
              v-for="(item, idx) in items"
              :key="item.id"
              type="button"
              class="thumb"
              :class="{
                'thumb--active': current?.id === item.id,
                'thumb--checked': !!selectedMap[item.id],
              }"
              @click="onThumbClick(item, $event)"
            >
              <span v-if="multiMode" class="check" :class="{ on: !!selectedMap[item.id] }">
                <span class="material-icons">{{ selectedMap[item.id] ? 'check_box' : 'check_box_outline_blank' }}</span>
              </span>
              <span class="thumb-idx">{{ (page - 1) * PAGE_SIZE + idx + 1 }}</span>
              <img
                v-if="item.media_type === 'photo' || item.thumb_url"
                :src="thumbUrl(item)"
                :alt="item.original_filename || 'media'"
                class="thumb-media"
                loading="lazy"
              />
              <div v-else class="thumb-media thumb-media--video">
                <span class="material-icons">play_circle</span>
                <small v-if="!item.has_web_preview">Procesando…</small>
              </div>
              <span class="thumb-type">
                <span class="material-icons">{{ item.media_type === 'video' ? 'videocam' : 'photo' }}</span>
              </span>
              <span v-if="item.media_type === 'video' && !item.has_web_preview" class="thumb-badge">Original</span>
              <span v-else-if="item.media_type === 'video' && item.has_web_preview" class="thumb-badge thumb-badge--ok">Web</span>
            </button>
          </div>

          <div class="pager">
            <button type="button" class="tool-btn" :disabled="!canPrevPage || loading" @click="prevPage">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="pager-label">{{ page }} / {{ meta.last_page || 1 }}</span>
            <button type="button" class="tool-btn" :disabled="!canNextPage || loading" @click="nextPage">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </template>
      </aside>

      <!-- Preview -->
      <section class="pane pane-preview" :class="{ 'pane--hidden-mobile': mobilePane !== 'preview' }">
        <template v-if="current">
          <div class="preview-stage" :class="previewOrientClass">
            <video
              v-if="current.media_type === 'video'"
              :key="'v-' + current.id + '-' + (current.has_web_preview ? 'web' : 'raw')"
              ref="previewVideoEl"
              :src="mediaPreviewUrl(current)"
              controls
              playsinline
              preload="metadata"
              class="preview-media"
              :class="[previewOrientClass, videoRotateClass]"
              @loadedmetadata="onPreviewMeta"
              @error="onVideoError"
              @loadeddata="videoError = ''"
            />
            <div
              v-if="current.media_type === 'video' && !current.has_web_preview && !videoError"
              class="preview-warn"
            >
              Sin versión web aún — puede tardar o no reproducir (HEVC/XAVC).
            </div>
            <img
              v-else-if="current.media_type === 'photo'"
              :key="'p-' + current.id"
              :src="mediaPreviewUrl(current)"
              :alt="current.original_filename || 'foto'"
              class="preview-media preview-media--photo"
              @load="onImageOrient"
            />
            <div v-if="current.media_type === 'video' && videoError" class="preview-error">
              <span class="material-icons">error_outline</span>
              <p>{{ videoError }}</p>
              <p class="preview-error-hint">
                Suele pasar con HEVC (iPhone/reels) o XAVC de cámara (~90 Mbps, moov al final).
              </p>
              <button type="button" class="preview-open" :disabled="downloading" @click="downloadOriginal(current)">
                {{ downloading ? 'Descargando…' : 'Descargar original' }}
              </button>
            </div>
          </div>

          <div class="preview-meta">
            <div class="meta-row">
              <span class="chip chip--type">
                <span class="material-icons">{{ current.media_type === 'video' ? 'videocam' : 'photo' }}</span>
                {{ current.media_type === 'video' ? 'Video' : 'Foto' }}
              </span>
              <span v-if="current.is_general" class="chip chip--general">General</span>
              <span v-else-if="current.rider" class="chip chip--assigned">
                #{{ current.rider.plate_number }} {{ current.rider.full_name }}
              </span>
              <span class="chip chip--orient">{{ orientLabel }}</span>
              <span class="meta-pos">{{ globalIndex }} / {{ meta.total }}</span>
            </div>

            <p v-if="current.has_web_preview" class="preview-quality-hint">
              Vista previa comprimida solo para ver en el navegador.
              <strong>Descarga el original</strong> para máxima calidad (tal como lo subió el camarógrafo).
            </p>

            <div class="preview-actions">
              <button
                type="button"
                class="tool-btn"
                :title="previewOrient === 'portrait' ? 'Ver en horizontal' : 'Ver en vertical'"
                @click="toggleOrient"
              >
                <span class="material-icons">{{ previewOrient === 'portrait' ? 'stay_current_landscape' : 'stay_current_portrait' }}</span>
                {{ previewOrient === 'portrait' ? 'Horizontal' : 'Vertical' }}
              </button>
              <button
                type="button"
                class="tool-btn tool-btn--dl"
                :disabled="downloading"
                @click="downloadOriginal(current)"
              >
                <span class="material-icons">{{ downloading ? 'hourglass_top' : 'download' }}</span>
                {{ downloading ? 'Descargando…' : 'Descargar original' }}
              </button>
            </div>

            <div class="meta-details">
              <span>
                <span class="material-icons">person</span>
                {{ current.photographer?.full_name || 'Sin camarógrafo' }}
              </span>
              <span>
                <span class="material-icons">schedule</span>
                {{ formatWhen(current.created_at) }}
              </span>
              <span>
                <span class="material-icons">sd_storage</span>
                {{ formatBytes(current.size_bytes) }}
              </span>
            </div>
            <div class="nav-arrows">
              <button type="button" class="tool-btn" :disabled="currentIndex <= 0" @click="selectNext(-1)">
                <span class="material-icons">chevron_left</span>
                Anterior
              </button>
              <button type="button" class="tool-btn" :disabled="currentIndex >= items.length - 1" @click="selectNext(1)">
                Siguiente
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        </template>
        <div v-else class="empty empty--preview">
          <span class="material-icons">perm_media</span>
          <p>Selecciona un archivo de la cola</p>
        </div>
      </section>

      <!-- Asignar -->
      <aside class="pane pane-assign" :class="{ 'pane--hidden-mobile': mobilePane !== 'assign' }">
        <div class="pane-title">
          <span>Asignar a competidor</span>
          <strong v-if="multiMode && selectedCount">{{ selectedCount }} sels.</strong>
        </div>

        <div v-if="recentRiders.length" class="recent-block">
          <p class="recent-label">Recientes</p>
          <div class="recent-chips">
            <button
              v-for="r in recentRiders"
              :key="r.id"
              type="button"
              class="recent-chip"
              :class="{ active: Number(selectedRiderId) === Number(r.id) }"
              @click="pickRecent(r)"
            >
              <span class="plate">#{{ r.plate_number || '—' }}</span>
              <span class="name">{{ shortName(r) }}</span>
            </button>
          </div>
        </div>

        <label class="search-label">Competidor</label>
        <div class="select-wrap">
          <AppSelect
            v-model="selectedRiderId"
            :options="riderSelectOptions"
            placeholder="Escribe placa o nombre…"
            icon="badge"
            searchable
          />
        </div>

        <div class="assign-actions">
          <button
            type="button"
            class="assign-btn"
            :disabled="!selectedRider || assigning || (!current && !selectedCount)"
            @click="doAssign"
          >
            <span class="material-icons">{{ assigning ? 'sync' : 'person_add' }}</span>
            <span v-if="multiMode && selectedCount > 1">
              Asignar {{ selectedCount }} → #{{ selectedRider?.plate_number || '—' }}
            </span>
            <span v-else>
              Asignar → #{{ selectedRider?.plate_number || '—' }}
            </span>
          </button>

          <button
            v-if="filters.scope !== 'general' && current && !current.is_general"
            type="button"
            class="tool-btn danger-outline"
            :disabled="assigning"
            @click="unassignCurrent"
          >
            <span class="material-icons">undo</span>
            Devolver a General
          </button>
        </div>

        <div class="shortcuts">
          <p><kbd>←</kbd><kbd>→</kbd> navegar (cambia de página al borde)</p>
          <p><kbd>Enter</kbd> asignar · <kbd>M</kbd> multi · <kbd>Esc</kbd> limpiar</p>
          <p>Página {{ page }}/{{ meta.last_page || 1 }} · {{ PAGE_SIZE }} por página</p>
        </div>
      </aside>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">
        <span class="material-icons">task_alt</span>
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import AppSelect from '../../../components/ui/AppSelect.vue';
import { useClassifyMedia } from '../composables/useClassifyMedia.js';

const mobilePane = ref('preview');
const videoError = ref('');
const previewOrient = ref('landscape'); // landscape | portrait
const orientManual = ref(false);
const measuredOrient = ref(null); // landscape | portrait | null

const previewOrientClass = computed(() => (
  previewOrient.value === 'portrait' ? 'is-portrait' : 'is-landscape'
));

const orientLabel = computed(() => (
  previewOrient.value === 'portrait' ? 'Vertical' : 'Horizontal'
));

function toggleOrient() {
  orientManual.value = true;
  previewOrient.value = previewOrient.value === 'portrait' ? 'landscape' : 'portrait';
}

function applyItemOrientation(item, pixelOrient) {
  measuredOrient.value = pixelOrient || null;
  if (orientManual.value) return;
  // Preview web ya upright → siempre confiar en píxeles reales.
  if (item?.has_web_preview && pixelOrient) {
    previewOrient.value = pixelOrient;
    return;
  }
  if (item?.orientation === 'portrait' || item?.orientation === 'landscape') {
    previewOrient.value = item.orientation;
    return;
  }
  previewOrient.value = pixelOrient || 'landscape';
}

function onVideoError() {
  videoError.value = 'Este navegador no pudo reproducir el archivo original.';
}

function onPreviewMeta(e) {
  const el = e?.target;
  const w = Number(el?.videoWidth) || 0;
  const h = Number(el?.videoHeight) || 0;
  const pixelOrient = h > w ? 'portrait' : 'landscape';
  applyItemOrientation(current.value, pixelOrient);
  videoError.value = '';
}

function onImageOrient(e) {
  const el = e?.target;
  const w = Number(el?.naturalWidth) || 0;
  const h = Number(el?.naturalHeight) || 0;
  const pixelOrient = h > w ? 'portrait' : 'landscape';
  measuredOrient.value = pixelOrient;
  if (orientManual.value) return;
  previewOrient.value = pixelOrient;
}

const {
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
  selectedMap,
  multiMode,
  selectedRiderId,
  selectedRider,
  recentRiders,
  riderSelectOptions,
  current,
  currentIndex,
  globalIndex,
  selectedCount,
  canPrevPage,
  canNextPage,
  selectItem,
  selectNext,
  toggleSelectAllVisible,
  clearMulti,
  pickRecent,
  assignCurrent,
  unassignCurrent,
  nextPage,
  prevPage,
  mediaPreviewUrl,
  downloadOriginal,
  formatBytes,
  formatWhen,
} = useClassifyMedia();

/** CSS rotate: original con metadata, o override manual vs píxeles del archivo. */
const videoRotateClass = computed(() => {
  const item = current.value;
  if (!item || item.media_type !== 'video') return '';

  if (orientManual.value && measuredOrient.value && previewOrient.value !== measuredOrient.value) {
    // Usuario pide el otro marco → girar 90° para enderezar contenido de costado.
    return 'needs-rotate-270';
  }

  if (item.has_web_preview) return '';
  const r = Math.abs(Number(item.rotation) || 0) % 360;
  if (r === 90) return 'needs-rotate-90';
  if (r === 270) return 'needs-rotate-270';
  if (r === 180) return 'needs-rotate-180';
  return '';
});

function thumbUrl(item) {
  return mediaPreviewUrl({ view_url: item.thumb_url || item.view_url });
}

function shortName(r) {
  const n = String(r.full_name || '').trim();
  if (n.length <= 14) return n;
  return `${n.slice(0, 12)}…`;
}

function onThumbClick(item, event) {
  const toggleMulti = event.shiftKey || multiMode.value;
  selectItem(item.id, { toggleMulti });
  if (!multiMode.value) mobilePane.value = 'preview';
}

async function doAssign() {
  const ok = await assignCurrent();
  if (ok && window.matchMedia('(max-width: 1023px)').matches) {
    mobilePane.value = items.value.length ? 'preview' : 'queue';
  }
}

watch(
  () => current.value?.id,
  () => {
    videoError.value = '';
    orientManual.value = false;
    measuredOrient.value = null;
    const item = current.value;
    // Con preview web, no forzar portrait por metadata; loadedmetadata corrige.
    if (item?.has_web_preview) {
      previewOrient.value = 'landscape';
    } else if (item?.orientation === 'portrait' || item?.orientation === 'landscape') {
      previewOrient.value = item.orientation;
    } else {
      previewOrient.value = 'landscape';
    }
  },
);
</script>

<style scoped>
.classify-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 120px);
  padding-bottom: 24px;
}

.classify-head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: flex-end;
  justify-content: space-between;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.classify-head h1 {
  margin: 0;
  font-family: var(--font-headings);
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.sub {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  max-width: 42rem;
}

.comp-pill {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
}

.head-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(72px, 1fr));
  gap: 8px;
}

.stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: var(--shadow-premium);
  min-width: 0;
}

.stat--warn {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
}

.stat-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.stat-value {
  font-family: var(--font-headings);
  font-size: 1.35rem;
  color: var(--color-text-primary);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.seg {
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
}

.seg-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 9px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.seg-btn.active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.badge {
  display: inline-flex;
  min-width: 1.4em;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.photo-filter {
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 13px;
  padding: 0 12px;
  max-width: 220px;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.tool-btn {
  appearance: none;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 600;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tool-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tool-btn.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
}

.tool-btn.danger-outline {
  color: var(--color-error);
  border-color: color-mix(in srgb, var(--color-error) 40%, var(--color-border));
}

.banner-error {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  color: var(--color-error);
  font-weight: 600;
}

.mobile-tabs {
  display: none;
  gap: 6px;
}

.mobile-tabs button {
  flex: 1;
  min-height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.mobile-tabs button.active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(200px, 260px) minmax(0, 1fr) minmax(260px, 320px);
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.pane {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  min-height: 420px;
  overflow: hidden;
}

.pane.pane-assign {
  overflow: visible;
}

.pane-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.pane-title strong {
  color: var(--color-primary);
  font-size: 14px;
}

.thumb-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}

.thumb {
  position: relative;
  appearance: none;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
  aspect-ratio: 1;
  background: #111;
  cursor: pointer;
}

.thumb--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.thumb--checked {
  border-color: var(--color-success);
}

.thumb-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.thumb-media--video {
  display: grid;
  place-items: center;
  gap: 4px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 94, 0, 0.35), transparent 45%),
    #111;
  color: rgba(255, 255, 255, 0.85);
}

.thumb-media--video .material-icons {
  font-size: 36px;
}

.thumb-media--video small {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.75;
}

.thumb-badge {
  position: absolute;
  left: 6px;
  bottom: 6px;
  z-index: 1;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: #fbbf24;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.thumb-badge--ok {
  color: #6ee7b7;
}

.preview-warn {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.88);
  color: #fde68a;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.preview-error {
  position: absolute;
  inset: 12px;
  margin: auto;
  max-width: 420px;
  height: fit-content;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 2;
}

.preview-error .material-icons {
  color: #fbbf24;
  font-size: 28px;
}

.preview-error p {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.preview-error-hint {
  font-size: 12px !important;
  font-weight: 500 !important;
  opacity: 0.8;
}

.preview-open {
  margin-top: 4px;
  color: #fdba74;
  font-weight: 700;
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.preview-open:disabled {
  opacity: 0.6;
  cursor: wait;
}

.thumb-idx {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}

.thumb-type {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: grid;
  place-items: center;
}

.thumb-type .material-icons {
  font-size: 14px;
}

.check {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.check.on {
  color: #34d399;
}

.pane-preview {
  min-height: 480px;
}

.preview-stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 55%),
    #0a0a0a;
  min-height: 280px;
  padding: 12px;
  overflow: hidden;
}

.preview-stage.is-portrait {
  /* Marco vertical: no estira a todo el ancho */
  align-items: center;
}

.preview-media {
  border-radius: 10px;
  object-fit: contain;
  background: #000;
}

/* Originales con metadata rotate que el navegador no aplica */
.preview-media.needs-rotate-90 {
  transform: rotate(90deg);
}
.preview-media.needs-rotate-270 {
  transform: rotate(-90deg);
}
.preview-media.needs-rotate-180 {
  transform: rotate(180deg);
}

.preview-media.is-landscape,
.preview-stage.is-landscape .preview-media {
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: min(58vh, 560px);
}

.preview-media.is-portrait,
.preview-stage.is-portrait .preview-media {
  width: auto;
  max-width: min(100%, 420px);
  height: min(62vh, 640px);
  max-height: min(62vh, 640px);
}

.preview-media--photo {
  max-width: 100%;
  max-height: min(58vh, 560px);
}

.chip--orient {
  background: color-mix(in srgb, #38bdf8 18%, transparent);
  color: #7dd3fc;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--color-border);
}

.pager-label {
  font-family: var(--font-headings);
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-secondary);
  min-width: 64px;
  text-align: center;
}

.select-wrap {
  margin: 0 14px 4px;
  position: relative;
  z-index: 5;
}

.preview-meta {
  padding: 12px 14px 14px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-quality-hint {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-secondary) 12%, transparent);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.preview-quality-hint strong {
  color: var(--color-text-primary);
  font-weight: 700;
}

.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-btn--dl {
  background: color-mix(in srgb, var(--color-secondary) 22%, transparent);
  border-color: color-mix(in srgb, var(--color-secondary) 45%, transparent);
  color: var(--color-text-primary);
  font-weight: 700;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-pos {
  margin-left: auto;
  font-family: var(--font-headings);
  font-weight: 700;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.chip .material-icons {
  font-size: 14px;
}

.chip--type {
  background: var(--color-input-bg);
  color: var(--color-text-primary);
}

.chip--general {
  background: color-mix(in srgb, var(--color-secondary) 20%, transparent);
  color: #92400e;
}

.dark-theme .chip--general {
  color: var(--color-secondary);
}

.chip--assigned {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.meta-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.meta-details span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-details .material-icons {
  font-size: 16px;
}

.nav-arrows {
  display: flex;
  gap: 8px;
}

.pane-assign {
  padding-bottom: 12px;
  overflow: visible;
}

.recent-block {
  padding: 10px 14px 0;
}

.recent-label {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.recent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recent-chip {
  appearance: none;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family);
  max-width: 100%;
}

.recent-chip.active {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
}

.recent-chip .plate {
  font-weight: 800;
  color: var(--color-primary);
  font-size: 12px;
}

.recent-chip .name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 110px;
}

.search-label {
  display: block;
  padding: 12px 14px 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.search-box {
  margin: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 14px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.search-box input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 600;
  min-width: 0;
}

.rider-results {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
}

.rider-row {
  appearance: none;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-family);
}

.rider-row.active {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
}

.rider-plate {
  flex-shrink: 0;
  min-width: 48px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #0f172a;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}

.dark-theme .rider-plate {
  background: #1e293b;
}

.rider-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rider-info strong {
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-info small {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.rider-row .ok {
  color: var(--color-success);
}

.no-riders {
  margin: 8px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.assign-actions {
  padding: 12px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assign-btn {
  appearance: none;
  border: 0;
  min-height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #FF5E00, #E11D48);
  color: #fff;
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(255, 94, 0, 0.28);
}

.assign-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.shortcuts {
  margin-top: auto;
  padding: 14px;
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 1.6;
}

.shortcuts p {
  margin: 0;
}

kbd {
  display: inline-block;
  padding: 1px 6px;
  margin-right: 2px;
  border-radius: 5px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  font-family: var(--font-family);
  font-size: 10px;
  font-weight: 700;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-secondary);
  padding: 24px;
  text-align: center;
}

.empty .material-icons {
  font-size: 40px;
  color: var(--color-success);
  opacity: 0.85;
}

.empty--preview .material-icons {
  color: var(--color-text-secondary);
}

.spin {
  animation: spin 0.9s linear infinite;
}

.tiny {
  font-size: 16px !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 80;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 14px;
  background: #0f172a;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  max-width: min(92vw, 420px);
}

.dark-theme .toast {
  background: #1e293b;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 200px minmax(0, 1fr) 260px;
  }
}

@media (max-width: 1023px) {
  .classify-root {
    min-height: auto;
    padding-bottom: var(--mobile-dock-clearance);
  }

  .head-stats {
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
  }

  .mobile-tabs {
    display: flex;
  }

  .workspace {
    grid-template-columns: 1fr;
  }

  .pane {
    min-height: 60vh;
  }

  .pane--hidden-mobile {
    display: none;
  }

  .shortcuts {
    display: none;
  }

  .toast {
    bottom: var(--mobile-dock-clearance);
  }
}

@media (max-width: 599px) {
  .toolbar-actions {
    margin-left: 0;
    width: 100%;
  }

  .photo-filter {
    max-width: none;
    width: 100%;
  }
}
</style>
