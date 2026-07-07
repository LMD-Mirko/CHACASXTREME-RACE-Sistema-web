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
        <strong class="telemetry-val highlight-time">{{ formatTimeOnly(activeCompetition?.start_time) }}</strong>
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
                <span class="material-icons arrow-chevron">chevron_right</span>
                <button class="btn-discard" @click.stop="onDiscard(item.id)">
                  <span class="material-icons">close</span>
                </button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useMeta } from '../hooks/useMeta';
import MetaAssignModal from '../components/mobile/MetaAssignModal.vue';

const {
  finishTimeQueue,
  loadInitialData,
  addQueueItemLocally,
  handleRiderFinishedEvent,
  annulBlindTime,
  assignBlindTime,
  riders,
  activeCompetition,
  isLoading
} = useMeta();

function formatTimeOnly(dateTimeStr) {
  if (!dateTimeStr) return 'Esperando Largada';
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

function formatTimeStr(dateStr) {
  if (!dateStr) return '';
  try {
    let cleanStr = String(dateStr).trim();
    
    // 1. Reemplazar espacio por 'T' para compatibilidad con Safari
    cleanStr = cleanStr.replace(' ', 'T');
    
    // 2. Si no tiene 'Z' ni '+', agregar 'Z' para indicar UTC
    if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
      cleanStr = cleanStr + 'Z';
    }
    
    // 3. Truncar los microsegundos a milisegundos (máximo 3 dígitos tras el punto)
    let parts = cleanStr.split('.');
    if (parts.length > 1) {
      let suffix = parts[1].includes('Z') ? 'Z' : '';
      let dec = parts[1].replace(/[^0-9]/g, '');
      cleanStr = parts[0] + '.' + dec.substring(0, 3) + suffix;
    }
    
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      // Fallback robusto mediante manipulación de strings si falla Date
      const timePart = cleanStr.split('T')[1];
      if (timePart) {
        return timePart.split('.')[0].replace('Z', '');
      }
      return dateStr;
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  } catch (e) {
    return dateStr;
  }
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

let channel = null;

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

function onDiscard(id) {
  if (confirm('¿Anular esta marca de tiempo?')) {
    annulBlindTime(id);
  }
}

onMounted(() => {
  loadInitialData();

  if (window.Echo) {
    channel = window.Echo.channel('race-timing');

    // Escucha de pulsador en meta (Laptop)
    channel.listen('.TimeFreezedInMeta', (e) => {
      addQueueItemLocally({
        id: e.queue_id,
        blind_timestamp: e.blind_timestamp,
        status: 'pendiente'
      });
    });

    // Escucha de corredor asignado
    channel.listen('.RiderFinished', (e) => {
      handleRiderFinishedEvent(e.exact_time);
      loadInitialData(); // reload riders list state
    });

    // Escucha de incidentes (DNF)
    channel.listen('.RiderIncidentReported', () => {
      loadInitialData();
    });
  }
});

onBeforeUnmount(() => {
  if (stopwatchInterval) clearInterval(stopwatchInterval);
  if (channel && window.Echo) {
    channel.stopListening('.TimeFreezedInMeta');
    channel.stopListening('.RiderFinished');
    channel.stopListening('.RiderIncidentReported');
  }
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
  gap: 12px;
}

.arrow-chevron {
  font-size: 20px;
  color: var(--color-text-secondary);
}

.btn-discard {
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

.btn-discard:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
