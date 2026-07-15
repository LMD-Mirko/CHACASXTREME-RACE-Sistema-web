<template>
  <div class="confirmador-root fade-in">
    <!-- Event Metadata Bar -->
    <div class="telemetry-bar">
      <div class="telemetry-item">
        <span class="telemetry-lbl">Evento Activo</span>
        <strong class="telemetry-val">{{ activeCompetition?.name || 'Chacas Xtreme' }}</strong>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Fase</span>
        <strong class="telemetry-val highlight-phase">{{ activeCompetition?.phase === 'practica' ? 'Prueba' : 'Final' }}</strong>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Largada</span>
        <strong class="telemetry-val highlight-time">{{ formatStartClock(activeCompetition?.start_time) }}</strong>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Transcurrido</span>
        <strong class="telemetry-val highlight-timer">{{ stopwatchTime }}</strong>
      </div>
    </div>

    <!-- Responsive View: Tabs on mobile, columns on larger screens -->
    <div class="view-switcher-mobile">
      <button
        class="switch-tab-btn"
        :class="{ 'switch-tab-btn--active': activeTab === 'queue' }"
        @click="activeTab = 'queue'"
      >
        Tiempos ({{ finishTimeQueue.length }})
      </button>
      <button
        class="switch-tab-btn"
        :class="{ 'switch-tab-btn--active': activeTab === 'runners' }"
        @click="activeTab = 'runners'"
      >
        En Carrera ({{ ridersInRace.length }})
      </button>
      <button
        class="switch-tab-btn"
        :class="{ 'switch-tab-btn--active': activeTab === 'arrived' }"
        @click="activeTab = 'arrived'"
      >
        Llegaron ({{ ridersArrived.length }})
      </button>
    </div>

    <div class="split-layout">
      <!-- Columna Izquierda: Cola de Frenado (FIFO) -->
      <div class="layout-column column-queue" :class="{ 'column--hidden': activeTab !== 'queue' }">
        <div class="column-header">
          <span class="material-icons header-icon">timer</span>
          <h4>Cola de Frenado (FIFO)</h4>
        </div>
        
        <div class="queue-list-wrapper">
          <div class="cards-list" v-if="finishTimeQueue.length > 0">
            <div
              v-for="(item, index) in finishTimeQueue"
              :key="item.id"
              class="arrival-card"
              :class="{ 'arrival-card--selected': selectedItemForAssign?.id === item.id }"
              @click="onSelectTime(item)"
            >
              <div class="card-left">
                <span class="arrival-index">Llegada #{{ index + 1 }}</span>
                <div class="arrival-time-wrapper">
                  <span class="material-icons flash-icon">alarm</span>
                  <span class="arrival-time">{{ formatTimeStr(item.blind_timestamp) }}</span>
                </div>
              </div>
              <div class="card-right">
                <button
                  type="button"
                  class="btn-scan"
                  title="Escanear QR de placa"
                  aria-label="Escanear QR de placa"
                  @click.stop="openScan(item)"
                >
                  <span class="material-icons">qr_code_scanner</span>
                </button>
                <span class="material-icons arrow-chevron">chevron_right</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state-card">
            <span class="material-icons empty-icon">timer_off</span>
            <p>Esperando cruces de corredores por meta...</p>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Corredores (En Carrera + Llegaron) -->
      <div class="layout-column column-runners" :class="{ 'column--hidden': activeTab === 'queue' }">
        
        <!-- Faltan Llegar (sólo visible si no estamos en pestaña arrived en móvil) -->
        <div class="telemetry-box" :class="{ 'box--hidden-mobile': activeTab === 'arrived' }">
          <div class="column-header">
            <span class="material-icons header-icon text-orange">motorcycle</span>
            <h4>En Carrera (Faltan: {{ ridersInRace.length }})</h4>
          </div>
          
          <div class="runners-search-box">
            <span class="material-icons search-icon">search</span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Buscar corredor..."
              class="runner-search-input"
            />
          </div>

          <div class="runners-list-wrapper">
            <div class="runners-grid" v-if="filteredRunners.length > 0">
              <div
                v-for="rider in filteredRunners"
                :key="rider.id"
                class="runner-card"
                @click="onSelectRider(rider)"
              >
                <div class="runner-card-left">
                  <div class="runner-plate-badge">#{{ rider.plate_number }}</div>
                  <div class="runner-details">
                    <span class="runner-name">{{ rider.full_name }}</span>
                    <span class="runner-cat">{{ rider.category?.name || 'Categoría' }}</span>
                  </div>
                </div>
                <div class="runner-card-right">
                  <span class="material-icons link-indicator">person_add</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-card">
              <span class="material-icons empty-icon">group_off</span>
              <p>{{ searchQuery ? 'Ningún piloto coincide.' : 'No quedan pilotos en carrera.' }}</p>
            </div>
          </div>
        </div>

        <!-- Div / Espacio: Ya Llegaron -->
        <div class="telemetry-box" :class="{ 'box--hidden-mobile': activeTab === 'runners' }">
          <div class="column-header">
            <span class="material-icons header-icon text-green">check_circle</span>
            <h4>Ya Llegaron (Total: {{ ridersArrived.length }})</h4>
          </div>

          <div class="runners-list-wrapper">
            <div class="runners-grid" v-if="filteredArrived.length > 0">
              <div
                v-for="rider in filteredArrived"
                :key="rider.id"
                class="runner-card runner-card--arrived"
              >
                <div class="runner-card-left">
                  <div class="runner-plate-badge runner-plate-badge--green">#{{ rider.plate_number }}</div>
                  <div class="runner-details">
                    <span class="runner-name">{{ rider.full_name }}</span>
                    <span class="runner-cat">{{ rider.category?.name || 'Categoría' }}</span>
                  </div>
                </div>
                 <div class="runner-card-right flex-row-gap-8">
                   <span class="runner-arrival-time">{{ getMetaArrivalTime(rider) }}</span>
                   <span class="material-icons text-green">done</span>
                 </div>
              </div>
            </div>
            <div v-else class="empty-state-card">
              <span class="material-icons empty-icon">sports_score</span>
              <p>Nadie ha llegado todavía.</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Bottom Sheet Modal de Asignación -->
    <Teleport to="body">
      <MetaAssignModal
        v-if="selectedItemForAssign"
        :queue-item="selectedItemForAssign"
        @close="closeAssignSheet"
        @assigned="onAssignedComplete"
      />
    </Teleport>

    <ContinuousQrScanner
      :open="!!scanTarget"
      mode="confirm"
      role-label="META"
      title="Asignar por QR"
      :subtitle="scanSubtitle"
      confirm-label="Asignar a este tiempo"
      :on-commit="commitScan"
      @close="scanTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useMeta } from '../hooks/useMeta';
