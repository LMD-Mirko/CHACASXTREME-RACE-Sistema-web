<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Auspiciadores</h2>
        <p>
          Logos para mankariders.xyz. Circular recorta esquinas del PNG; Cuadrado/Rectangular
          mantienen el logo completo.
        </p>
      </div>
      <AppButton @click="openCreate">
        <span class="material-icons">add</span>
        Nuevo
      </AppButton>
    </header>

    <p v-if="toast" class="toast">{{ toast }}</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="loading" class="muted">Cargando…</div>

    <div v-else class="cards">
      <article v-for="row in rows" :key="row.id" class="card">
        <div
          class="preview"
          :class="[`frame-${row.frame_shape || 'square'}`, `size-${row.display_size || 'md'}`]"
        >
          <img v-if="row.logo_url" :src="resolveLogoUrl(row.logo_url)" :alt="row.company_name" />
          <span v-else class="material-icons">image</span>
        </div>
        <div class="meta">
          <h3>{{ row.company_name }}</h3>
          <p>
            {{ frameLabel(row.frame_shape) }} · {{ sizeLabel(row.display_size) }}
            · orden {{ row.sort_order ?? 0 }}
            · <span :class="row.is_active ? 'on' : 'off'">{{ row.is_active ? 'Activo' : 'Inactivo' }}</span>
          </p>
        </div>
        <div class="actions">
          <AppButton variant="secondary" @click="openEdit(row)">Editar</AppButton>
          <AppButton variant="danger" @click="remove(row)">Eliminar</AppButton>
        </div>
      </article>
      <p v-if="!rows.length" class="muted">Aún no hay auspiciadores. Crea el primero.</p>
    </div>

    <AppModal
      :is-open="modalOpen"
      :title="editing ? 'Editar auspiciador' : 'Nuevo auspiciador'"
      max-width="560px"
      allow-overflow
      @close="modalOpen = false"
    >
      <form id="sponsor-form" class="sponsor-form" @submit.prevent="save">
        <div class="form-group">
          <label for="company_name">Nombre *</label>
          <AppInput
            id="company_name"
            v-model="form.company_name"
            placeholder="Ej: KISHI HOUSE"
            required
          />
        </div>

        <div class="logo-upload">
          <span class="field-label">Logo {{ editing ? '(opcional al editar)' : '*' }}</span>
          <div class="logo-row">
            <button
              type="button"
              class="logo-preview-btn"
              :class="[`frame-${form.frame_shape}`, `size-${form.display_size}`]"
              @click="triggerFileInput"
            >
              <img
                v-if="displayPreview"
                :src="displayPreview"
                alt="Vista previa del logo"
                class="logo-preview-img"
              />
              <div v-else class="logo-placeholder">
                <span class="material-icons">add_photo_alternate</span>
                <span>Logo</span>
              </div>
            </button>

            <div class="logo-actions">
              <AppButton type="button" variant="secondary" @click="triggerFileInput">
                <span class="material-icons">upload_file</span>
                {{ logoFileName || 'Seleccionar archivo' }}
              </AppButton>
              <p class="help">JPG, PNG, WEBP o SVG. Máx. 5MB.</p>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden-file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            @change="onFile"
          />
        </div>

        <div class="grid2">
          <div class="form-group">
            <label>Marco</label>
            <AppSelect
              v-model="form.frame_shape"
              :options="frameOptions"
              placeholder="Elige marco"
              icon="crop_free"
            />
          </div>
          <div class="form-group">
            <label>Tamaño</label>
            <AppSelect
              v-model="form.display_size"
              :options="sizeOptions"
              placeholder="Elige tamaño"
              icon="photo_size_select_large"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="sort_order">Orden en carrusel</label>
          <AppInput
            id="sort_order"
            v-model="form.sort_order"
            type="number"
            min="0"
            placeholder="0"
          />
        </div>

        <div class="grid2">
          <div class="form-group">
            <label for="instagram_url">Instagram</label>
            <AppInput id="instagram_url" v-model="form.instagram_url" type="url" placeholder="https://instagram.com/…" />
          </div>
          <div class="form-group">
            <label for="facebook_url">Facebook</label>
            <AppInput id="facebook_url" v-model="form.facebook_url" type="url" placeholder="https://facebook.com/…" />
          </div>
          <div class="form-group">
            <label for="tiktok_url">TikTok</label>
            <AppInput id="tiktok_url" v-model="form.tiktok_url" type="url" placeholder="https://tiktok.com/@…" />
          </div>
          <div class="form-group">
            <label for="website_url">Web</label>
            <AppInput id="website_url" v-model="form.website_url" type="url" placeholder="https://…" />
          </div>
        </div>

        <label class="check">
          <input v-model="form.is_active" type="checkbox" />
          Activo (visible en la web)
        </label>

        <p v-if="modalError" class="error">{{ modalError }}</p>
      </form>

      <template #footer>
        <AppButton variant="secondary" @click="modalOpen = false">Cancelar</AppButton>
        <AppButton type="submit" form="sponsor-form" :loading="saving">Guardar</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  listSponsorsAdmin,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from '../services/mediaAdminService.js';
