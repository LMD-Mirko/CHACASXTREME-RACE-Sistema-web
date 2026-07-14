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
        <span class="telemetry-lbl">Largada</span>
        <span class="telemetry-val-tech highlight-time">{{ formatStartClock(activeCompetition?.start_time) }}</span>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Transcurrido</span>
        <span class="telemetry-val-tech highlight-timer">{{ stopwatchTime }}</span>
      </div>
    </div>

    <!-- Único Buscador / Registrador de Placa en Ruta -->
    <div class="controls-card">
      <div class="control-item">
        <label class="control-lbl">Buscar piloto en ruta</label>
        <div class="search-input-row">
          <div class="search-input-container">
            <span class="material-icons search-input-icon">
              {{ searchMode === 'plate' ? 'tag' : 'person' }}
            </span>
            <input
              ref="searchInputRef"
              type="text"
              :inputmode="searchMode === 'plate' ? 'numeric' : 'text'"
              :placeholder="searchMode === 'plate' ? 'Digitar placa...' : 'Buscar por nombre...'"
              class="giant-search-input"
              v-model="searchQuery"
              @keyup.enter="onSearchEnter"
              aria-label="Buscar competidor"
            />
            
            <!-- Botón de Alternancia de Teclado -->
            <button
              class="keyboard-toggle-btn"
              :class="{ 'keyboard-toggle-btn--active': searchMode === 'name' }"
              @click="toggleSearchMode"
              type="button"
            >
              <span class="material-icons btn-icon-small">keyboard</span>
              <span class="keyboard-mode-label">{{ searchMode === 'plate' ? '123' : 'ABC' }}</span>
            </button>

            <!-- Botón para limpiar búsqueda -->
            <button
              v-if="searchQuery"
              class="clear-input-btn"
              @click="searchQuery = ''"
              type="button"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selector de Filtros de Pestaña Segmentados (Pills) -->
    <div class="tabs-segmented-container">
      <button
        class="tab-pill"
        :class="{ 'tab-pill--active': activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        <span>Pendientes</span>
        <span class="tab-count-badge">{{ ridersPending.length }}</span>
      </button>
      <button
        class="tab-pill"
        :class="{ 'tab-pill--active': activeTab === 'arrived' }"
        @click="activeTab = 'arrived'"
      >
        <span>Llegados</span>
        <span class="tab-count-badge tab-count-badge--success">{{ ridersArrived.length }}</span>
      </button>
      <button
        class="tab-pill"
        :class="{ 'tab-pill--active': activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        <span>Todos</span>
        <span class="tab-count-badge tab-count-badge--info">{{ ridersAll.length }}</span>
      </button>
    </div>

    <!-- Grilla de Pilotos Filtrados (Táctil) -->
    <div class="riders-section">
      <div class="riders-list-grid" v-if="activeRidersList.length > 0">
        <!-- Tarjeta Magnífica de Competidor -->
        <div
          v-for="rider in activeRidersList"
          :key="rider.id"
          class="rider-tactile-card"
          :class="{
            'rider-tactile-card--arrived': hasRiderPassedLocal(rider),
            'rider-tactile-card--remote-flash': remoteFlashPlate === parseInt(rider.plate_number, 10),
          }"
          @click="onRiderTap(rider)"
        >
          <!-- Izquierda: Placa de Competición -->
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

          <!-- Derecha: Estado de Paso -->
          <div class="rider-card-action">
            <span class="material-icons action-icon">
              {{ hasRiderPassedLocal(rider) ? 'done_all' : 'check' }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-riders-state">
        <span class="material-icons">motorcycle</span>
        <p v-if="activeTab === 'pending'">¡Todos los corredores de esta manga han pasado por aquí!</p>
        <p v-else-if="activeTab === 'arrived'">Ningún corredor ha registrado paso por aquí todavía.</p>
        <p v-else>No hay corredores que coincidan con la búsqueda.</p>
      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN PREVIO A REGISTRO -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmModal" class="confirm-overlay" @click.self="showConfirmModal = false">
          <div class="confirm-modal-box">
            <div class="confirm-badge-icon">
              <span class="material-icons">info_outline</span>
            </div>
            <h3>¿Confirmar Paso?</h3>
            <p class="confirm-modal-text">¿Deseas registrar el paso de este competidor por este punto?</p>
            
            <div class="confirm-rider-details-card">
              <div class="confirm-rider-plate">#{{ selectedRiderToConfirm?.plate_number }}</div>
              <div class="confirm-rider-name">{{ selectedRiderToConfirm?.full_name }}</div>
              <div class="confirm-rider-category">{{ selectedRiderToConfirm?.category?.name || 'Sin Categoría' }}</div>
            </div>

            <div class="confirm-modal-actions">
              <button class="btn-cancel-modal" @click="showConfirmModal = false">
                Cancelar
              </button>
              <button class="btn-confirm-modal" @click="confirmRiderPass">
                Sí, Registrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- PANTALLA DE ÉXITO ESTILO TRANSACCIÓN / PAGO CON TARJETA -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showSuccessOverlay" class="success-overlay">
          <div class="success-modal-box">
            <!-- Animación de Check SVG Elegante -->
            <div class="checkmark-wrapper">
              <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div class="success-title">¡REGISTRO EXITOSO!</div>
            <div class="success-plate">PLACA #{{ lastCheckedRider?.plate_number }}</div>
            <div class="success-name">{{ lastCheckedRider?.full_name }}</div>
            <div class="success-location">Registrado en {{ checkpointName }}</div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TOAST DE ERROR / MESA COMPARTIDA -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="errorToastMessage || meshNotice" class="error-toast-overlay">
          <div
            class="error-toast-box"
            :class="{
              'error-toast-box--remote': meshNotice?.type === 'remote',
              'error-toast-box--warn': meshNotice?.type === 'warn' || meshNotice?.type === 'error',
            }"
          >
            <span class="material-icons error-toast-icon">
              {{ meshNotice?.type === 'remote' ? 'devices' : 'warning' }}
            </span>
            <span class="error-toast-text">{{ errorToastMessage || meshNotice?.message }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { formatTimeOnly } from '../../../core/time/raceTime';
import { useMangaElapsedStopwatch } from '../../../core/time/useMangaElapsedStopwatch';

const {
  checkpointName,
  activeCompetition,
  selectedPhase,
  searchQuery,
  ridersAll,
  ridersPending,
  ridersArrived,
  lastCheckedRider,
  registerPass,
  remoteFlashPlate,
  meshNotice,
  hasRiderPassed,
} = useCheckpoint();

const activeTab = ref('pending'); // 'pending', 'arrived', 'all'
const searchMode = ref('plate'); // 'plate' (numeric) or 'name' (text)
const searchInputRef = ref(null);

const { stopwatchTime } = useMangaElapsedStopwatch(activeCompetition);

// Modal de confirmación y estado del piloto seleccionado
const showConfirmModal = ref(false);
const selectedRiderToConfirm = ref(null);
const showSuccessOverlay = ref(false);
const errorToastMessage = ref('');
let errorToastTimeout = null;

// Determinar el listado activo a renderizar
const activeRidersList = computed(() => {
  if (activeTab.value === 'pending') return ridersPending.value;
  if (activeTab.value === 'arrived') return ridersArrived.value;
  return ridersAll.value;
});

// Cambiar el modo de búsqueda y tipo de teclado
function toggleSearchMode() {
  searchMode.value = searchMode.value === 'plate' ? 'name' : 'plate';
  searchQuery.value = '';
  setTimeout(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  }, 50);
}