import MetaAssignModal from '../components/mobile/MetaAssignModal.vue';
import ContinuousQrScanner from '../../../components/qr/ContinuousQrScanner.vue';
import { formatTimeOnly, formatRaceClockMs } from '../../../core/time/raceTime';
import { useMangaElapsedStopwatch } from '../../../core/time/useMangaElapsedStopwatch';

const {
  finishTimeQueue,
  loadInitialData,
  addQueueItemLocally,
  handleRiderFinishedEvent,
  assignBlindTime,
  riders,
  activeCompetition,
  isLoading
} = useMeta();

const scanTarget = ref(null);
const scanSubtitle = computed(() => {
  if (!scanTarget.value) return '';
  return `Tiempo congelado ${formatTimeStr(scanTarget.value.blind_timestamp)}. Escaneá la placa y confirmá.`;
});

function openScan(item) {
  scanTarget.value = item;
}

async function commitScan(rider) {
  if (!scanTarget.value?.id) {
    return { ok: false, message: 'Sin tiempo seleccionado' };
  }
  if (!rider?.plate_number) {
    return { ok: false, message: 'QR sin placa' };
  }
  const result = await assignBlindTime(
    scanTarget.value.id,
    parseInt(rider.plate_number, 10),
    { silent: true },
  );
  if (result?.ok) {
    scanTarget.value = null;
    selectedItemForAssign.value = null;
    return { ok: true };
  }
  return {
    ok: false,
    already: !!result?.already,
    message: result?.message || 'No se pudo asignar',
  };
}

function formatStartClock(dateTimeStr) {
  if (!dateTimeStr) return 'Esperando Largada';
  return formatTimeOnly(dateTimeStr);
}

function formatTimeStr(dateStr) {
  if (!dateStr) return '';
  return formatRaceClockMs(dateStr);
}

