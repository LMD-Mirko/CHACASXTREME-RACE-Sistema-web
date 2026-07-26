<template>
  <div class="view-container">
    <header class="page-head">
      <div>
        <h1>Entrega de placas</h1>
        <p>Solo competidores con número asignado. Marcá el check cuando entreguen la placa física.</p>
      </div>
      <div class="stats">
        <span class="stat">
          <strong>{{ deliveredCount }}</strong> / {{ riders.length }} entregadas
        </span>
        <span class="stat muted">{{ pendingCount }} pendientes</span>
      </div>
    </header>

    <div class="toolbar">
      <div class="search-wrap">
        <AppInput
          v-model="search"
          placeholder="Buscar por nombre o placa..."
          icon="search"
          aria-label="Buscar"
        />
      </div>
      <div class="filter-wrap">
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Todas"
          icon="filter_alt"
        />
      </div>
      <AppButton variant="secondary" :disabled="loading" @click="load">
        <span class="material-icons">refresh</span>
        Actualizar
      </AppButton>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !riders.length" class="loading-state">
      <span class="material-icons rotating">sync</span>
      <span>Cargando placas asignadas…</span>
    </div>

    <div v-else class="table-wrap">
      <table class="delivery-table">
        <thead>
          <tr>
            <th class="col-check">Entregada</th>
            <th class="col-plate">Placa</th>
            <th>Nombre</th>
            <th class="hide-sm">Categoría</th>
            <th class="hide-sm">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredRiders.length">
            <td colspan="5" class="empty">
              {{ riders.length ? 'Sin resultados para este filtro.' : 'No hay competidores con placa asignada.' }}
            </td>
          </tr>
          <tr
            v-for="rider in filteredRiders"
            :key="rider.id"
            :class="{ 'is-delivered': isDelivered(rider) }"
          >
            <td class="col-check">
              <label class="check-label" :title="isDelivered(rider) ? 'Marcar pendiente' : 'Marcar entregada'">
                <input
                  type="checkbox"
                  :checked="isDelivered(rider)"
                  :disabled="togglingId === rider.id"
                  @change="onToggle(rider, $event.target.checked)"
                />
                <span class="check-ui" :class="{ on: isDelivered(rider), busy: togglingId === rider.id }">
                  <span class="material-icons">{{ isDelivered(rider) ? 'check' : '' }}</span>
                </span>
              </label>
            </td>
            <td class="col-plate">
              <span class="plate-badge">#{{ rider.plate_number }}</span>
            </td>
            <td>
              <div class="name-cell">
                <strong>{{ rider.full_name }}</strong>
                <span v-if="rider.nickname" class="nick">"{{ rider.nickname }}"</span>
              </div>
            </td>
            <td class="hide-sm">{{ rider.category?.name || '—' }}</td>
            <td class="hide-sm">
              <span class="status-pill">{{ statusLabel(rider.race_status) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getRidersWithPlate, setPlateDelivered } from '../services/plateDeliveryService.js';

const riders = ref([]);
const loading = ref(false);
const error = ref('');
const search = ref('');
const statusFilter = ref('all');
const togglingId = ref(null);

const statusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Solo pendientes' },
  { value: 'delivered', label: 'Solo entregadas' },
];

const STATUS_LABELS = {
  pre_inscrito: 'Pre-inscrito',
  en_carrera: 'En carrera',
  llego: 'Llegó',
  DNF: 'DNF',
  DNS: 'DNS',
};

function isDelivered(rider) {
  return Boolean(rider?.plate_delivered || rider?.plate_delivered_at);
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || '—';
}

const deliveredCount = computed(() => riders.value.filter(isDelivered).length);
const pendingCount = computed(() => riders.value.length - deliveredCount.value);

const filteredRiders = computed(() => {
  const q = search.value.trim().toLowerCase();
  return riders.value.filter((r) => {
    if (statusFilter.value === 'pending' && isDelivered(r)) return false;
    if (statusFilter.value === 'delivered' && !isDelivered(r)) return false;
    if (!q) return true;
    const name = String(r.full_name || '').toLowerCase();
    const nick = String(r.nickname || '').toLowerCase();
    const plate = String(r.plate_number || '');
    return name.includes(q) || nick.includes(q) || plate.includes(q);
  });
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    riders.value = await getRidersWithPlate();
  } catch (e) {
    error.value = e.friendlyMessage || e.message || 'No se pudo cargar la lista.';
  } finally {
    loading.value = false;
  }
}

async function onToggle(rider, delivered) {
  const prev = isDelivered(rider);
  const prevAt = rider.plate_delivered_at;
  rider.plate_delivered = delivered;
  rider.plate_delivered_at = delivered ? new Date().toISOString() : null;
  togglingId.value = rider.id;
  error.value = '';
  try {
    const updated = await setPlateDelivered(rider.id, delivered);
    Object.assign(rider, updated);
  } catch (e) {
    rider.plate_delivered = prev;
    rider.plate_delivered_at = prevAt;
    error.value = e.friendlyMessage || e.message || 'No se pudo actualizar la entrega.';
  } finally {
    togglingId.value = null;
  }
}

onMounted(load);
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.page-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.page-head h1 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.page-head p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  max-width: 36rem;
  line-height: 1.4;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.stat {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.stat strong {
  color: var(--color-primary, #ff5e00);
  font-size: 1rem;
}

.stat.muted {
  opacity: 0.85;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}

.search-wrap {
  flex: 2;
  min-width: 180px;
}

.filter-wrap {
  flex: 1;
  min-width: 160px;
}

.error {
  margin: 0;
  color: #dc2626;
  font-size: 0.88rem;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--color-text-secondary);
}

.rotating {
  animation: spin 1s linear infinite;
  color: var(--color-primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}

.delivery-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.delivery-table th,
.delivery-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.delivery-table th {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  font-weight: 700;
  background: rgba(0, 0, 0, 0.03);
}

:global(.dark-theme) .delivery-table th {
  background: rgba(255, 255, 255, 0.03);
}

.delivery-table tr:last-child td {
  border-bottom: none;
}

.delivery-table tr.is-delivered {
  background: rgba(16, 185, 129, 0.06);
}

.col-check {
  width: 88px;
  text-align: center;
}

.col-plate {
  width: 96px;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 2rem 1rem !important;
}

.plate-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.95rem;
  color: #fff;
  background: var(--color-primary, #ff5e00);
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.name-cell strong {
  color: var(--color-text-primary);
  font-weight: 700;
}

.nick {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.check-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.check-label input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.check-ui {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 2px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background, transparent);
  transition: border-color 0.15s, background 0.15s;
}

.check-ui .material-icons {
  font-size: 18px;
  color: #fff;
}

.check-ui.on {
  background: #10b981;
  border-color: #10b981;
}

.check-ui.busy {
  opacity: 0.55;
}

@media (max-width: 720px) {
  .hide-sm {
    display: none;
  }

  .page-head h1 {
    font-size: 1.1rem;
  }
}
</style>
