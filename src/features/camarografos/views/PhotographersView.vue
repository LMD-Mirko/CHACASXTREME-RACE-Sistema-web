<template>
  <div class="view-container">
    <header class="page-head">
      <div>
        <h1>Camarógrafos</h1>
        <p>Crea cuentas y envía el enlace al panel por WhatsApp (sin que ellos se registren).</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">
        <span class="material-icons">add</span>
        Nuevo
      </button>
    </header>

    <p v-if="toast" class="toast">{{ toast }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !rows.length" class="loading">Cargando…</div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Instagram</th>
            <th>Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.full_name }}</td>
            <td>{{ row.phone || '—' }}</td>
            <td>{{ row.instagram ? `@${row.instagram}` : '—' }}</td>
            <td>
              <span class="pill" :class="{ on: row.has_login_token }">
                {{ row.has_login_token ? 'Listo' : 'Pendiente' }}
              </span>
            </td>
            <td class="actions">
              <button type="button" class="btn-ghost" title="Editar" @click="openEdit(row)">
                <span class="material-icons">edit</span>
              </button>
              <button type="button" class="btn-ghost" title="WhatsApp / copiar link" @click="shareLink(row)">
                <span class="material-icons">sms</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!rows.length" class="empty">Aún no hay camarógrafos. Crea el primero.</p>
    </div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <form class="modal" @submit.prevent="save">
        <h2>{{ editing ? 'Editar camarógrafo' : 'Nuevo camarógrafo' }}</h2>
        <label>
          <span>Nombre completo</span>
          <input v-model.trim="form.full_name" type="text" required minlength="3" />
        </label>
        <label>
          <span>Teléfono (WhatsApp)</span>
          <input v-model.trim="form.phone" type="tel" placeholder="999888777" />
        </label>
        <label>
          <span>Instagram (opcional)</span>
          <input v-model.trim="form.instagram" type="text" placeholder="usuario" />
        </label>
        <p v-if="modalError" class="error">{{ modalError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import {
  listPhotographers,
  createPhotographer,
  updatePhotographer,
  issuePhotographerAccessLink,
} from '../services/photographerAdminService.js';

const rows = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const toast = ref('');
const modalOpen = ref(false);
const modalError = ref('');
const editing = ref(null);
const form = reactive({ full_name: '', phone: '', instagram: '' });

async function load() {
  loading.value = true;
  error.value = '';
  try {
    rows.value = await listPhotographers();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar.';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.full_name = '';
  form.phone = '';
  form.instagram = '';
  modalError.value = '';
  modalOpen.value = true;
}

function openEdit(row) {
  editing.value = row;
  form.full_name = row.full_name || '';
  form.phone = row.phone || '';
  form.instagram = row.instagram || '';
  modalError.value = '';
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  modalError.value = '';
  try {
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      instagram: form.instagram || null,
    };
    if (editing.value) {
      await updatePhotographer(editing.value.id, payload);
    } else {
      await createPhotographer(payload);
    }
    modalOpen.value = false;
    await load();
  } catch (e) {
    modalError.value = e.friendlyMessage || e.message || 'No se pudo guardar.';
  } finally {
    saving.value = false;
  }
}

async function shareLink(row) {
  error.value = '';
  try {
    const data = await issuePhotographerAccessLink(row.id);
    const url = data?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.value = `Link copiado: ${url}`;
    } catch {
      toast.value = url;
    }
    setTimeout(() => { toast.value = ''; }, 2800);
    if (data.whatsapp_url) {
      window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer');
    }
    await load();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo generar el link.';
  }
}

onMounted(load);
</script>

<style scoped>
.view-container {
  padding: 1.25rem 1rem 2rem;
  color: #f5f5f5;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.page-head h1 {
  margin: 0 0 0.35rem;
  font-size: 1.45rem;
}
.page-head p {
  margin: 0;
  color: #a3a3a3;
  font-size: 0.9rem;
  max-width: 40rem;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #ff5e00;
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-ghost {
  background: transparent;
  border: 1px solid #333;
  color: #eee;
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
}
.table-wrap {
  overflow: auto;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}
th, td {
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #222;
}
th { color: #888; font-weight: 600; }
.actions { display: flex; gap: 0.35rem; }
.pill {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #333;
  color: #aaa;
}
.pill.on { background: #1a3d2a; color: #7dffa0; }
.error { color: #ff8a80; }
.toast {
  background: #1a1a1a;
  border: 1px solid #333;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-size: 0.85rem;
  word-break: break-all;
}
.empty, .loading { padding: 1.5rem; color: #888; }
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.72);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 1rem;
}
.modal {
  width: min(420px, 100%);
  background: #141414;
  border: 1px solid #333;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.modal h2 { margin: 0; font-size: 1.15rem; }
.modal label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: #bbb; }
.modal input {
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  color: #fff;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
