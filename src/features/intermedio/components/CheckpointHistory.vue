<template>
  <div class="history-container fade-in">
    <div class="history-grid">
      <!-- Panel de Historial de Marcas Recientes -->
      <div class="card panel-history">
        <div class="panel-header">
          <span class="material-icons header-icon">history</span>
          <h3>Últimos pasos · mesa</h3>
        </div>

        <div class="passes-list" v-if="historyPasses.length > 0">
          <div
            v-for="pass in historyPasses"
            :key="pass.id"
            class="pass-item"
            :class="{
              'pass-item--offline': pass.isOffline || pass.source === 'offline',
              'pass-item--remote': pass.source === 'remote',
            }"
          >
            <div class="pass-plate-badge">
              #{{ pass.plate_number }}
            </div>

            <div class="pass-info-col">
              <span class="rider-name">{{ pass.full_name }}</span>
              <div class="pass-meta-row">
                <span class="time-lbl text-mono">{{ formatTime(pass.exact_time) }}</span>
                <span class="bullet-separator">•</span>
                <span
                  class="sync-status-lbl"
                  :class="{
                    'status-offline': pass.isOffline || pass.source === 'offline',
                    'status-remote': pass.source === 'remote',
                  }"
                >
                  {{ sourceLabel(pass) }}
                </span>
              </div>
            </div>
            
            <div class="pass-actions" v-if="canEditPass(pass)">
              <button
                class="action-btn btn-edit"
                title="Editar Placa"
                @click="promptEdit(pass)"
              >
                <span class="material-icons">edit</span>
              </button>
              <button
                class="action-btn btn-delete"
                title="Eliminar Paso"
                @click="onDelete(pass)"
              >
                <span class="material-icons">delete</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-history">
          <span class="material-icons empty-icon">history_toggle_off</span>
          <p>Sin marcas en la mesa todavía.</p>
        </div>
      </div>

      <!-- Panel de Contingencias y Retiros DNF -->
      <div class="card panel-dnf">
        <div class="panel-header">
          <span class="material-icons header-icon">warning</span>
          <h3>Reportar Retiro (DNF)</h3>
        </div>

        <div class="dnf-input-row">
          <div class="select-wrapper">
            <select v-model="selectedRiderId" class="rider-select">
              <option value="" disabled>Seleccionar piloto en pista...</option>
              <option
                v-for="rider in ridersInRace"
                :key="rider.id"
                :value="rider.id"
              >
                #{{ rider.plate_number }} - {{ rider.full_name }}
              </option>
            </select>
            <span class="material-icons select-arrow">arrow_drop_down</span>
          </div>
          
          <button
            class="btn-dnf-retire"
            :disabled="!selectedRiderId"
            @click="onRetire"
          >
            Marcar DNF
          </button>
        </div>

        <!-- Listado de DNF Recientes para revertir -->
        <div class="dnf-list-section">
          <h4>Pilotos Retirados (DNF)</h4>
          <div class="dnf-list" v-if="dnfRiders.length > 0">
            <div
              v-for="rider in dnfRiders"
              :key="rider.id"
              class="dnf-item"
            >
              <div class="dnf-info">
                <span class="dnf-plate">#{{ rider.plate_number }}</span>
                <span class="dnf-name">{{ rider.full_name }}</span>
              </div>
              <button class="btn-revert-dnf" @click="onRevert(rider.id)">
                Reactivar
              </button>
            </div>
          </div>
          <div v-else class="empty-dnf-state">
            Sin retiros registrados en este punto.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { formatTimeOnly } from '../../../core/time/raceTime';

const {
  historyPasses,
  riders,
  ridersInRace,
  retireRiderDNF,
  revertRiderDNF,
  editPassPlate,
  deletePassRecord
} = useCheckpoint();

const selectedRiderId = ref('');

const dnfRiders = computed(() => {
  return riders.value.filter(r => r.race_status === 'DNF');
});

function formatTime(dateTimeStr) {
  return formatTimeOnly(dateTimeStr);
}

function sourceLabel(pass) {
  if (pass.isOffline || pass.source === 'offline') return 'Offline · este celular';
  if (pass.source === 'remote') return 'Mesa compartida';
  return 'Este celular';
}

