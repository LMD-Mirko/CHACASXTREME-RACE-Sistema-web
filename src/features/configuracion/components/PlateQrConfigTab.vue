<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Placas QR 4×4 cm</h2>
        <p>
          Genera un PDF A4 con stickers de <strong>40×40 mm</strong> para las
          <strong>{{ plateMax || 150 }} placas</strong> del inventario.
          Se imprimen ya; al escanear se vinculan al competidor que tenga esa placa asignada.
        </p>
      </div>
      <AppButton variant="secondary" :disabled="loading" @click="load">
        <span class="material-icons">refresh</span>
        Actualizar
      </AppButton>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="toast" class="toast">{{ toast }}</p>

    <div class="toolbar">
      <div class="form-group">
        <label>Incluir</label>
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Todas"
          icon="filter_alt"
        />
      </div>
      <div class="form-group">
        <label>Filtrar categoría (solo asignadas)</label>
        <AppSelect
          v-model="categoryFilter"
          :options="categoryOptions"
          placeholder="Todas"
          icon="category"
        />
      </div>
      <div class="stats-inline">
        <span>{{ filteredPlates.length }} stickers</span>
        <span>·</span>
        <span>{{ pagesEstimate }} hoja(s)</span>
        <span>·</span>
        <span>{{ takenCount }} asignadas</span>
        <span>·</span>
        <span>{{ competitionName || 'Sin competencia' }}</span>
      </div>
      <AppButton :loading="generating" :disabled="!filteredPlates.length || generating" @click="generate">
        <span class="material-icons">picture_as_pdf</span>
        Descargar PDF
      </AppButton>
    </div>

    <div v-if="loading" class="muted">Cargando catálogo de placas…</div>

    <div v-else class="preview-grid">
      <article v-for="p in filteredPlates.slice(0, 12)" :key="p.plate_number" class="mini">
        <canvas :ref="(el) => setCanvasRef(p.plate_number, el)" class="mini-canvas" />
        <div class="mini-meta">
          <strong>#{{ p.plate_number }}</strong>
          <span v-if="p.taken">{{ p.full_name || p.rider?.full_name }}</span>
          <span v-else class="free">Sin asignar</span>
        </div>
      </article>
      <p v-if="!filteredPlates.length" class="muted">No hay placas para este filtro.</p>
      <p v-else-if="filteredPlates.length > 12" class="muted more">
        +{{ filteredPlates.length - 12 }} más en el PDF…
      </p>
    </div>

    <p v-if="progress" class="muted">{{ progress }}</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import api from '../../../core/network/axios';
import { getCategories } from '../services/configuracionService.js';
import { GRID, renderStickerCanvas, buildPlateQrPdf } from '../utils/plateQrPdf.js';

const loading = ref(false);
const generating = ref(false);
const error = ref('');
const toast = ref('');
const progress = ref('');
const plates = ref([]);
const competitionName = ref('');
const plateMax = ref(150);
const categoryFilter = ref('');
const statusFilter = ref('all');
const categories = ref([]);
const canvasMap = new Map();
let paintGen = 0;

const statusOptions = [
  { value: 'all', label: 'Todas (1–150)' },
  { value: 'free', label: 'Solo libres' },
  { value: 'taken', label: 'Solo asignadas' },
];

const categoryOptions = computed(() => [
  { value: '', label: 'Todas las categorías' },
  ...categories.value.map((c) => ({ value: String(c.id), label: c.name })),
]);

const filteredPlates = computed(() => {
  let list = plates.value;
  if (statusFilter.value === 'free') {
    list = list.filter((p) => !p.taken);
  } else if (statusFilter.value === 'taken') {
    list = list.filter((p) => p.taken);
  }
  if (categoryFilter.value) {
    list = list.filter((p) => String(p.category_id) === String(categoryFilter.value));
  }
  return list;
});

const takenCount = computed(() => plates.value.filter((p) => p.taken).length);

