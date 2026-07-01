<template>
  <div class="view-container">
    <div class="partida-view-layout">
      <!-- Estados de carga y error iniciales -->
      <div v-if="isLoading && riders.length === 0" class="loading-state">
        <span class="material-icons rotating">sync</span>
        <span>Sincronizando datos de grilla...</span>
      </div>
      <div v-else-if="errorMessage" class="error-banner">
        <span class="material-icons">error_outline</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Asistente de Largada Paso a Paso -->
      <div v-else class="partida-body-section">
        
        <!-- PASO 1: CONFIGURACIÓN -->
        <div v-if="currentStep === 1" class="setup-step-container fade-in">
          <!-- Asistente de Configuración -->
          <div class="setup-wizard-card">
            <div class="card-header-sport">
              <h2>Configuración de Largada</h2>
            </div>
            
            <div class="setup-body">
              <!-- Selector de Fase -->
              <div class="setup-field-group">
                <label class="setup-field-label">Fase del Evento</label>
                <div class="phase-selector-segmented">
                  <button
                    class="phase-segment-btn"
                    :class="{ 'phase-segment-btn--active-practice': selectedPhase === 'practica' }"
                    @click="selectedPhase = 'practica'"
                  >
                    Prueba
                  </button>
                  <button
                    class="phase-segment-btn"
                    :class="{ 'phase-segment-btn--active-final': selectedPhase === 'final' }"
                    @click="selectedPhase = 'final'"
                  >
                    Final
                  </button>
                </div>
              </div>

              <!-- Selector de Modo de Salida -->
              <div class="setup-field-group">
                <label class="setup-field-label">Configuración de Salida</label>
                <AppSelect
                  v-model="selectedCategoryId"
                  :options="categories"
                  icon="sports_motorsports"
                  placeholder="Seleccionar Largada"
                />
              </div>

              <!-- Resumen de Salida (Diseño Premium Minimalista) -->
              <div class="setup-summary-list">
                <div class="summary-row-tech">
                  <span class="row-tech-label">Participantes</span>
                  <span class="row-tech-val">{{ totalRidersToStart }}</span>
                </div>
                <div class="summary-row-tech">
                  <span class="row-tech-label">Categorías</span>
                  <span class="row-tech-val">{{ totalCategoriesToStart }}</span>
                </div>
                <div class="summary-row-tech">
                  <span class="row-tech-label">Modo de largada</span>
                  <span class="row-tech-val highlight-tech-val">
                    {{ selectedCategoryId === 'all' ? 'Mega Avalancha' : 'Por Categoría' }}
                  </span>
                </div>
              </div>

              <!-- Botón Iniciar -->
              <AppButton
                variant="primary"
                class="btn-start-wizard"
                @click="currentStep = 2"
                :disabled="activeRiders.length === 0"
              >
                <span>Iniciar Asistencia</span>
                <span class="material-icons">arrow_forward</span>
              </AppButton>
            </div>
          </div>
        </div>

        <!-- PASO 2: PASAR LISTA (ROLL CALL) -->
        <div v-else-if="currentStep === 2" class="roll-call-step-container fade-in">
          <!-- Sub-cabecera con botón de retroceso -->
          <div class="roll-call-header-nav">
            <AppButton
              variant="secondary"
              icon="arrow_back"
              @click="currentStep = 1"
            >
              Volver a Configuración
            </AppButton>
            
            <div class="roll-call-title-box">
              <span class="material-icons roll-call-icon">assignment_turned_in</span>
              <h1>Pasar Lista: {{ selectedCategoryId === 'all' ? 'MEGA AVALANCHA (TODAS)' : activeCategoryLabel }}</h1>
            </div>
          </div>

          <!-- Grid de asistencia -->
          <PartidaGrid
            v-model:searchQuery="searchQuery"
            :active-riders="activeRiders"
            :dns-riders="dnsRiders"
            :present-rider-ids="presentRiderIds"
            :is-mega="selectedCategoryId === 'all'"
            @markDns="setRiderDNS"
            @revertDns="revertRiderDNS"
            @togglePresence="toggleRiderPresence"
          />
          
          <!-- Disparador de largada -->
          <PartidaTrigger
            v-model:isGridConfirmed="isGridConfirmed"
            :all-active-riders-present="allActiveRidersPresent"
            :race-state="raceState"
            :countdown="countdown"
            :loading="isLoading"
            :is-syncing="isSyncingRiders"
            @launch="startLaunchCountdown"
          />
        </div>

        <!-- PASO 3: CARRERA ACTIVA (STOPWATCH) -->
        <div v-else-if="currentStep === 3" class="active-race-step-container fade-in">
          <PartidaStopwatch
            :time-formatted="timeFormatted"
            :start-time="startTime"
            :active-riders="activeRiders"
            :loading="isLoading"
            @reset="panicReset"
          />
        </div>

      </div>
    </div>

    <!-- Modal de Confirmación Rápida Estilo Pase de Corredor (Simplificado) -->
    <Transition name="fade">
      <div v-if="showCheckModal" class="check-animation-overlay">
        <div class="check-card">
          <!-- Encabezado del pase de telemetría -->
          <div class="card-header-telemetry">
            <span class="telemetry-dot"></span>
            <span class="telemetry-label">CHACAS XTREME • TELEMETRÍA</span>
          </div>

          <div class="card-body-layout">
            <!-- Bloque de Placa Masiva y Checkmark -->
            <div class="plate-checkmark-row">
              <div class="badge-plate">#{{ lastCheckedRider?.plate_number }}</div>
              <div class="checkmark-circle">
                <span class="material-icons checkmark-icon">check</span>
              </div>
            </div>

            <!-- Detalles Básicos -->
            <h2 class="rider-name-title">{{ lastCheckedRider?.full_name }}</h2>
            
            <div class="status-badge-present">
              <span class="material-icons check-badge-icon">check_circle</span>
              CONFIRMADO PARA LARGAR
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { usePartida } from '../hooks/usePartida';
import PartidaGrid from '../components/PartidaGrid.vue';
import PartidaTrigger from '../components/PartidaTrigger.vue';
import PartidaStopwatch from '../components/PartidaStopwatch.vue';