// Al dar enter en el input único
function onSearchEnter() {
  const query = searchQuery.value.trim();
  if (!query) return;

  // Si busca por número de placa exacto
  if (/^\d+$/.test(query)) {
    const rider = ridersAll.value.find(r => parseInt(r.plate_number) === parseInt(query));
    if (rider) {
      triggerConfirmFlow(rider);
    } else {
      showErrorToast(`Placa #${query} no encontrada en esta manga`);
    }
  }
}

function showErrorToast(msg) {
  if (errorToastTimeout) clearTimeout(errorToastTimeout);
  errorToastMessage.value = msg;
  errorToastTimeout = setTimeout(() => {
    errorToastMessage.value = '';
  }, 3000);
}

// Activar flujo de confirmación previo a registro
function triggerConfirmFlow(rider) {
  selectedRiderToConfirm.value = rider;
  showConfirmModal.value = true;
}

function onRiderTap(rider) {
  if (hasRiderPassedLocal(rider)) {
    showErrorToast(`#${rider.plate_number} ya está marcado en la mesa`);
    return;
  }
  triggerConfirmFlow(rider);
}

async function confirmRiderPass() {
  if (!selectedRiderToConfirm.value) return;

  const plate = selectedRiderToConfirm.value.plate_number;
  showConfirmModal.value = false;

  const result = await registerPass(plate);
  searchQuery.value = '';

  if (result?.already) {
    selectedRiderToConfirm.value = null;
    return;
  }

  if (!result?.ok) {
    selectedRiderToConfirm.value = null;
    if (result?.reason === 'error') {
      showErrorToast('No se pudo registrar el pase');
    }
    return;
  }

  showSuccessOverlay.value = true;
  setTimeout(() => {
    showSuccessOverlay.value = false;
    selectedRiderToConfirm.value = null;
  }, 1800);
}

