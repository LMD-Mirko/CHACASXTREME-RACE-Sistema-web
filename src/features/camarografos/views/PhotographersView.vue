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
              <ShareLinkPopover
                title="Enlace al panel"
                ariaLabel="Compartir enlace de camarógrafo"
                trigger-icon="link"
                :load-link="() => loadAccessLink(row)"
                @copied="onCopied"
              />
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
import ShareLinkPopover from '../../../components/common/ShareLinkPopover.vue';
import {
  photographerAccessMessage,
  withClientWhatsApp,
} from '../../../core/share/whatsappMessages.js';
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

async function loadAccessLink(row) {
  const data = await issuePhotographerAccessLink(row.id);
  await load();
  return withClientWhatsApp(
    {
      ...data,
      photographer: data?.photographer || row,
      phone: data?.phone || row.phone,
    },
    photographerAccessMessage,
  );
}

function onCopied(url) {
  toast.value = `Link copiado: ${url}`;
  setTimeout(() => { toast.value = ''; }, 2800);
}

onMounted(load);
</script>

<style scoped>
.view-container {
  padding: 1.25rem 1rem 2rem;
  color: var(--color-text-primary);
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
  color: var(--color-text-primary);
}
.page-head p {
  margin: 0;
  color: var(--color-text-secondary);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-input-bg, var(--color-surface, transparent));
  border: 1px solid var(--color-border, #d4d4d4);
  color: var(--color-text-primary);
  border-radius: 10px;
  cursor: pointer;
}
.table-wrap {
  overflow: auto;
  border: 1px solid var(--color-border, #e5e5e5);
  border-radius: 12px;
  background: var(--color-surface, transparent);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  color: var(--color-text-primary);
}
th, td {
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid var(--color-border, #ececec);
  color: var(--color-text-primary);
}
th {
  color: var(--color-text-secondary);
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.pill {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text-secondary) 18%, transparent);
  color: var(--color-text-secondary);
}
.pill.on {
  background: rgba(34, 160, 90, 0.16);
  color: #1b8a45;
}
.error { color: #d32f2f; }
.toast {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  color: var(--color-text-primary);
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-size: 0.85rem;
  word-break: break-all;
}
.empty, .loading {
  padding: 1.5rem;
  color: var(--color-text-secondary);
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 1rem;
}
.modal {
  width: min(420px, 100%);
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  color: var(--color-text-primary);
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.modal h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-text-primary);
}
.modal label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
.modal input {
  background: var(--color-input-bg, #fafafa);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  color: var(--color-text-primary);
}
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
