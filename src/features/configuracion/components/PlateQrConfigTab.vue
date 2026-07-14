<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Placas QR 4×4 cm</h2>
        <p>
          Genera un PDF A4 con stickers de <strong>40×40 mm</strong> apilados (5×7 = 35 por hoja)
          para imprimir en vinilo. QR firmado + número de placa al centro.
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
        <label>Filtrar categoría</label>
        <AppSelect
          v-model="categoryFilter"
          :options="categoryOptions"
          placeholder="Todas"
          icon="category"
        />
      </div>
      <div class="stats-inline">
        <span>{{ filteredRiders.length }} placas</span>
        <span>·</span>
        <span>{{ pagesEstimate }} hoja(s)</span>
        <span>·</span>
        <span>{{ competitionName || 'Sin competencia' }}</span>
      </div>
      <AppButton :loading="generating" :disabled="!filteredRiders.length || generating" @click="generate">
        <span class="material-icons">picture_as_pdf</span>
        Descargar PDF
      </AppButton>
    </div>

    <div v-if="loading" class="muted">Cargando competidores con placa…</div>

    <div v-else class="preview-grid">
      <article v-for="r in filteredRiders.slice(0, 12)" :key="r.id" class="mini">
        <canvas :ref="(el) => setCanvasRef(r.id, el)" class="mini-canvas" />
        <div class="mini-meta">
          <strong>#{{ r.plate_number }}</strong>
          <span>{{ r.full_name }}</span>
        </div>
      </article>
      <p v-if="!filteredRiders.length" class="muted">No hay riders con número de placa.</p>
      <p v-else-if="filteredRiders.length > 12" class="muted more">
        +{{ filteredRiders.length - 12 }} más en el PDF…
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
const riders = ref([]);
const competitionName = ref('');
const categoryFilter = ref('');
const categories = ref([]);
const canvasMap = new Map();

const categoryOptions = computed(() => [
  { value: '', label: 'Todas las categorías' },
  ...categories.value.map((c) => ({ value: String(c.id), label: c.name })),
]);

const filteredRiders = computed(() => {
  if (!categoryFilter.value) return riders.value;
  return riders.value.filter((r) => String(r.category_id) === String(categoryFilter.value));
});

const pagesEstimate = computed(() => {
  const per = GRID.cols * GRID.rows;
  return Math.max(1, Math.ceil((filteredRiders.value.length || 0) / per));
});

function setCanvasRef(id, el) {
  if (el) canvasMap.set(id, el);
  else canvasMap.delete(id);
}

async function paintPreviews() {
  await nextTick();
  const subset = filteredRiders.value.slice(0, 12);
  for (const r of subset) {
    const host = canvasMap.get(r.id);
    if (!host) continue;
    const src = await renderStickerCanvas(r, { pxPerMm: 6 });
    const ctx = host.getContext('2d');
    host.width = src.width;
    host.height = src.height;
    ctx.clearRect(0, 0, host.width, host.height);
    ctx.drawImage(src, 0, 0);
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
    riders.value = data?.riders || [];
    await paintPreviews();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar.';
  } finally {
    loading.value = false;
  }
}

async function generate() {
  generating.value = true;
  error.value = '';
  progress.value = '';
  try {
    const result = await buildPlateQrPdf(filteredRiders.value, {
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

watch(filteredRiders, () => {
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
  max-width: 40rem;
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
  min-width: 220px;
  flex: 1;
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

.more { grid-column: 1 / -1; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0; }
.toast { color: #059669; font-weight: 700; margin: 0; }
.muted { color: var(--color-text-secondary); margin: 0; }
</style>