function hasRiderPassedLocal(rider) {
  return hasRiderPassed(rider);
}

onBeforeUnmount(() => {
  if (errorToastTimeout) clearTimeout(errorToastTimeout);
});

function formatStartClock(dateTimeStr) {
  if (!dateTimeStr) return 'No Iniciada';
  return formatTimeOnly(dateTimeStr);
}
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  overflow-x: hidden; /* Evitar cualquier scroll horizontal accidental */
}

.checkpoint-info-row {
  display: flex;
  justify-content: flex-start;
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

/* Telemetry Grid */
.live-telemetry-status {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px;
  gap: 8px;
  box-shadow: var(--shadow-premium);
  text-align: center;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  min-width: 0;
}

.telemetry-lbl {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.telemetry-val-tech {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-time {
  color: #10B981;
}

.highlight-timer {
  color: var(--color-primary);
  font-weight: 900;
}

/* Controls Card - Single Search Input */
.controls-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 16px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-lbl {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

.search-input-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.search-input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0 12px;
  height: 48px;
  transition: border-color 0.2s ease;
  min-width: 0;
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
  width: 100%;
  padding-right: 64px; /* Espacio para el botón de teclado y limpiar */
}

/* Botón alternancia teclado 123/ABC */
.keyboard-toggle-btn {
  position: absolute;
  right: 36px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 3px 6px;
  color: var(--color-text-secondary);
  font-family: var(--font-headings);
  font-weight: 800;
  font-size: 10px;
  cursor: pointer;
  height: 26px;
  touch-action: manipulation;
  user-select: none;
}

.keyboard-toggle-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF !important;
}

.btn-icon-small {
  font-size: 12px;
}

.keyboard-mode-label {
  letter-spacing: 0.3px;
}

.clear-input-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

/* Tabs Segmented Pills (Sleek iOS Style Segmented Control) */
.tabs-segmented-container {
  display: flex;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
  height: 46px;
}

.tab-pill {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 11px; /* Ligeramente menor para caber en celulares pequeños */
  font-weight: 750;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  min-width: 0; /* Permite contraerse adecuadamente */
}

.tab-pill--active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:global(.dark-theme) .tab-pill--active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tab-count-badge {
  font-size: 9px;
  font-weight: 800;
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-secondary);
  padding: 1px 6px;
  border-radius: 20px;
}

:global(.dark-theme) .tab-count-badge {
  background: rgba(255, 255, 255, 0.08);
}

.tab-pill--active .tab-count-badge {
  background: rgba(255, 94, 0, 0.1);
  color: var(--color-primary);
}

.tab-count-badge--success {
  background: rgba(16, 185, 129, 0.08);
  color: #10B981;
}

.tab-count-badge--info {
  background: rgba(30, 144, 255, 0.08);
  color: #1E90FF;
}

/* Riders Grid */
.riders-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.riders-list-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Tactile Cards */
.rider-tactile-card {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  min-height: 68px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
}

.rider-tactile-card--arrived {
  border-color: rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.02);
}