import { storageUrl } from '../../../core/network/storageUrl.js';

const rows = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const toast = ref('');
const modalOpen = ref(false);
const modalError = ref('');
const editing = ref(null);
const logoFile = ref(null);
const previewUrl = ref('');
const fileInput = ref(null);

const frameOptions = [
  { value: 'auto', label: 'Automático' },
  { value: 'circle', label: 'Circular' },
  { value: 'rectangle', label: 'Rectangular (horizontal)' },
  { value: 'square', label: 'Cuadrado' },
  { value: 'tall', label: 'Rectangular (vertical)' },
];

const sizeOptions = [
  { value: 'sm', label: 'Pequeño' },
  { value: 'md', label: 'Mediano' },
  { value: 'lg', label: 'Grande' },
];

const form = reactive({
  company_name: '',
  frame_shape: 'square',
  display_size: 'md',
  sort_order: 0,
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  website_url: '',
  is_active: true,
});

function resolveLogoUrl(path) {
  return storageUrl(path);
}

const displayPreview = computed(
  () => previewUrl.value || resolveLogoUrl(editing.value?.logo_url || ''),
);

const logoFileName = computed(() => logoFile.value?.name || '');

function frameLabel(v) {
  return ({
    auto: 'Auto',
    circle: 'Circular',
    rectangle: 'Rectangular',
    square: 'Cuadrado',
    tall: 'Vertical',
  })[v] || 'Auto';
}

