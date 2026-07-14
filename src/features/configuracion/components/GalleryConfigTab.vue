<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Galería web</h2>
        <p>Imágenes de marketing (misma galería del panel Filament).</p>
      </div>
      <AppButton @click="openCreate">
        <span class="material-icons">add_photo_alternate</span>
        Subir
      </AppButton>
    </header>

    <p v-if="toast" class="toast">{{ toast }}</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="loading" class="muted">Cargando…</div>

    <div v-else class="grid">
      <article v-for="item in items" :key="item.id" class="thumb">
        <img :src="item.image_url || item.image_path" :alt="item.title || 'Galería'" />
        <div class="info">
          <strong>{{ item.title || 'Sin título' }}</strong>
          <span>{{ item.image_type?.name || item.imageType?.name || '—' }}</span>
        </div>
        <div class="actions">
          <AppButton variant="secondary" @click="openEdit(item)">Editar</AppButton>
          <AppButton variant="danger" @click="remove(item)">Eliminar</AppButton>
        </div>
      </article>
      <p v-if="!items.length" class="muted">No hay imágenes aún.</p>
    </div>

    <AppModal
      :is-open="modalOpen"
      :title="editing ? 'Editar imagen' : 'Subir imagen'"
      max-width="520px"
      allow-overflow
      @close="modalOpen = false"
    >
      <form id="gallery-form" class="gallery-form" @submit.prevent="save">
        <div class="form-group">
          <label>Tipo *</label>
          <AppSelect
            v-model="form.image_type_id"
            :options="typeOptions"
            placeholder="Selecciona un tipo"
            icon="category"
          />
        </div>

        <div class="form-group">
          <label for="gallery_title">Título</label>
          <AppInput
            id="gallery_title"
            v-model="form.title"
            placeholder="Título opcional"
          />
        </div>

        <div class="form-group">
          <label for="gallery_description">Descripción</label>
          <textarea
            id="gallery_description"
            v-model="form.description"
            class="app-textarea"
            rows="3"
            placeholder="Descripción opcional"
          />
        </div>

        <div class="file-upload">
          <span class="field-label">Archivo {{ editing ? '(opcional al editar)' : '*' }}</span>
          <div class="file-row">
            <button type="button" class="file-preview" @click="triggerFileInput">
              <img v-if="displayPreview" :src="displayPreview" alt="Vista previa" />
              <div v-else class="file-placeholder">
                <span class="material-icons">add_photo_alternate</span>
                <span>Foto</span>
              </div>
            </button>
            <div class="file-actions">
              <AppButton type="button" variant="secondary" @click="triggerFileInput">
                <span class="material-icons">upload_file</span>
                {{ imageFileName || 'Seleccionar archivo' }}
              </AppButton>
              <p class="help">JPG, PNG o WEBP. Máx. 10MB.</p>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden-file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="onFile"
          />
        </div>

        <p v-if="modalError" class="error">{{ modalError }}</p>
      </form>

      <template #footer>
        <AppButton variant="secondary" @click="modalOpen = false">Cancelar</AppButton>
        <AppButton type="submit" form="gallery-form" :loading="saving">Guardar</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  listGalleryTypes,
  listGalleryAdmin,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '../services/mediaAdminService.js';

const items = ref([]);
const types = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const toast = ref('');
const modalOpen = ref(false);
const modalError = ref('');
const editing = ref(null);
const imageFile = ref(null);
const previewUrl = ref('');
const fileInput = ref(null);

const form = reactive({
  image_type_id: '',
  title: '',
  description: '',
});

const typeOptions = computed(() =>
  (types.value || []).map((t) => ({ value: t.id, label: t.name })),
);

const displayPreview = computed(
  () => previewUrl.value || editing.value?.image_url || '',
);

const imageFileName = computed(() => imageFile.value?.name || '');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [g, t] = await Promise.all([listGalleryAdmin(), listGalleryTypes()]);
    items.value = g;
    types.value = t;
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar.';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.image_type_id = types.value[0]?.id || '';
  form.title = '';
  form.description = '';
  imageFile.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
  if (fileInput.value) fileInput.value.value = '';
  modalError.value = '';
  modalOpen.value = true;
}

function openEdit(item) {
  editing.value = item;
  form.image_type_id = item.image_type_id || item.image_type?.id || '';
  form.title = item.title || '';
  form.description = item.description || '';
  imageFile.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
  if (fileInput.value) fileInput.value.value = '';
  modalError.value = '';
  modalOpen.value = true;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFile(e) {
  const file = e.target.files?.[0] || null;
  imageFile.value = file;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = file ? URL.createObjectURL(file) : '';
}

async function save() {
  saving.value = true;
  modalError.value = '';
  try {
    if (!form.image_type_id) throw new Error('Selecciona un tipo.');
    const payload = {
      image_type_id: form.image_type_id,
      title: form.title || null,
      description: form.description || null,
    };
    if (editing.value) {
      await updateGalleryItem(editing.value.id, payload, imageFile.value);
    } else {
      if (!imageFile.value) throw new Error('Sube una imagen.');
      await createGalleryItem(payload, imageFile.value);
    }
    modalOpen.value = false;
    toast.value = 'Imagen guardada.';
    setTimeout(() => { toast.value = ''; }, 2500);
    await load();
  } catch (e) {
    modalError.value = e.friendlyMessage || e.message || 'No se pudo guardar.';
  } finally {
    saving.value = false;
  }
}

async function remove(item) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  try {
    await deleteGalleryItem(item.id);
    await load();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo eliminar.';
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.thumb {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
}

.thumb img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--color-input-bg);
}

.info {
  padding: 0.55rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.info strong {
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.info span {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
}

.actions {
  display: flex;
  gap: 0.35rem;
  padding: 0 0.55rem 0.55rem;
  flex-wrap: wrap;
}

.gallery-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group > label,
.field-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.app-textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 84px;
}

.app-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.file-preview {
  width: 96px;
  height: 72px;
  border-radius: 12px;
  border: 2px dashed var(--color-border);
  background: var(--color-input-bg);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: border-color 0.2s ease;
}

.file-preview:hover {
  border-color: var(--color-primary);
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
}

.file-placeholder .material-icons {
  font-size: 22px;
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.help {
  margin: 0;
  font-size: 11.5px;
  color: var(--color-text-secondary);
}

.hidden-file {
  display: none;
}

.toast { color: #059669; font-weight: 700; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0; }
.muted { color: var(--color-text-secondary); }

@media (max-width: 600px) {
  .file-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