.rider-tactile-card--remote-flash {
  animation: remotePassFlash 1.1s ease;
  border-color: rgba(59, 130, 246, 0.55) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

@keyframes remotePassFlash {
  0% { transform: scale(1); background: rgba(59, 130, 246, 0.18); }
  40% { transform: scale(1.015); background: rgba(59, 130, 246, 0.12); }
  100% { transform: scale(1); }
}

.rider-plate-badge {
  display: flex;
  align-items: baseline;
  justify-content: center;
  background: rgba(255, 94, 0, 0.05);
  border: 1.5px solid var(--color-primary);
  border-radius: 10px;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-self: center;
}

.plate-hash {
  font-size: 10px;
  font-weight: 850;
  color: var(--color-primary);
  margin-right: 1px;
}

.plate-num {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 900;
  color: var(--color-primary);
}

.rider-tactile-card--arrived .rider-plate-badge {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.06);
}

.rider-tactile-card--arrived .plate-num,
.rider-tactile-card--arrived .plate-hash {
  color: #10B981;
}

.rider-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rider-card-name {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rider-card-category {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.rider-card-team {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85px; /* Reducido para evitar desborde en pantallas de 320px-375px */
}

.geo-icon {
  font-size: 11px;
  opacity: 0.6;
}

/* Right side pass action */
.rider-card-action {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
}

.rider-tactile-card--arrived .rider-card-action {
  background: #10B981;
  border-color: #10B981;
  color: #FFFFFF;
}

.action-icon {
  font-size: 15px;
}

.empty-riders-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 16px;
  text-align: center;
  color: var(--color-text-secondary);
  gap: 8px;
}

.empty-riders-state span {
  font-size: 36px;
}

.empty-riders-state p {
  font-size: 12px;
  font-weight: 600;
}

/* Modal overlays */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.confirm-modal-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  padding: 28px 24px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.25);
  animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.confirm-badge-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(255, 94, 0, 0.08);
  border: 1.5px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.confirm-badge-icon span {
  font-size: 28px;
}

.confirm-modal-box h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 900;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin: 0;
}

.confirm-modal-text {
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Card inside confirmation modal */
.confirm-rider-details-card {
  width: 100%;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.confirm-rider-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 900;
  color: var(--color-primary);
}

.confirm-rider-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  text-align: center;
}

.confirm-rider-category {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.confirm-modal-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.btn-cancel-modal {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-modal:hover {
  background: var(--color-input-bg);
}

.btn-confirm-modal {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  border: none;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
}

.btn-confirm-modal:hover {
  opacity: 0.95;
}

/* Success Overlay (Elegant card payment drawing success overlay) */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(16, 185, 129, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: fadeIn 0.3s ease;
}

.success-modal-box {
  background: var(--color-surface);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 32px;
  padding: 40px 32px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1), 
              0 0 40px rgba(16, 185, 129, 0.05);
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.checkmark-wrapper {
  width: 84px;
  height: 84px;
  position: relative;
  margin-bottom: 24px;
}

/* Premium Card Payment-like Checkmark Animation */
.checkmark {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: block;
  stroke-width: 3.5;
  stroke: #10B981;
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px #10B981;
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s forwards;
}

.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3.5;
  stroke-miterlimit: 10;
  stroke: #10B981;
  fill: none;
  animation: stroke .6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #FFFFFF;
  animation: stroke .3s cubic-bezier(0.65, 0, 0.45, 1) .75s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 42px #10B981;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.08, 1.08, 1);
  }
}

.success-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #10B981;
  margin-bottom: 12px;
}

.success-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 900;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.success-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.success-location {
  font-size: 10.5px;
  color: var(--color-text-secondary);
  font-weight: 700;
  text-transform: uppercase;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Toast de Error Premium */
.error-toast-overlay {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100000;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.error-toast-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #EF4444;
  color: #FFFFFF;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25);
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: min(92vw, 420px);
}

.error-toast-box--remote {
  background: #1d4ed8;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
}

.error-toast-box--warn {
  background: #d97706;
  box-shadow: 0 10px 30px rgba(217, 119, 6, 0.28);
}

.error-toast-text {
  white-space: normal;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.error-toast-icon {
  font-size: 20px;
  color: #FFFFFF;
}

.error-toast-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
</style>
