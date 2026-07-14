<template>
  <div class="media-tab">
    <header class="media-head">
      <div>
        <h2>Galería web</h2>
        <p>Imágenes de marketing (misma galería del panel Filament).</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">
        <span class="material-icons">add_photo_alternate</span>
        Subir
      </button>
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
          <button type="button" class="btn-ghost" @click="openEdit(item)">Editar</button>
          <button type="button" class="btn-danger" @click="remove(item)">Eliminar</button>
        </div>
      </article>
      <p v-if="!items.length" class="muted">No hay imágenes aún.</p>
    </div>

    <div v-if="modalOpen" class="backdrop" @click.self="modalOpen = false">
      <form class="modal" @submit.prevent="save">
        <h3>{{ editing ? 'Editar imagen' : 'Subir imagen' }}</h3>
        <label>
          <span>Tipo</span>
          <select v-model="form.image_type_id" required>
            <option disabled value="">Selecciona…</option>
            <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </label>
        <label>
          <span>Título</span>
          <input v-model.trim="form.title" />
        </label>
        <label>
          <span>Descripción</span>
          <textarea v-model.trim="form.description" rows="3" />
        </label>
        <label>
          <span>Archivo {{ editing ? '(opcional)' : '' }}</span>
          <input type="file" accept="image/*" @change="onFile" :required="!editing" />
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
const form = reactive({
  image_type_id: '',
  title: '',
  description: '',
});

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
  modalError.value = '';
  modalOpen.value = true;
}

function openEdit(item) {
  editing.value = item;
  form.image_type_id = item.image_type_id || item.image_type?.id || '';
  form.title = item.title || '';
  form.description = item.description || '';
  imageFile.value = null;
  modalError.value = '';
  modalOpen.value = true;
}

function onFile(e) {
  imageFile.value = e.target.files?.[0] || null;
}

async function save() {
  saving.value = true;
  modalError.value = '';
  try {
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
.media-tab { display: flex; flex-direction: column; gap: 1rem; }
.media-head { display: flex; justify-content: space-between; gap: 1rem; }
.media-head h2 { margin: 0 0 0.25rem; font-size: 1.15rem; color: var(--color-text-primary); }
.media-head p { margin: 0; color: var(--color-text-secondary); font-size: 0.88rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
.thumb {
  border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden;
  background: var(--color-surface); display: flex; flex-direction: column;
}
.thumb img { width: 100%; aspect-ratio: 4/3; object-fit: cover; background: var(--color-input-bg); }
.info { padding: 0.55rem 0.65rem; display: flex; flex-direction: column; gap: 0.15rem; }
.info strong { font-size: 0.85rem; color: var(--color-text-primary); }
.info span { font-size: 0.72rem; color: var(--color-text-secondary); }
.actions { display: flex; gap: 0.35rem; padding: 0 0.55rem 0.55rem; }
.btn-primary, .btn-ghost, .btn-danger {
  border-radius: 10px; border: 1px solid var(--color-border); padding: 0.4rem 0.7rem;
  font-weight: 700; cursor: pointer; font-size: 0.78rem;
}
.btn-primary { background: #ff5e00; color: #fff; border-color: #ff5e00; display: inline-flex; gap: 0.25rem; align-items: center; }
.btn-ghost { background: var(--color-input-bg); color: var(--color-text-primary); }
.btn-danger { background: transparent; color: #dc2626; border-color: rgba(220,38,38,.35); }
.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 50;
  display: grid; place-items: center; padding: 1rem;
}
.modal {
  width: min(480px, 100%); background: var(--color-surface); color: var(--color-text-primary);
  border: 1px solid var(--color-border); border-radius: 16px; padding: 1.1rem;
  display: flex; flex-direction: column; gap: 0.7rem;
}
label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; }
input, select, textarea {
  border: 1px solid var(--color-border); border-radius: 10px; padding: 0.55rem 0.7rem;
  background: var(--color-input-bg); color: var(--color-text-primary); font: inherit;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.toast { color: #059669; font-weight: 700; }
.error { color: #dc2626; font-size: 0.85rem; }
.muted { color: var(--color-text-secondary); }
</style>