const {
  categories,
  selectedCategoryId,
  selectedPhase,
  riders,
  searchQuery,
  isGridConfirmed,
  isLoading,
  errorMessage,
  raceState,
  countdown,
  startTime,
  startTimeStr,
  activeRiders,
  dnsRiders,
  presentRiderIds,
  lastCheckedRider,
  showCheckModal,
  allActiveRidersPresent,
  timeFormatted,
  currentStep,
  isSyncingRiders,
  loadInitialData,
  loadRiders,
  toggleRiderPresence,
  setRiderDNS,
  revertRiderDNS,
  startLaunchCountdown,
  panicReset
} = usePartida();

const totalRidersToStart = computed(() => {
  return activeRiders.value.length;
});

const totalCategoriesToStart = computed(() => {
  if (selectedCategoryId.value === 'all') {
    return categories.value.filter(c => c.id !== 'all').length;
  }
  return 1;
});

const activeCategoryLabel = computed(() => {
  const cat = categories.value.find(c => c.id === parseInt(selectedCategoryId.value));
  return cat ? cat.name : '';
});

onMounted(async () => {
  await loadInitialData();
  await loadRiders();
});
</script>

<style scoped>
.view-container {
  padding: 16px;
  max-width: 1024px;
  margin: 0 auto;
  min-height: 100%;
}

@media (min-width: 1024px) {
  .view-container {
    padding: 24px;
    height: 100%;
    overflow-y: auto;
  }
}

.partida-view-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.partida-body-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.rotating {
  animation: spin 1s linear infinite;
  font-size: 28px;
  color: var(--color-primary);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #EF4444;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 16px;
}

/* Layout del asistente en Paso 1 */
.setup-step-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.setup-wizard-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 500px;
  width: 100%;
}

.card-header-sport {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 8px;
  text-align: center;
}

.card-header-sport h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-primary);
}