function canEditPass(pass) {
  if (!pass?.id || pass.isOffline || pass.source === 'offline') return false;
  return typeof pass.id === 'number' || /^\d+$/.test(String(pass.id));
}

function promptEdit(pass) {
  const newPlate = prompt(`Modificar placa para el registro de las ${formatTime(pass.exact_time)}:`, pass.plate_number);
  if (newPlate !== null && newPlate.trim() !== '') {
    editPassPlate(pass.id, parseInt(newPlate.trim()));
  }
}

function onDelete(pass) {
  if (confirm(`¿Estás seguro de eliminar el registro de paso de la placa ${pass.plate_number}?`)) {
    deletePassRecord(pass.id);
  }
}

function onRetire() {
  if (!selectedRiderId.value) return;
  const r = riders.value.find(r => r.id === selectedRiderId.value);
  if (confirm(`¿Marcar a ${r.full_name} (Placa ${r.plate_number}) como DNF?`)) {
    retireRiderDNF(selectedRiderId.value);
    selectedRiderId.value = '';
  }
}

function onRevert(riderId) {
  const r = riders.value.find(r => r.id === riderId);
  if (confirm(`¿Revertir retiro de ${r.full_name} y regresarlo a En Carrera?`)) {
    revertRiderDNF(riderId);
  }
}
</script>

<style scoped>
.history-container {
  margin-top: 8px;
}

.history-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 1024px) {
  .history-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-premium);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.header-icon {
  color: var(--color-primary);
  font-size: 20px;
}

.panel-header h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-primary);
}

.passes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pass-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  gap: 12px;
  transition: border-color 0.2s ease;
}

.pass-item:hover {
  border-color: var(--color-primary);
}

.pass-item--offline {
  border-left: 3px solid var(--color-secondary);
}

.pass-item--remote {
  border-left: 3px solid #3b82f6;
  background: rgba(59, 130, 246, 0.04);
}

.sync-status-lbl.status-offline {
  color: var(--color-secondary);
}

.sync-status-lbl.status-remote {
  color: #3b82f6;
}

.pass-plate-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 94, 0, 0.08);
  border: 1.5px solid var(--color-primary);
  border-radius: 8px;
  padding: 6px 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13.5px;
  font-weight: 900;
  color: var(--color-primary);
  flex-shrink: 0;
}

.pass-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}

.rider-name {
  font-size: 13px;
  font-weight: 800;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
}

.pass-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.time-lbl {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.bullet-separator {
  color: var(--color-border);
  font-size: 10px;
  opacity: 0.6;
}

.sync-status-lbl {
  font-size: 9px;
  color: var(--color-success);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.sync-status-lbl.status-offline {
  color: var(--color-secondary);
}

.pass-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn span {
  font-size: 18px;
}

.btn-edit:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

.btn-delete:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}

.empty-history,
.empty-dnf-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  color: var(--color-text-secondary);
  text-align: center;
  background: var(--color-input-bg);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  gap: 6px;
}

.empty-icon {
  font-size: 32px;
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.empty-history p,
.empty-dnf-state {
  font-size: 12.5px;
  font-weight: 600;
}

/* Sección DNF */
.dnf-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}

.select-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.rider-select {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  padding: 0 32px 0 12px;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: var(--color-text-secondary);
}

.btn-dnf-retire {
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: var(--color-error);
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.btn-dnf-retire:hover:not(:disabled) {
  opacity: 0.95;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-dnf-retire:disabled {
  background: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

.dnf-list-section h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.dnf-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.dnf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  border-radius: 10px;
}

.dnf-info {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.dnf-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 900;
  color: var(--color-error);
  margin-right: 8px;
  flex-shrink: 0;
}

.dnf-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-revert-dnf {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-revert-dnf:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.02);
}

@media (max-width: 580px) {
  .card {
    padding: 14px;
  }
  .dnf-input-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .select-wrapper {
    width: 100%;
  }
  .btn-dnf-retire {
    width: 100%;
  }
  .pass-item {
    padding: 10px;
    gap: 8px;
  }
  .pass-plate-badge {
    font-size: 12px;
    padding: 4px 8px;
  }
  .rider-name {
    font-size: 12.5px;
  }
}
</style>
