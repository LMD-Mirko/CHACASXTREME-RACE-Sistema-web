<template>
  <div class="scanner-container fade-in">
    <!-- Fila Superior: Info del Checkpoint -->
    <div class="checkpoint-info-row">
      <div class="checkpoint-badge">
        <span class="material-icons badge-icon">room</span>
        <span class="badge-text">{{ checkpointName }}</span>
        <span class="badge-separator">•</span>
        <span class="badge-phase">{{ selectedPhase === 'practica' ? 'PRUEBA' : 'FINAL' }}</span>
      </div>
    </div>

    <!-- Live Telemetry Status Bar -->
    <div class="live-telemetry-status">
      <div class="telemetry-item">
        <span class="telemetry-lbl">Evento</span>
        <span class="telemetry-val-tech">{{ activeCompetition?.name || 'Cargando...' }}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Fase</span>
        <span class="telemetry-val-tech highlight-phase">{{ selectedPhase === 'practica' ? 'Prueba' : 'Final' }}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Largada</span>
        <span class="telemetry-val-tech highlight-time">{{ formatTimeOnly(activeCompetition?.start_time) }}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Transcurrido</span>
        <span class="telemetry-val-tech highlight-timer">{{ stopwatchTime }}</span>
      </div>
    </div>

    <!-- Buscador de Piloto (Optimizado Móvil) -->
    <div class="controls-card">
      <div class="control-item">
        <label class="control-lbl">Buscar Piloto en Ruta</label>
        <div class="search-input-container">
          <span class="material-icons search-input-icon">
            {{ searchMode === 'plate' ? 'tag' : 'badge' }}
          </span>
          <input
            ref="searchInputRef"
            type="text"
            :inputmode="searchMode === 'plate' ? 'numeric' : 'text'"
            :placeholder="searchMode === 'plate' ? 'Buscar placa...' : 'Buscar nombre...'"
            class="giant-search-input"
            v-model="searchQuery"
            aria-label="Buscar competidor"
          />
          <button
            class="keyboard-toggle-btn"
            :class="{ 'keyboard-toggle-btn--active': searchMode === 'name' }"
            @click="toggleSearchMode"
            type="button"
          >
            <span class="material-icons btn-icon-small">keyboard</span>
            <span class="keyboard-mode-label">{{ searchMode === 'plate' ? '123' : 'ABC' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Panel de Registro Manual Rápido (Placas) -->
    <div class="manual-input-card">
      <div class="manual-input-row">
        <div class="manual-input-box">
          <span class="material-icons manual-icon">tag</span>
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            v-model="manualPlate"
            placeholder="Digitar Placa..."
            class="giant-manual-input"
            @keyup.enter="onSubmitManual"
          />
        </div>
        <button
          class="btn-register-action"
          :disabled="!manualPlate"
          @click="onSubmitManual"
        >
          <span class="material-icons">check_circle</span>
          <span>Registrar</span>
        </button>
      </div>
    </div>

    <!-- Grilla de Pilotos en Carrera (Táctil) -->
    <div class="riders-section">
      <div class="section-title-row">
        <h3>Corredores en Ruta (Toca para marcar paso)</h3>
        <span class="riders-count">{{ ridersInRace.length }} en pista</span>
      </div>

      <div class="riders-list-grid" v-if="ridersInRace.length > 0">
        <!-- Tarjeta Magnífica de Competidor -->
        <div
          v-for="rider in ridersInRace"
          :key="rider.id"
          class="rider-tactile-card"
          @click="onRiderTap(rider)"
        >
          <!-- Izquierda: Placa de Competición Deportiva -->
          <div class="rider-plate-badge">
            <span class="plate-hash">#</span>
            <span class="plate-num">{{ rider.plate_number }}</span>
          </div>

          <!-- Centro: Datos del Corredor -->
          <div class="rider-card-info">
            <h4 class="rider-card-name">{{ rider.full_name }}</h4>
            <div class="rider-card-meta">
              <span class="rider-card-category">{{ rider.category?.name || 'Sin Cat.' }}</span>
              <span v-if="rider.origin || rider.club_team" class="rider-card-team">
                <span class="material-icons geo-icon">flag</span>
                {{ rider.club_team || rider.origin }}
              </span>
            </div>
          </div>

          <!-- Derecha: Botón de Acción Táctil -->
          <div class="rider-card-action">
            <span class="material-icons action-icon">check</span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-riders-state">
        <span class="material-icons">motorcycle</span>
        <p>No hay corredores en pista con los filtros seleccionados.</p>
      </div>
    </div>

    <!-- Modal de confirmación de 2 segundos (Rediseñado por Temas) -->
    <Transition name="fade">
      <div v-if="showCheckModal" class="confirm-overlay">
        <div class="confirm-modal-box">
          <div class="check-animation-circle">
            <span class="material-icons check-icon-anim">done</span>
          </div>
          <div class="confirm-plate">PLACA #{{ lastCheckedRider?.plate_number }}</div>
          <div class="confirm-name">{{ lastCheckedRider?.full_name }}</div>
          <div class="confirm-message">Registrado en {{ checkpointName }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useCheckpoint } from '../hooks/useCheckpoint';

defineEmits(['change-setup']);

const {
  checkpointName,
  activeCompetition,
  selectedPhase,
  searchQuery,
  ridersInRace,
  showCheckModal,
  lastCheckedRider,
  registerPass
} = useCheckpoint();

const stopwatchTime = ref('00:00:00');
let stopwatchInterval = null;

function updateStopwatch() {
  if (!activeCompetition.value || !activeCompetition.value.start_time) {
    stopwatchTime.value = '00:00:00';
    return;
  }
  let startStr = activeCompetition.value.start_time;
  if (!startStr.includes('T')) {
    startStr = startStr.replace(' ', 'T') + 'Z';
  }
  const start = new Date(startStr).getTime();
  const now = new Date().getTime();
  const diff = now - start;
  if (diff < 0) {
    stopwatchTime.value = '00:00:00';
    return;
  }
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  stopwatchTime.value = 
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0');
}

watch(() => activeCompetition.value, (newVal) => {
  if (newVal && newVal.start_time) {
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    updateStopwatch();
    stopwatchInterval = setInterval(updateStopwatch, 1000);
  }
}, { immediate: true });

onBeforeUnmount(() => {
  if (stopwatchInterval) clearInterval(stopwatchInterval);
});

const categoryStartTime = computed(() => {
  if (!activeCompetition.value) return 'No Iniciada';
  const starts = activeCompetition.value.category_starts || [];
  const activeTimes = starts
    .map(s => (selectedPhase.value === 'practica') ? s.practice_start_time : s.final_start_time)
    .filter(t => !!t);

  if (activeTimes.length > 0) {
    const sorted = [...activeTimes].sort();
    return formatTimeOnly(sorted[0]);
  }
  return 'No Iniciada';
});

function formatTimeOnly(dateTimeStr) {
  if (!dateTimeStr) return 'No Iniciada';
  try {
    let cleanStr = String(dateTimeStr);
    if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
      if (cleanStr.includes(' ')) {
        cleanStr = cleanStr.replace(' ', 'T') + 'Z';
      } else {
        cleanStr = cleanStr + 'Z';
      }
    }
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dateTimeStr;
  }
}

const manualPlate = ref('');
const searchMode = ref('plate'); // 'plate' or 'name'
const searchInputRef = ref(null);

function toggleSearchMode() {
  searchMode.value = searchMode.value === 'plate' ? 'name' : 'plate';
  searchQuery.value = '';
  setTimeout(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  }, 50);
}

