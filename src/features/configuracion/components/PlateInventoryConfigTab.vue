<template>
  <div class="plate-inv">
    <header class="plate-inv__head">
      <div>
        <h2>Inventario de placas</h2>
        <p>
          Números del <strong>{{ data.min || 1 }}</strong> al <strong>{{ data.max || 150 }}</strong>.
          El rider elige al completar ficha; el staff puede asignar en caliente desde Competidores.
        </p>
      </div>
      <AppButton variant="secondary" :disabled="loading" @click="load">
        <span class="material-icons">refresh</span>
        Actualizar
      </AppButton>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="toolbar">
      <div class="stats">
        <span class="stat"><strong>{{ data.taken || 0 }}</strong> ocupadas</span>
        <span class="dot">·</span>
        <span class="stat"><strong>{{ data.free || 0 }}</strong> libres</span>
        <span class="dot">·</span>
        <span class="stat"><strong>{{ data.total || 0 }}</strong> total</span>
      </div>
      <div class="filters">
        <button
          type="button"
          class="chip"
          :class="{ on: filter === 'all' }"
          @click="filter = 'all'"
        >Todas</button>
        <button
          type="button"
          class="chip"
          :class="{ on: filter === 'free' }"
          @click="filter = 'free'"
        >Libres</button>
        <button
          type="button"
          class="chip"
          :class="{ on: filter === 'taken' }"
          @click="filter = 'taken'"
        >Ocupadas</button>
        <input
          v-model.trim="search"
          type="search"
          class="search"
          placeholder="Buscar # o nombre…"
        />
      </div>
    </div>

    <div v-if="loading && !plates.length" class="muted">Cargando inventario…</div>

    <div v-else class="grid">
      <button
        v-for="row in visiblePlates"
        :key="row.plate_number"
        type="button"
        class="cell"
        :class="{ taken: row.taken }"
        :title="row.taken ? row.rider?.full_name : 'Libre'"
        @click="openPlate(row)"
      >
        <span class="num">{{ String(row.plate_number).padStart(2, '0') }}</span>
        <span v-if="row.taken" class="check material-icons" aria-hidden="true">check_circle</span>
      </button>
      <p v-if="!visiblePlates.length" class="muted empty">Sin resultados con ese filtro.</p>
    </div>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal" role="dialog" aria-label="Detalle de placa">
        <header>
          <h3>Placa #{{ selected.plate_number }}</h3>
          <button type="button" class="icon-btn" @click="selected = null" aria-label="Cerrar">
            <span class="material-icons">close</span>
          </button>
        </header>

        <div v-if="selected.taken && selected.rider" class="owner">
          <div class="avatar">
            <img v-if="selected.rider.photo_url" :src="photoUrl(selected.rider.photo_url)" alt="" />
            <span v-else>{{ initials(selected.rider.full_name) }}</span>
          </div>
          <div>
            <p class="name">{{ selected.rider.full_name }}</p>
            <p class="meta">
              {{ selected.rider.category?.name || 'Sin categoría' }}
              <template v-if="selected.rider.race_status"> · {{ selected.rider.race_status }}</template>
            </p>
          </div>
        </div>
        <p v-else class="free-msg">Esta placa está libre. Un rider puede elegirla al completar su ficha, o el staff asignarla desde Competidores.</p>

        <div class="modal-actions">
          <AppButton variant="secondary" @click="selected = null">Cerrar</AppButton>
          <AppButton
            v-if="selected.taken && selected.rider"
            @click="goToRiders(selected.rider)"
          >
            Ver en competidores
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../../core/network/axios';
import { storageUrl } from '../../../core/network/storageUrl';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const filter = ref('all');
const search = ref('');
const selected = ref(null);
const data = ref({ min: 1, max: 150, total: 0, taken: 0, free: 0, plates: [] });

const plates = computed(() => data.value.plates || []);

const visiblePlates = computed(() => {
  const q = search.value.toLowerCase();
  return plates.value.filter((row) => {
    if (filter.value === 'free' && row.taken) return false;
    if (filter.value === 'taken' && !row.taken) return false;
    if (!q) return true;
    const name = (row.rider?.full_name || '').toLowerCase();
    const num = String(row.plate_number);
    return num.includes(q) || name.includes(q);
  });
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get('/api/admin/plates');
    data.value = res.data?.data || data.value;
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar el inventario.';
  } finally {
    loading.value = false;
  }
}

function openPlate(row) {
  selected.value = row;
}

function photoUrl(url) {
  return storageUrl(url);
}

function initials(name) {
  return String(name || 'X')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function goToRiders(rider) {
  selected.value = null;
  router.push({
    path: '/dashboard/competidores',
    query: rider?.full_name ? { search: rider.full_name } : {},
  });
}

onMounted(load);
</script>

<style scoped>
.plate-inv {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--color-text-primary);
}

.plate-inv__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.plate-inv__head h2 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.plate-inv__head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  max-width: 42rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.stat strong { color: var(--color-text-primary); }
.dot { opacity: 0.5; }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.chip {
  border: 1px solid var(--color-border, #333);
  background: var(--color-input-bg, transparent);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.chip.on {
  border-color: rgba(255, 94, 0, 0.55);
  color: #ff5e00;
  background: rgba(255, 94, 0, 0.1);
}

.search {
  min-width: 160px;
  border: 1px solid var(--color-border, #333);
  background: var(--color-input-bg, transparent);
  color: var(--color-text-primary);
  border-radius: 10px;
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .search {
    min-width: 0;
    width: 100%;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 0.45rem;
}

.cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid var(--color-border, #333);
  background: var(--color-surface, #141414);
  color: var(--color-text-primary);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.cell:hover {
  border-color: rgba(255, 94, 0, 0.55);
}

.cell.taken {
  border-color: rgba(34, 160, 90, 0.45);
  background: rgba(34, 160, 90, 0.1);
}

.num {
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.check {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 14px;
  color: #22a05a;
}

.muted, .empty {
  color: var(--color-text-secondary);
  padding: 1rem 0;
}

.error { color: #d32f2f; }

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.modal {
  width: min(420px, 100%);
  background: var(--color-surface, #141414);
  border: 1px solid var(--color-border, #333);
  border-radius: 16px;
  padding: 1.1rem 1.2rem;
  color: var(--color-text-primary);
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal h3 { margin: 0; font-size: 1.15rem; }

.icon-btn {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.owner {
  display: flex;
  gap: 0.85rem;
  align-items: center;
  margin-bottom: 1rem;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 94, 0, 0.15);
  color: #ff5e00;
  display: grid;
  place-items: center;
  font-weight: 800;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin: 0 0 0.2rem;
  font-weight: 700;
}

.meta, .free-msg {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  line-height: 1.4;
}

.free-msg { margin-bottom: 1rem; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