function getMetaArrivalTime(rider) {
  if (!rider || !rider.checkpoint_passes) return '';
  const phase = activeCompetition.value?.phase || 'practica';
  const pass = rider.checkpoint_passes.find(p => 
    p.checkpoint_name.toUpperCase() === 'META' && p.phase === phase
  );
  if (pass) {
    return formatTimeStr(pass.exact_time);
  }
  const fallbackPass = rider.checkpoint_passes.find(p => p.checkpoint_name.toUpperCase() === 'META');
  return fallbackPass ? formatTimeStr(fallbackPass.exact_time) : '';
}

const activeTab = ref('queue'); // 'queue', 'runners', or 'arrived'
const searchQuery = ref('');
const selectedItemForAssign = ref(null);

const ridersInRace = computed(() => {
  return riders.value.filter(r => r.race_status === 'en_carrera');
});

const ridersArrived = computed(() => {
  return riders.value.filter(r => r.race_status === 'llego');
});

const filteredRunners = computed(() => {
  return ridersInRace.value.filter(r => {
    const query = searchQuery.value.toLowerCase().trim();
    return query === '' ||
      r.plate_number.toString().includes(query) ||
      r.full_name.toLowerCase().includes(query);
  });
});

const filteredArrived = computed(() => {
  return ridersArrived.value.filter(r => {
    const query = searchQuery.value.toLowerCase().trim();
    return query === '' ||
      r.plate_number.toString().includes(query) ||
      r.full_name.toLowerCase().includes(query);
  });
});

const mangaCompletedLocally = computed(() => {
  return riders.value.length > 0 &&
    ridersInRace.value.length === 0 &&
    ridersArrived.value.length > 0;
});

const { stopwatchTime } = useMangaElapsedStopwatch(activeCompetition, {
  isCompleted: mangaCompletedLocally,
});

function onSelectTime(item) {
  selectedItemForAssign.value = item;
}

function closeAssignSheet() {
  selectedItemForAssign.value = null;
}

function onAssignedComplete() {
  closeAssignSheet();
}

async function onSelectRider(rider) {
  if (!selectedItemForAssign.value) {
    alert(`Por favor, selecciona primero una tarjeta de tiempo de la lista "Tiempos" a la que deseas asignar la placa #${rider.plate_number}.`);
    activeTab.value = 'queue';
    return;
  }

  if (confirm(`¿Vincular el tiempo congelado de las ${formatTimeStr(selectedItemForAssign.value.blind_timestamp)} a ${rider.full_name} (Placa #${rider.plate_number})?`)) {
    try {
      await assignBlindTime(selectedItemForAssign.value.id, rider.plate_number);
      onAssignedComplete();
    } catch (err) {
      console.error(err);
    }
  }
}

function onTimeFreezedDom(e) {
  const d = e.detail || {};
  addQueueItemLocally({
    id: d.queue_id,
    blind_timestamp: d.blind_timestamp,
    status: 'pendiente',
  });
}

function onRiderFinishedDom(e) {
  const d = e.detail || {};
  handleRiderFinishedEvent(d.exact_time);
  loadInitialData();
}

function onTimeAnnulledDom(e) {
  const d = e.detail || {};
  finishTimeQueue.value = finishTimeQueue.value.filter(q => q.id !== d.queue_id);
}

function onQueueClearedDom() {
  finishTimeQueue.value = [];
}

onMounted(() => {
  loadInitialData();
  window.addEventListener('category-manga-started', loadInitialData);
  window.addEventListener('time-freezed-in-meta', onTimeFreezedDom);
  window.addEventListener('rider-finished', onRiderFinishedDom);
  window.addEventListener('time-annulled-in-meta', onTimeAnnulledDom);
  window.addEventListener('queue-cleared-in-meta', onQueueClearedDom);
  window.addEventListener('rider-incident-reported', loadInitialData);
});

onBeforeUnmount(() => {
  window.removeEventListener('category-manga-started', loadInitialData);
  window.removeEventListener('time-freezed-in-meta', onTimeFreezedDom);
  window.removeEventListener('rider-finished', onRiderFinishedDom);
  window.removeEventListener('time-annulled-in-meta', onTimeAnnulledDom);
  window.removeEventListener('queue-cleared-in-meta', onQueueClearedDom);
  window.removeEventListener('rider-incident-reported', loadInitialData);
});
</script>