function onSubmitManual() {
  if (!manualPlate.value.trim()) return;
  registerPass(manualPlate.value.trim());
  manualPlate.value = '';
}

function onRiderTap(rider) {
  registerPass(rider.plate_number);
}
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkpoint-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkpoint-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
}

.badge-icon {
  font-size: 16px;
}

.badge-separator {
  color: var(--color-border);
}

.badge-phase {
  font-family: var(--font-headings);
  font-size: 11px;
  background: rgba(255, 94, 0, 0.08);
  padding: 2px 8px;
  border-radius: 6px;
}

.btn-reconfigure {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
}

.btn-reconfigure:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(255, 94, 0, 0.02);
}

.controls-card,
.manual-input-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 18px;
  box-shadow: var(--shadow-premium);
}

.grid-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .grid-controls {
    grid-template-columns: 1fr 1fr;
  }
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

/* Buscador de placa con teclado dual */
.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0 12px;
  height: 48px;
  transition: border-color 0.2s ease;
}

.search-input-container:focus-within {
  border-color: var(--color-primary);
}

.search-input-icon {
  font-size: 20px;
  color: var(--color-text-secondary);
  margin-right: 8px;
}

.giant-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-family);
  width: 100%;
}

.keyboard-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px 8px;
  color: var(--color-text-secondary);
  font-family: var(--font-headings);
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  height: 28px;
  touch-action: manipulation;
}

