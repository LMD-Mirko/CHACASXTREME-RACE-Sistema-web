<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Media 4ª edición — ZIP</h2>
        <p>Descarga originales de la competencia activa (igual que en Filament).</p>
      </div>
      <AppButton variant="secondary" :disabled="loading" @click="load">
        <span class="material-icons">refresh</span>
        Actualizar
      </AppButton>
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

      <form class="zip-form" @submit.prevent="download">
        <div class="form-group">
          <label>Alcance</label>
          <AppSelect
            v-model="form.scope"
            :options="scopeOptions"
            placeholder="Selecciona alcance"
            icon="folder_open"
          />
        </div>

        <div v-if="form.scope === 'competitor'" class="form-group">
          <label>Competidor</label>
          <AppSelect
            v-model="form.rider_id"
            :options="riderOptions"
            placeholder="Selecciona un competidor"
            icon="badge"
          />
        </div>

        <div class="form-group">
          <label>Tipo</label>
          <AppSelect
            v-model="form.media_type"
            :options="mediaTypeOptions"
            placeholder="Selecciona tipo"
            icon="perm_media"
          />
        </div>

        <AppButton type="submit" :loading="downloading" :disabled="downloading">
          <span class="material-icons">download</span>
          {{ downloading ? 'Generando ZIP…' : 'Descargar ZIP' }}
        </AppButton>
      </form>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
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

const scopeOptions = [
  { value: 'all', label: 'Todo (competidores + general)' },
  { value: 'general', label: 'Solo general' },
  { value: 'competitors', label: 'Solo competidores' },
  { value: 'competitor', label: 'Un competidor' },
];

const mediaTypeOptions = [
  { value: 'photo', label: 'Solo fotos' },
  { value: 'video', label: 'Solo videos' },
  { value: 'all', label: 'Fotos y videos' },
];

const riderOptions = computed(() =>
  (stats.value.riders || []).map((r) => ({
    value: r.id,
    label: r.label,
  })),
);

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
  if (form.scope === 'competitor' && !form.rider_id) {
    error.value = 'Selecciona un competidor.';
    return;
  }

  downloading.value = true;
  error.value = '';
  try {
    await downloadEdition4MediaZip({
      scope: form.scope,
      media_type: form.media_type,
      rider_id: form.scope === 'competitor' ? Number(form.rider_id) : null,
    });
  } catch (e) {
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
}

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
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat span {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat strong {
  color: var(--color-text-primary);
  font-size: 1rem;
}

.zip-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 440px;
  padding: 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  overflow: visible;
  position: relative;
  z-index: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group > label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}

.muted {
  color: var(--color-text-secondary);
}
</style>