function sizeLabel(v) {
  return ({ sm: 'Pequeño', md: 'Mediano', lg: 'Grande' })[v] || 'Mediano';
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    rows.value = await listSponsorsAdmin();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar.';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.company_name = '';
  form.frame_shape = 'square';
  form.display_size = 'md';
  form.sort_order = 0;
  form.instagram_url = '';
  form.facebook_url = '';
  form.tiktok_url = '';
  form.website_url = '';
  form.is_active = true;
  logoFile.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
  modalError.value = '';
  if (fileInput.value) fileInput.value.value = '';
}

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(row) {
  editing.value = row;
  resetForm();
  form.company_name = row.company_name || '';
  form.frame_shape = row.frame_shape || 'square';
  form.display_size = row.display_size || 'md';
  form.sort_order = row.sort_order ?? 0;
  form.instagram_url = row.instagram_url || '';
  form.facebook_url = row.facebook_url || '';
  form.tiktok_url = row.tiktok_url || '';
  form.website_url = row.website_url || '';
  form.is_active = Boolean(row.is_active);
  modalOpen.value = true;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFile(e) {
  const file = e.target.files?.[0] || null;
  logoFile.value = file;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = file ? URL.createObjectURL(file) : '';
}

async function save() {
  saving.value = true;
  modalError.value = '';
  try {
    if (!form.company_name?.trim()) throw new Error('Ingresa el nombre.');
    const payload = {
      company_name: form.company_name.trim(),
      frame_shape: form.frame_shape,
      display_size: form.display_size,
      sort_order: Number(form.sort_order) || 0,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      tiktok_url: form.tiktok_url || null,
      website_url: form.website_url || null,
      is_active: form.is_active,
    };
    if (editing.value) {
      await updateSponsor(editing.value.id, payload, logoFile.value);
    } else {
      if (!logoFile.value) throw new Error('Sube un logo.');
      await createSponsor(payload, logoFile.value);
    }
    modalOpen.value = false;
    toast.value = 'Auspiciador guardado.';
    setTimeout(() => { toast.value = ''; }, 2500);
    await load();
  } catch (e) {
    modalError.value = e.friendlyMessage || e.message || 'No se pudo guardar.';
  } finally {
    saving.value = false;
  }
}

async function remove(row) {
  if (!confirm(`¿Eliminar a ${row.company_name}?`)) return;
  try {
    await deleteSponsor(row.id);
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
  max-width: 40rem;
  line-height: 1.4;
}

.cards {
  display: grid;
  gap: 0.75rem;
}

.card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}

.preview {
  display: grid;
  place-items: center;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview.frame-circle img {
  object-fit: cover;
  transform: scale(1.06);
}

.preview.frame-circle { border-radius: 50%; }
.preview.frame-rectangle,
.preview.frame-auto { border-radius: 14px; }
.preview.frame-square { border-radius: 12px; }
.preview.frame-tall { border-radius: 14px; }

.preview.size-sm { width: 56px; height: 56px; }
.preview.size-md { width: 72px; height: 72px; }
.preview.size-lg { width: 96px; height: 96px; }
.preview.frame-rectangle.size-sm { width: 88px; height: 48px; }
.preview.frame-rectangle.size-md { width: 120px; height: 64px; }
.preview.frame-rectangle.size-lg { width: 150px; height: 78px; }
.preview.frame-tall.size-sm { width: 48px; height: 72px; }
.preview.frame-tall.size-md { width: 56px; height: 88px; }
.preview.frame-tall.size-lg { width: 64px; height: 108px; }

.meta h3 {
  margin: 0 0 0.2rem;
  font-size: 0.98rem;
  color: var(--color-text-primary);
}

.meta p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.on { color: #059669; font-weight: 700; }
.off { color: #b45309; font-weight: 700; }

.actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.sponsor-form {
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

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.logo-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-preview-btn {
  border: 2px dashed var(--color-border);
  background: var(--color-input-bg);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  transition: border-color 0.2s ease, background 0.2s ease;
  flex-shrink: 0;
}

.logo-preview-btn:hover {
  border-color: var(--color-primary);
  background: rgba(255, 94, 0, 0.04);
}

.logo-preview-btn.frame-circle { border-radius: 50%; }
.logo-preview-btn.frame-rectangle,
.logo-preview-btn.frame-auto { border-radius: 14px; }
.logo-preview-btn.frame-square { border-radius: 12px; }
.logo-preview-btn.frame-tall { border-radius: 14px; }

.logo-preview-btn.size-sm { width: 72px; height: 72px; }
.logo-preview-btn.size-md { width: 96px; height: 96px; }
.logo-preview-btn.size-lg { width: 112px; height: 112px; }
.logo-preview-btn.frame-rectangle.size-sm { width: 110px; height: 60px; }
.logo-preview-btn.frame-rectangle.size-md { width: 140px; height: 74px; }
.logo-preview-btn.frame-rectangle.size-lg { width: 168px; height: 88px; }
.logo-preview-btn.frame-tall.size-sm { width: 60px; height: 90px; }
.logo-preview-btn.frame-tall.size-md { width: 70px; height: 108px; }
.logo-preview-btn.frame-tall.size-lg { width: 80px; height: 124px; }

.logo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.logo-preview-btn.frame-circle .logo-preview-img {
  object-fit: cover;
  transform: scale(1.06);
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
}

.logo-placeholder .material-icons {
  font-size: 22px;
}

.logo-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.help {
  margin: 0;
  font-size: 11.5px;
  color: var(--color-text-secondary);
  line-height: 1.35;
}

.hidden-file {
  display: none;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
}

.toast { color: #059669; font-weight: 700; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0; }
.muted { color: var(--color-text-secondary); }

@media (max-width: 700px) {
  .card { grid-template-columns: 1fr; }
  .grid2 { grid-template-columns: 1fr; }
  .logo-row { flex-direction: column; align-items: flex-start; }
}
</style>
