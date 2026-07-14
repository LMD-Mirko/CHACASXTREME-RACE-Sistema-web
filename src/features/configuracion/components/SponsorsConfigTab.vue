<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Auspiciadores</h2>
        <p>Sube logos y elige marco (circular / rectangular) y tamaño para los carruseles de mankariders.xyz.</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">
        <span class="material-icons">add</span>
        Nuevo
      </button>
    </header>

    <p v-if="toast" class="toast">{{ toast }}</p>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="loading" class="muted">Cargando…</div>

    <div v-else class="cards">
      <article v-for="row in rows" :key="row.id" class="card">
        <div class="preview" :class="[`frame-${row.frame_shape || 'auto'}`, `size-${row.display_size || 'md'}`]">
          <img v-if="row.logo_url" :src="row.logo_url" :alt="row.company_name" />
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
          <button type="button" class="btn-ghost" @click="openEdit(row)">Editar</button>
          <button type="button" class="btn-danger" @click="remove(row)">Eliminar</button>
        </div>
      </article>
      <p v-if="!rows.length" class="muted">Aún no hay auspiciadores. Crea el primero.</p>
    </div>

    <div v-if="modalOpen" class="backdrop" @click.self="modalOpen = false">
      <form class="modal" @submit.prevent="save">
        <h3>{{ editing ? 'Editar auspiciador' : 'Nuevo auspiciador' }}</h3>

        <label>
          <span>Nombre</span>
          <input v-model.trim="form.company_name" required minlength="2" />
        </label>

        <label>
          <span>Logo {{ editing ? '(opcional al editar)' : '' }}</span>
          <input type="file" accept="image/*" @change="onFile" :required="!editing" />
        </label>

        <div v-if="previewUrl || editing?.logo_url" class="form-preview" :class="[`frame-${form.frame_shape}`, `size-${form.display_size}`]">
          <img :src="previewUrl || editing?.logo_url" alt="Vista previa" />
        </div>

        <div class="grid2">
          <label>
            <span>Marco</span>
            <select v-model="form.frame_shape">
              <option value="auto">Automático</option>
              <option value="circle">Circular</option>
              <option value="rectangle">Rectangular (horizontal)</option>
              <option value="square">Cuadrado</option>
              <option value="tall">Rectangular (vertical)</option>
            </select>
          </label>
          <label>
            <span>Tamaño</span>
            <select v-model="form.display_size">
              <option value="sm">Pequeño</option>
              <option value="md">Mediano</option>
              <option value="lg">Grande</option>
            </select>
          </label>
        </div>

        <label>
          <span>Orden en carrusel</span>
          <input v-model.number="form.sort_order" type="number" min="0" />
        </label>

        <div class="grid2">
          <label><span>Instagram</span><input v-model.trim="form.instagram_url" type="url" placeholder="https://" /></label>
          <label><span>Facebook</span><input v-model.trim="form.facebook_url" type="url" placeholder="https://" /></label>
          <label><span>TikTok</span><input v-model.trim="form.tiktok_url" type="url" placeholder="https://" /></label>
          <label><span>Web</span><input v-model.trim="form.website_url" type="url" placeholder="https://" /></label>
        </div>

        <label class="check">
          <input v-model="form.is_active" type="checkbox" />
          Activo (visible en la web)
        </label>

        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import {
  listSponsorsAdmin,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from '../services/mediaAdminService.js';

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

const form = reactive({
  company_name: '',
  frame_shape: 'auto',
  display_size: 'md',
  sort_order: 0,
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  website_url: '',
  is_active: true,
});

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
  form.frame_shape = 'auto';
  form.display_size = 'md';
  form.sort_order = 0;
  form.instagram_url = '';
  form.facebook_url = '';
  form.tiktok_url = '';
  form.website_url = '';
  form.is_active = true;
  logoFile.value = null;
  previewUrl.value = '';
  modalError.value = '';
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
  form.frame_shape = row.frame_shape || 'auto';
  form.display_size = row.display_size || 'md';
  form.sort_order = row.sort_order ?? 0;
  form.instagram_url = row.instagram_url || '';
  form.facebook_url = row.facebook_url || '';
  form.tiktok_url = row.tiktok_url || '';
  form.website_url = row.website_url || '';
  form.is_active = Boolean(row.is_active);
  modalOpen.value = true;
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
    const payload = {
      company_name: form.company_name,
      frame_shape: form.frame_shape,
      display_size: form.display_size,
      sort_order: form.sort_order || 0,
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
.media-tab { display: flex; flex-direction: column; gap: 1rem; }
.media-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.media-head h2 { margin: 0 0 0.25rem; font-size: 1.15rem; color: var(--color-text-primary); }
.media-head p { margin: 0; color: var(--color-text-secondary); font-size: 0.88rem; max-width: 40rem; }
.cards { display: grid; gap: 0.75rem; }
.card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}
.preview, .form-preview {
  display: grid; place-items: center;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.preview img, .form-preview img { width: 100%; height: 100%; object-fit: contain; }
.preview.frame-circle, .form-preview.frame-circle { border-radius: 50%; }
.preview.frame-rectangle, .form-preview.frame-rectangle,
.preview.frame-auto, .form-preview.frame-auto { border-radius: 14px; }
.preview.frame-square, .form-preview.frame-square { border-radius: 12px; }
.preview.frame-tall, .form-preview.frame-tall { border-radius: 14px; }
.preview.size-sm { width: 56px; height: 56px; }
.preview.size-md { width: 72px; height: 72px; }
.preview.size-lg { width: 96px; height: 96px; }
.preview.frame-rectangle.size-sm, .form-preview.frame-rectangle.size-sm { width: 88px; height: 48px; }
.preview.frame-rectangle.size-md, .form-preview.frame-rectangle.size-md { width: 120px; height: 64px; }
.preview.frame-rectangle.size-lg, .form-preview.frame-rectangle.size-lg { width: 150px; height: 78px; }
.preview.frame-tall.size-sm { width: 48px; height: 72px; }
.preview.frame-tall.size-md { width: 56px; height: 88px; }
.preview.frame-tall.size-lg { width: 64px; height: 108px; }
.form-preview { margin: 0.25rem 0 0.5rem; width: 120px; height: 80px; }
.meta h3 { margin: 0 0 0.2rem; font-size: 0.98rem; color: var(--color-text-primary); }
.meta p { margin: 0; font-size: 0.78rem; color: var(--color-text-secondary); }
.on { color: #059669; font-weight: 700; }
.off { color: #b45309; font-weight: 700; }
.actions { display: flex; gap: 0.4rem; }
.btn-primary, .btn-ghost, .btn-danger {
  border-radius: 10px; border: 1px solid var(--color-border); padding: 0.45rem 0.75rem;
  font-weight: 700; cursor: pointer; font-size: 0.8rem;
}
.btn-primary { background: #ff5e00; color: #fff; border-color: #ff5e00; display: inline-flex; gap: 0.25rem; align-items: center; }
.btn-ghost { background: var(--color-input-bg); color: var(--color-text-primary); }
.btn-danger { background: transparent; color: #dc2626; border-color: rgba(220,38,38,.35); }
.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 50;
  display: grid; place-items: center; padding: 1rem;
}
.modal {
  width: min(560px, 100%); max-height: 90vh; overflow: auto;
  background: var(--color-surface); color: var(--color-text-primary);
  border: 1px solid var(--color-border); border-radius: 16px; padding: 1.1rem;
  display: flex; flex-direction: column; gap: 0.7rem;
}
.modal h3 { margin: 0; }
label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; }
input, select {
  border: 1px solid var(--color-border); border-radius: 10px; padding: 0.55rem 0.7rem;
  background: var(--color-input-bg); color: var(--color-text-primary);
}
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.check { flex-direction: row; align-items: center; gap: 0.5rem; font-weight: 600; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.toast { color: #059669; font-weight: 700; }
.error { color: #dc2626; font-size: 0.85rem; }
.muted { color: var(--color-text-secondary); }
@media (max-width: 700px) {
  .card { grid-template-columns: 1fr; }
  .grid2 { grid-template-columns: 1fr; }
}
</style>