.keyboard-toggle-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF !important;
}

.btn-icon-small {
  font-size: 14px;
}

.keyboard-mode-label {
  letter-spacing: 0.5px;
}

/* Panel manual */
.manual-input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.manual-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  height: 52px;
  padding: 0 16px;
  transition: border-color 0.2s ease;
}

.manual-input-box:focus-within {
  border-color: var(--color-primary);
}

.manual-icon {
  font-size: 22px;
  color: var(--color-text-secondary);
  margin-right: 10px;
}

.giant-manual-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 0.5px;
}

.btn-register-action {
  height: 52px;
  padding: 0 24px;
  border-radius: 12px;
  border: none;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
}

.btn-register-action:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 94, 0, 0.25);
}

.btn-register-action:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-register-action:disabled {
  background: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

/* Grilla de Pilotos */
.riders-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.section-title-row h3 {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.riders-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.08);
  padding: 2px 10px;
  border-radius: 20px;
}

.riders-list-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 768px) {
  .riders-list-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Tarjeta Magnífica de Corredor */
.rider-tactile-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  gap: 14px;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  min-height: 72px; /* Large touch target */
}

.rider-tactile-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  box-shadow: 0 6px 16px rgba(255, 94, 0, 0.08);
}

.rider-tactile-card:active {
  transform: scale(0.97);
  background: rgba(255, 94, 0, 0.03);
}

/* Placa Deportiva */
.rider-plate-badge {
  display: flex;
  align-items: baseline;
  justify-content: center;
  background: rgba(255, 94, 0, 0.07);
  border: 1.5px solid var(--color-primary);
  border-radius: 12px;
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  align-self: center;
  position: relative;
  box-shadow: inset 0 0 8px rgba(255, 94, 0, 0.05);
}

.plate-hash {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-primary);
  opacity: 0.8;
  margin-right: 1px;
}

.plate-num {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 900;
  color: var(--color-primary);
}

/* Datos */
.rider-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.rider-card-name {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rider-card-category {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.dark-theme .rider-card-category {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary);
}

.rider-card-team {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.geo-icon {
  font-size: 12px;
  opacity: 0.6;
}

/* Acción */
.rider-card-action {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.rider-tactile-card:hover .rider-card-action {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
  transform: rotate(90deg);
}

.action-icon {
  font-size: 16px;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.rider-tactile-card:hover .action-icon {
  color: #FFFFFF;
}

.empty-riders-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 16px;
  text-align: center;
  color: var(--color-text-secondary);
  gap: 8px;
}

.empty-riders-state span {
  font-size: 40px;
}

/* Modal de confirmación */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.confirm-modal-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 30px 40px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.check-animation-circle {
  width: 64px;
  height: 64px;
  background: var(--color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.check-icon-anim {
  font-size: 40px;
  color: #FFFFFF;
}

.confirm-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 900;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.confirm-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.confirm-message {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Live Telemetry Status Bar */
.live-telemetry-status {
  display: flex;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px 16px;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.telemetry-lbl {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.8px;
}

.telemetry-val-tech {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-phase {
  color: var(--color-primary);
  text-transform: uppercase;
}

.highlight-time {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--color-success);
}
</style>
