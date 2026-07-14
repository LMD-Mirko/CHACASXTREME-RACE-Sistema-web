<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Media 4ª edición — ZIP</h2>
        <p>Descarga originales de la competencia activa (igual que en Filament).</p>
      </div>
      <button type="button" class="btn-ghost" :disabled="loading" @click="load">
        <span class="material-icons">refresh</span>
        Actualizar
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="loading" class="muted">Cargando resumen…</div>

    <template v-else>
      <div class="stats">
        <div class="stat"><span>Competencia</span><strong>{{ stats.competition || '—' }}</strong></div>
        <div class="stat"><span>Fotos</span><strong>{{ stats.photos ?? 0 }}</strong></div>
        <div class="stat"><span>Videos</span><strong>{{ stats.videos ?? 0 }}</strong></div>
        <div class="stat"><span>General</span><strong>{{ stats.general_photos ?? 0 }}</strong></div>
        <div class="stat"><span>Competidores</span><strong>{{ stats.competitor_photos ?? 0 }}</strong></div>
      </div>

      <form class="form" @submit.prevent="download">
        <label>
          <span>Alcance</span>
          <select v-model="form.scope">
            <option value="all">Todo (competidores + general)</option>
            <option value="general">Solo general</option>
            <option value="competitors">Solo competidores</option>
            <option value="competitor">Un competidor</option>
          </select>
        </label>

        <label v-if="form.scope === 'competitor'">
          <span>Competidor</span>
          <select v-model="form.rider_id" required>
            <option disabled value="">Selecciona…</option>
            <option v-for="r in stats.riders || []" :key="r.id" :value="r.id">{{ r.label }}</option>
          </select>
        </label>

        <label>
          <span>Tipo</span>
          <select v-model="form.media_type">
            <option value="photo">Solo fotos</option>
            <option value="video">Solo videos</option>
            <option value="all">Fotos y videos</option>
          </select>
        </label>

        <button type="submit" class="btn-primary" :disabled="downloading">
          <span class="material-icons">download</span>
          {{ downloading ? 'Generando ZIP…' : 'Descargar ZIP' }}
        </button>
      </form>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import {
  fetchEdition4MediaStats,
  downloadEdition4MediaZip,
} from '../services/mediaAdminService.js';

const stats = ref({});
const loading = ref(false);
const downloading = ref(false);
const error = ref('');
const form = reactive({
  scope: 'all',
  media_type: 'photo',
  rider_id: '',
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    stats.value = await fetchEdition4MediaStats();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar el resumen.';
  } finally {
    loading.value = false;
  }
}

async function download() {
  downloading.value = true;
  error.value = '';
  try {
    await downloadEdition4MediaZip({
      scope: form.scope,
      media_type: form.media_type,
      rider_id: form.scope === 'competitor' ? Number(form.rider_id) : null,
    });
  } catch (e) {
    // Axios blob errors may hide JSON message
    let msg = e.friendlyMessage || e.message || 'No se pudo descargar.';
    try {
      if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        const json = JSON.parse(text);
        msg = json.message || msg;
      }
    } catch { /* ignore */ }
    error.value = msg;
  } finally {
    downloading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.media-tab { display: flex; flex-direction: column; gap: 1rem; }
.media-head { display: flex; justify-content: space-between; gap: 1rem; }
.media-head h2 { margin: 0 0 0.25rem; font-size: 1.15rem; color: var(--color-text-primary); }
.media-head p { margin: 0; color: var(--color-text-secondary); font-size: 0.88rem; }
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.6rem;
}
.stat {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  background: var(--color-surface);
  display: flex; flex-direction: column; gap: 0.2rem;
}
.stat span { font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.stat strong { color: var(--color-text-primary); font-size: 1rem; }
.form {
  display: flex; flex-direction: column; gap: 0.75rem;
  max-width: 420px;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}
label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; }
select {
  border: 1px solid var(--color-border); border-radius: 10px; padding: 0.55rem 0.7rem;
  background: var(--color-input-bg); color: var(--color-text-primary);
}
.btn-primary, .btn-ghost {
  border-radius: 10px; border: 1px solid var(--color-border); padding: 0.55rem 0.85rem;
  font-weight: 700; cursor: pointer; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 0.35rem; width: fit-content;
}
.btn-primary { background: #ff5e00; color: #fff; border-color: #ff5e00; }
.btn-ghost { background: var(--color-input-bg); color: var(--color-text-primary); }
.error { color: #dc2626; font-size: 0.85rem; }
.muted { color: var(--color-text-secondary); }
</style>
