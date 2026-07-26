<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Galería web</h2>
        <p>Elegí la categoría y subí cuantas imágenes quieras de una sola vez.</p>
      </div>
      <AppButton @click="openCreate">
        <span class="material-icons">add_photo_alternate</span>
        Subir imágenes
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

    <!-- Subida masiva: solo categoría + varias fotos -->
    <AppModal
      :is-open="createOpen"
      title="Subir imágenes"
      max-width="560px"
      allow-overflow
      @close="!saving && closeCreate()"
    >
      <form id="gallery-create-form" class="gallery-form" @submit.prevent="saveCreate">
        <div class="form-group">
          <label>Categoría *</label>
          <AppSelect
            v-model="createForm.image_type_id"
            :options="typeOptions"
            placeholder="Selecciona una categoría"
            icon="category"
          />
        </div>

        <div class="file-upload">
          <span class="field-label">Imágenes *</span>
          <button type="button" class="dropzone" @click="triggerCreateInput">
            <span class="material-icons">photo_library</span>
            <strong>Elegir imágenes</strong>
            <small>Podés seleccionar varias a la vez · JPG, PNG o WEBP · máx. 10MB c/u</small>
          </button>
          <input
            ref="createFileInput"
            type="file"
            class="hidden-file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            @change="onCreateFiles"
          />
        </div>

        <div v-if="pickedFiles.length" class="picked">
          <div class="picked-head">
            <span>{{ pickedFiles.length }} imagen{{ pickedFiles.length === 1 ? '' : 'es' }} lista{{ pickedFiles.length === 1 ? '' : 's' }}</span>
            <button type="button" class="link-clear" @click="clearPicked">Limpiar</button>
          </div>
          <ul class="picked-grid">
            <li v-for="(p, i) in pickedPreviews" :key="`${p.name}-${i}`">
              <img :src="p.url" :alt="p.name" />
              <button type="button" class="rm" :aria-label="`Quitar ${p.name}`" @click="removePicked(i)">
                <span class="material-icons">close</span>
              </button>
            </li>
          </ul>
        </div>

        <p v-if="progress" class="progress">{{ progress }}</p>
        <p v-if="modalError" class="error">{{ modalError }}</p>
      </form>

      <template #footer>
        <AppButton variant="secondary" :disabled="saving" @click="closeCreate">Cancelar</AppButton>
        <AppButton
          type="submit"
          form="gallery-create-form"
          :loading="saving"
          :disabled="!pickedFiles.length || !createForm.image_type_id"
        >
          Subir {{ pickedFiles.length || '' }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Edición de una sola imagen -->
    <AppModal
      :is-open="editOpen"
      title="Editar imagen"
      max-width="520px"
      allow-overflow
      @close="!saving && closeEdit()"
    >
      <form id="gallery-edit-form" class="gallery-form" @submit.prevent="saveEdit">
        <div class="form-group">
          <label>Categoría *</label>
          <AppSelect
            v-model="editForm.image_type_id"
            :options="typeOptions"
            placeholder="Selecciona una categoría"
            icon="category"
          />
        </div>

        <div class="form-group">
          <label for="gallery_title">Título</label>
          <AppInput id="gallery_title" v-model="editForm.title" placeholder="Título opcional" />
        </div>

        <div class="form-group">
          <label for="gallery_description">Descripción</label>
          <textarea
            id="gallery_description"
            v-model="editForm.description"
            class="app-textarea"
            rows="3"
            placeholder="Descripción opcional"
          />
        </div>

        <div class="file-upload">
          <span class="field-label">Reemplazar archivo (opcional)</span>
          <div class="file-row">
            <button type="button" class="file-preview" @click="triggerEditInput">
              <img v-if="editPreview" :src="editPreview" alt="Vista previa" />
              <div v-else class="file-placeholder">
                <span class="material-icons">add_photo_alternate</span>
                <span>Foto</span>
              </div>
            </button>
            <div class="file-actions">
              <AppButton type="button" variant="secondary" @click="triggerEditInput">
                <span class="material-icons">upload_file</span>
                {{ editFileName || 'Seleccionar archivo' }}
              </AppButton>
              <p class="help">JPG, PNG o WEBP. Máx. 10MB.</p>
            </div>
          </div>
          <input
            ref="editFileInput"
            type="file"
            class="hidden-file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="onEditFile"
          />
        </div>

        <p v-if="modalError" class="error">{{ modalError }}</p>
      </form>

      <template #footer>
        <AppButton variant="secondary" :disabled="saving" @click="closeEdit">Cancelar</AppButton>
        <AppButton type="submit" form="gallery-edit-form" :loading="saving">Guardar</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import {
  listGalleryTypes,
  listGalleryAdmin,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '../services/mediaAdminService.js';

const MAX_FILES = 60;

const items = ref([]);
const types = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const toast = ref('');
const modalError = ref('');
const progress = ref('');

const createOpen = ref(false);
const editOpen = ref(false);
const editing = ref(null);

const createFileInput = ref(null);
const editFileInput = ref(null);

const pickedFiles = ref([]);
const pickedPreviews = ref([]);
const editImageFile = ref(null);
const editPreviewUrl = ref('');

const createForm = reactive({ image_type_id: '' });
const editForm = reactive({
  image_type_id: '',
  title: '',
  description: '',
});

const typeOptions = computed(() =>
  (types.value || []).map((t) => ({ value: t.id, label: t.name })),
);

const editPreview = computed(
  () => editPreviewUrl.value || editing.value?.image_url || '',
);

const editFileName = computed(() => editImageFile.value?.name || '');

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
  modalError.value = '';
  progress.value = '';
  createForm.image_type_id = types.value[0]?.id || '';
  clearPicked();
  createOpen.value = true;
}

function closeCreate() {
  createOpen.value = false;
  clearPicked();
  progress.value = '';
  modalError.value = '';
}

function openEdit(item) {
  editing.value = item;
  editForm.image_type_id = item.image_type_id || item.image_type?.id || '';
  editForm.title = item.title || '';
  editForm.description = item.description || '';
  editImageFile.value = null;
  if (editPreviewUrl.value) URL.revokeObjectURL(editPreviewUrl.value);
  editPreviewUrl.value = '';
  if (editFileInput.value) editFileInput.value.value = '';
  modalError.value = '';
  editOpen.value = true;
}

function closeEdit() {
  editOpen.value = false;
  editing.value = null;
  if (editPreviewUrl.value) URL.revokeObjectURL(editPreviewUrl.value);
  editPreviewUrl.value = '';
  editImageFile.value = null;
  modalError.value = '';
}

function triggerCreateInput() {
  createFileInput.value?.click();
}

function triggerEditInput() {
  editFileInput.value?.click();
}

function revokePreviews() {
  pickedPreviews.value.forEach((p) => URL.revokeObjectURL(p.url));
  pickedPreviews.value = [];
}

function clearPicked() {
  revokePreviews();
  pickedFiles.value = [];
  if (createFileInput.value) createFileInput.value.value = '';
}

function onCreateFiles(e) {
  const list = Array.from(e.target.files || []);
  if (!list.length) return;

  const incoming = [...pickedFiles.value, ...list];
  if (incoming.length > MAX_FILES) {
    modalError.value = `Máximo ${MAX_FILES} imágenes por carga.`;
  } else {
    modalError.value = '';
  }

  const merged = incoming.slice(0, MAX_FILES);
  revokePreviews();
  pickedFiles.value = merged;
  pickedPreviews.value = merged.map((f) => ({
    name: f.name,
    url: URL.createObjectURL(f),
  }));
  // permitir re-seleccionar el mismo archivo después
  e.target.value = '';
}

function removePicked(index) {
  const next = [...pickedFiles.value];
  next.splice(index, 1);
  const [removed] = pickedPreviews.value.splice(index, 1);
  if (removed?.url) URL.revokeObjectURL(removed.url);
  pickedFiles.value = next;
}

function onEditFile(e) {
  const file = e.target.files?.[0] || null;
  editImageFile.value = file;
  if (editPreviewUrl.value) URL.revokeObjectURL(editPreviewUrl.value);
  editPreviewUrl.value = file ? URL.createObjectURL(file) : '';
}

async function saveCreate() {
  saving.value = true;
  modalError.value = '';
  progress.value = '';
  try {
    if (!createForm.image_type_id) throw new Error('Selecciona una categoría.');
    if (!pickedFiles.value.length) throw new Error('Elegí al menos una imagen.');

    const typeId = createForm.image_type_id;
    const total = pickedFiles.value.length;
    let ok = 0;
    const errors = [];

    for (let i = 0; i < total; i += 1) {
      const file = pickedFiles.value[i];
      progress.value = `Subiendo ${i + 1} / ${total}…`;
      try {
        await createGalleryItem(
          {
            image_type_id: typeId,
            title: null,
            description: null,
          },
          file,
        );
        ok += 1;
      } catch (e) {
        errors.push(`${file.name}: ${e.friendlyMessage || e.message || 'falló'}`);
      }
    }

    if (ok === 0) {
      throw new Error(errors[0] || 'No se pudo subir ninguna imagen.');
    }

    closeCreate();
    toast.value = errors.length
      ? `Subidas ${ok}/${total}. Algunas fallaron.`
      : `${ok} imagen${ok === 1 ? '' : 'es'} subida${ok === 1 ? '' : 's'}.`;
    setTimeout(() => { toast.value = ''; }, 3500);
    await load();
  } catch (e) {
    modalError.value = e.friendlyMessage || e.message || 'No se pudo subir.';
  } finally {
    saving.value = false;
    progress.value = '';
  }
}

async function saveEdit() {
  saving.value = true;
  modalError.value = '';
  try {
    if (!editForm.image_type_id) throw new Error('Selecciona una categoría.');
    await updateGalleryItem(
      editing.value.id,
      {
        image_type_id: editForm.image_type_id,
        title: editForm.title || null,
        description: editForm.description || null,
      },
      editImageFile.value,
    );
    closeEdit();
    toast.value = 'Imagen actualizada.';
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

onBeforeUnmount(() => {
  revokePreviews();
  if (editPreviewUrl.value) URL.revokeObjectURL(editPreviewUrl.value);
});
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
  font-size: 16px;
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

.dropzone {
  width: 100%;
  border: 2px dashed var(--color-border);
  border-radius: 14px;
  background: var(--color-input-bg);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.dropzone:hover {
  border-color: var(--color-primary);
  background: rgba(255, 94, 0, 0.06);
}

.dropzone .material-icons {
  font-size: 32px;
  color: var(--color-primary);
}

.dropzone strong {
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.dropzone small {
  font-size: 0.75rem;
  text-align: center;
  line-height: 1.35;
}

.picked-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.link-clear {
  border: none;
  background: none;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
  font-size: 0.8rem;
}

.picked-grid {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 0.5rem;
  max-height: 220px;
  overflow: auto;
}

.picked-grid li {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.picked-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.picked-grid .rm {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

.picked-grid .rm .material-icons {
  font-size: 14px;
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

.progress {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-primary);
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