<style scoped>
.confirmador-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  gap: 12px;
}

@media (min-width: 768px) {
  .confirmador-root {
    height: 100%;
  }
}

/* Telemetry Bar */
.telemetry-bar {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px 18px;
  gap: 20px;
  justify-content: space-between;
  box-shadow: var(--shadow-premium);
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.telemetry-lbl {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.8px;
}

.telemetry-val {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.highlight-phase {
  color: var(--color-primary);
  text-transform: uppercase;
}

.highlight-time {
  color: var(--color-success);
}

/* Tabs Mobile Switcher */
.view-switcher-mobile {
  display: flex;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 3px;
  gap: 4px;
}

@media (min-width: 768px) {
  .view-switcher-mobile {
    display: none; /* Hide on tablets and desktops */
  }
}

.switch-tab-btn {
  flex: 1;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12.5px;
  font-weight: 700;
  border-radius: 7px;
  cursor: pointer;
  font-family: var(--font-family);
  transition: all 0.2s ease;
}

.switch-tab-btn--active {
  background: var(--color-text-primary);
  color: var(--color-background);
}

/* Split Layout */
.split-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.layout-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 16px;
  gap: 12px;
  min-height: 0;
  box-shadow: var(--shadow-premium);
}

@media (max-width: 767px) {
  .column--hidden {
    display: none !important;
  }
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

.header-icon {
  font-size: 20px;
}

.column-header h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-primary);
  letter-spacing: 0.5px;
}

.text-orange {
  color: var(--color-primary);
}

.text-green {
  color: var(--color-success);
}

/* Telemetry Box inside Column */
.telemetry-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

@media (max-width: 767px) {
  .box--hidden-mobile {
    display: none !important;
  }
}

/* Queue List Wrapper */
.queue-list-wrapper,
.runners-list-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Arrival Card */
.arrival-card {
  position: relative;
  background-color: var(--color-input-bg);
  background-image: 
    linear-gradient(90deg, var(--color-input-bg) 70%, rgba(255, 94, 0, 0.04) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png');
  background-position: right top;
  background-repeat: no-repeat;
  background-size: auto 60%;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.arrival-card:active {
  transform: scale(0.98);
}

.arrival-card--selected {
  border-color: var(--color-primary) !important;
  background-color: rgba(255, 94, 0, 0.03) !important;
  background-image: 
    linear-gradient(90deg, rgba(255, 94, 0, 0.03) 70%, rgba(255, 94, 0, 0.08) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png') !important;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.08);
}

.card-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.arrival-index {
  font-size: 9.5px;
  font-weight: 800;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.arrival-time-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
}

.flash-icon {
  font-size: 16px;
  animation: pulse 1.2s infinite ease-in-out;
}

.arrival-time {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 900;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow-chevron {
  font-size: 20px;
  color: var(--color-text-secondary);
}

.btn-scan {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(255, 94, 0, 0.35);
  background: rgba(255, 94, 0, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-scan .material-icons {
  font-size: 20px;
}

/* Search Box Runners */
.runners-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-secondary);
  font-size: 18px;
}

.runner-search-input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  padding: 0 12px 0 36px;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
}

.runner-search-input:focus {
  border-color: var(--color-primary);
}

/* Runner Grid & Cards */
.runners-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.runner-card {
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.runner-card:hover {
  border-color: var(--color-primary);
}

.runner-card:active {
  transform: scale(0.98);
}

.runner-card--arrived {
  border-left: 3px solid var(--color-success);
  cursor: default;
}

.runner-card--arrived:hover {
  border-color: var(--color-border);
}

.flex-row-gap-8 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.runner-arrival-time {
  font-family: monospace;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.15);
  padding: 3px 8px;
  border-radius: 6px;
}

.runner-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.runner-plate-badge {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 900;
  font-size: 13px;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 6px;
  min-width: 42px;
  text-align: center;
}

.runner-plate-badge--green {
  color: var(--color-success);
}

.runner-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.runner-name {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.runner-cat {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.link-indicator {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.runner-card:hover .link-indicator {
  color: var(--color-primary);
}

/* Empty States */
.empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  background: var(--color-input-bg);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  text-align: center;
  color: var(--color-text-secondary);
  gap: 6px;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.7;
}

.empty-state-card p {
  font-size: 12px;
  font-weight: 700;
}

</style>