.setup-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup-field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Selector Segmentado de Fase */
.phase-selector-segmented {
  display: flex;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 3px;
  height: 44px;
}

.phase-segment-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  font-family: var(--font-family);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-segment-btn--active-practice,
.phase-segment-btn--active-final {
  background: var(--color-text-primary);
  color: var(--color-background) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .phase-segment-btn--active-practice,
.dark-theme .phase-segment-btn--active-final {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

/* Resumen de Salida (Tech Rows) */
.setup-summary-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row-tech {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.summary-row-tech:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row-tech-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.row-tech-val {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.highlight-tech-val {
  color: var(--color-primary) !important;
}

/* Botón Iniciar Asistencia */
.btn-start-wizard {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  margin-top: 8px;
  box-shadow: 0 4px 16px rgba(255, 94, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-start-wizard:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 20px rgba(255, 94, 0, 0.3);
}

.btn-start-wizard span.material-icons {
  transition: transform 0.25s ease;
}

.btn-start-wizard:hover span.material-icons {
  transform: translateX(4px);
}

/* Estilos de Explorador Accordion */
.explorer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.explorer-intro {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.categories-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.accordion-item-premium {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-background);
  transition: all 0.25s ease;
}

.accordion-item--open {
  border-color: var(--color-primary);
  box-shadow: 0 4px 15px rgba(255, 94, 0, 0.04);
}

.accordion-trigger-btn {
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-primary);
  font-family: var(--font-family);
}

.accordion-trigger-icon {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.accordion-item--open .accordion-trigger-icon {
  color: var(--color-primary);
}

.accordion-category-name {
  font-weight: 700;
  flex: 1;
  font-size: 13.5px;
}

.accordion-category-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-right: 6px;
}

.arrow-indicator-icon {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.accordion-content {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  background: var(--color-surface);
  max-height: 250px;
  overflow-y: auto;
}

.accordion-riders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.explorer-rider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--color-border);
  font-size: 13px;
}

.explorer-rider-row:last-child {
  border-bottom: none;
}

.explorer-rider-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 800;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
  padding: 2px 6px;
  border-radius: 6px;
  min-width: 32px;
  text-align: center;
}

.explorer-rider-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.accordion-empty-state {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 12px;
}

/* Paso 2: Pase de Lista */
.roll-call-step-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.roll-call-header-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
}

@media (min-width: 600px) {
  .roll-call-header-nav {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.roll-call-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.roll-call-icon {
  color: var(--color-primary);
  font-size: 24px;
}

.roll-call-title-box h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 900;
  color: var(--color-text-primary);
  margin: 0;
}

/* Modal de Animación Check Estilo Race Pass */
.check-animation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.check-card {
  background: rgba(15, 15, 15, 0.85); /* Vidrio oscuro deportivo */
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  width: 90%;
  max-width: 320px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.15);
  animation: pop-up-bounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.card-header-telemetry {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  padding: 10px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.telemetry-dot {
  width: 6px;
  height: 6px;
  background: var(--color-success);
  border-radius: 50%;
  animation: beacon 1s infinite alternate ease-in-out;
}

.telemetry-label {
  font-size: 9.5px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1.5px;
}

.card-body-layout {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Fila de placa y checkmark */
.plate-checkmark-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}

.badge-plate {
  font-family: 'Poppins', sans-serif;
  font-size: 32px;
  font-weight: 900;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.1);
  border: 1px solid rgba(255, 94, 0, 0.25);
  padding: 2px 14px;
  border-radius: 12px;
}

.checkmark-circle {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.15);
  border: 2px solid var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

.checkmark-icon {
  font-size: 34px;
  color: var(--color-success);
  animation: draw-check 0.3s 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.rider-name-title {
  font-size: 17px;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1.3;
  margin-bottom: 14px;
}

.status-badge-present {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-size: 11px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 12px;
  letter-spacing: 1px;
}

.check-badge-icon {
  font-size: 15px;
}

/* Animaciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pop-up-bounce {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes draw-check {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

@keyframes beacon {
  from { opacity: 0.4; }
  to { opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