const pagesEstimate = computed(() => {
  const per = GRID.cols * GRID.rows;
  return Math.max(1, Math.ceil((filteredPlates.value.length || 0) / per));
});

function setCanvasRef(id, el) {
  if (el) canvasMap.set(id, el);
  else canvasMap.delete(id);
}

function stickerModel(p) {
  return {
    plate_number: p.plate_number,
    payload: p.payload,
    url: p.url,
    category_name: p.category_name || p.rider?.category_name || null,
    full_name: p.full_name || p.rider?.full_name || null,
  };
}

async function paintPreviews() {
  if (loading.value) return;
  const gen = ++paintGen;
  await nextTick();
  await new Promise((r) => requestAnimationFrame(() => r()));
  await new Promise((r) => requestAnimationFrame(() => r()));
  if (loading.value || gen !== paintGen) return;

  const subset = filteredPlates.value.slice(0, 12);
  for (const p of subset) {
    if (gen !== paintGen) return;
    let host = canvasMap.get(p.plate_number);
    // Ref a veces llega un frame tarde tras v-if loading
    if (!host) {
      await nextTick();
      host = canvasMap.get(p.plate_number);
    }
    if (!host || !p.payload) continue;
    try {
      const src = await renderStickerCanvas(stickerModel(p), { pxPerMm: 6 });
      if (gen !== paintGen) return;
      // Re-leer ref por si Vue remountó el canvas durante el await
      host = canvasMap.get(p.plate_number) || host;
      const ctx = host.getContext('2d');
      host.width = src.width;
      host.height = src.height;
      ctx.clearRect(0, 0, host.width, host.height);
      ctx.drawImage(src, 0, 0);
    } catch (e) {
      console.warn('Preview QR falló', p.plate_number, e);
    }
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [cat, res] = await Promise.all([
      getCategories().catch(() => []),
      api.get('/api/admin/plate-qr'),
    ]);
    categories.value = cat || [];
    const data = res.data?.data;
    competitionName.value = data?.competition?.name || '';
    plateMax.value = data?.plate_max || 150;
    plates.value = data?.plates || data?.riders || [];
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar.';
  } finally {
    loading.value = false;
    await paintPreviews();
  }
}

async function generate() {
  generating.value = true;
  error.value = '';
  progress.value = '';
  try {
    const list = filteredPlates.value.map(stickerModel);
    const result = await buildPlateQrPdf(list, {
      competitionName: competitionName.value,
      onProgress: (n, total) => {
        progress.value = `Generando sticker ${n} / ${total}…`;
      },
    });
    toast.value = `PDF listo: ${result.filename} (${result.count} stickers, ${result.pages} hojas).`;
    setTimeout(() => { toast.value = ''; }, 4000);
  } catch (e) {
    error.value = e.message || 'No se pudo generar el PDF.';
  } finally {
    generating.value = false;
    progress.value = '';
  }
}

watch(filteredPlates, () => {
  paintPreviews();
});

onMounted(load);
</script>

<style scoped>
.media-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.media-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.media-head h2 {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  color: var(--color-text-primary);
}

.media-head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  max-width: 42rem;
  line-height: 1.4;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  align-items: flex-end;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  flex: 1;
}

@media (max-width: 480px) {
  .form-group {
    min-width: 0;
    width: 100%;
  }
}

.form-group > label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.stats-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  padding-bottom: 0.55rem;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.mini {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-surface);
}

.mini-canvas {
  width: 100%;
  aspect-ratio: 1;
  display: block;
  background: #0a0a0a;
}

.mini-meta {
  padding: 0.45rem 0.55rem 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.mini-meta strong {
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.mini-meta span {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-meta .free {
  color: #ca8a04;
  font-weight: 600;
}

.more { grid-column: 1 / -1; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0; }
.toast { color: #059669; font-weight: 700; margin: 0; }
.muted { color: var(--color-text-secondary); margin: 0; }
</style>
