<template>
  <div class="queue-card fade-in">
    <div class="queue-header">
      <div class="title-col">
        <span class="material-icons text-primary">assignment_turned_in</span>
        <h3>Cola de Tiempos Pendientes</h3>
      </div>
      <button
        v-if="finishTimeQueue.length > 0"
        class="btn-purge"
        @click="purgeQueue"
      >
        <span class="material-icons">delete_sweep</span>
        Purgar Cola
      </button>
    </div>

    <!-- Tabla de Tiempos Ciegos -->
    <div class="table-wrapper" v-if="finishTimeQueue.length > 0">
      <table class="queue-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Tiempo Congelado</th>
            <th>Asignar Placa</th>
            <th class="text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in finishTimeQueue" :key="item.id">
            <td class="pos-cell">#{{ index + 1 }}</td>
            <td class="time-cell">{{ formatTimeStr(item.blind_timestamp) }}</td>
            <td class="input-cell">
              <div class="assign-input-group">
                <input
                  type="text"
                  placeholder="Placa..."
                  v-model="plates[item.id]"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="plate-field"
                  @keyup.enter="onAssign(item.id)"
                />
                <button
                  class="btn-assign"
                  :disabled="!plates[item.id]"
                  @click="onAssign(item.id)"
                >
                  Ok
                </button>
              </div>
            </td>
            <td class="action-cell text-right">
              <button
                class="btn-annul"
                title="Anular marca"
                @click="onAnnul(item.id)"
              >
                <span class="material-icons">close</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-queue">
      <span class="material-icons">timer_off</span>
      <p>Sin marcas de tiempo pendientes en cola.</p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useMeta } from '../../hooks/useMeta';
import { formatTimeStr } from '../../../../core/time/raceTime';

const {
  finishTimeQueue,
  assignBlindTime,
  annulBlindTime,
  purgeQueue
} = useMeta();

const plates = reactive({});

function onAssign(id) {
  const pl = plates[id];
  if (!pl || !pl.trim()) return;
  assignBlindTime(id, parseInt(pl.trim()));
  plates[id] = ''; // clear input
}

function onAnnul(id) {
  if (confirm('¿Estás seguro de que deseas anular esta marca de tiempo?')) {
    annulBlindTime(id);
  }
}
</script>

<style scoped>
.queue-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.title-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-primary {
  color: var(--color-primary);
}

.queue-header h3 {
  font-size: 15px;
  font-weight: 700;
}

.btn-purge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
}

.btn-purge:hover {
  background: var(--color-error);
  color: #FFFFFF;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
}

.queue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.queue-table th {
  text-align: left;
  padding: 8px 10px;
  font-weight: 700;
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border);
  text-transform: uppercase;
  font-size: 11px;
}

.queue-table td {
  padding: 10px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.pos-cell {
  font-weight: 800;
  color: var(--color-text-secondary);
}

.time-cell {
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
}

.assign-input-group {
  display: flex;
  gap: 6px;
  max-width: 140px;
}

.plate-field {
  width: 70px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  text-align: center;
  font-weight: 700;
  outline: none;
  font-size: 13px;
}

.plate-field:focus {
  border-color: var(--color-primary);
}

.btn-assign {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  border: none;
  background: var(--color-primary);
  color: #FFFFFF;
  font-weight: 700;
  cursor: pointer;
}

.btn-assign:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-annul {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-annul:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

.text-right {
  text-align: right;
}

.empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
  text-align: center;
  gap: 8px;
}

.empty-queue span {
  font-size: 48px;
}
</style>
