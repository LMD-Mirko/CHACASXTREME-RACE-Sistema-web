<template>
  <div class="meta-page-container fade-in">
    <!-- Event Metadata Bar -->
    <div class="telemetry-bar">
      <div class="telemetry-item">
        <span class="telemetry-lbl">Evento Activo</span>
        <strong class="telemetry-val">{{ activeCompetition?.name || 'Chacas Xtreme' }}</strong>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Fase de Carrera</span>
        <strong class="telemetry-val highlight-phase">{{ activeCompetition?.phase === 'practica' ? 'Prueba' : 'Final' }}</strong>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Hora de Largada</span>
        <strong class="telemetry-val highlight-time">{{ formatTimeOnly(activeCompetition?.start_time) }}</strong>
      </div>
      <div class="telemetry-item">
        <span class="telemetry-lbl">Tiempo Transcurrido</span>
        <strong class="telemetry-val highlight-timer">{{ stopwatchTime }}</strong>
      </div>
    </div>

    <div class="meta-view-root">
      <!-- LAYOUT DESKTOP/LAPTOP: Gatillo Ciego + Telemetría + Tabla de Auditoría Lateral (40% ancho) -->
      <div v-if="isDesktop" class="desktop-layout">
      <div class="left-panel-dashboard">
        <!-- Parte Superior: Pulsador de Tiempo -->
        <div class="gatillo-section">
          <MetaGatillo />
        </div>

        <!-- Parte Inferior: Listas de Telemetría (En Carrera / Llegaron) -->
        <div class="telemetry-sections">
          <!-- Columna: Faltan Llegar -->
          <div class="telemetry-col col-running">
            <div class="telemetry-col-header text-orange">
              <span class="material-icons telemetry-icon">directions_run</span>
              <h4>Faltan Llegar (En Carrera: {{ ridersInRace.length }})</h4>
            </div>
            <div class="telemetry-list">
              <div v-for="rider in ridersInRace" :key="rider.id" class="telemetry-row">
                <span class="telemetry-plate">#{{ rider.plate_number }}</span>
                <span class="telemetry-name">{{ rider.full_name }}</span>
                <span class="telemetry-cat-tag">{{ rider.category?.name || 'N/A' }}</span>
              </div>
              <div v-if="ridersInRace.length === 0" class="telemetry-empty">
                No hay corredores en pista.
              </div>
            </div>
          </div>

          <!-- Columna: Ya Llegaron -->
          <div class="telemetry-col col-arrived">
            <div class="telemetry-col-header text-green">
              <span class="material-icons telemetry-icon">check_circle</span>
              <h4>Ya Llegaron ({{ ridersArrived.length }})</h4>
            </div>
            <div class="telemetry-list">
              <div v-for="rider in ridersArrived" :key="rider.id" class="telemetry-row">
                <span class="telemetry-plate text-green">#{{ rider.plate_number }}</span>
                <span class="telemetry-name">{{ rider.full_name }}</span>
                <span class="telemetry-time-badge">{{ getMetaArrivalTime(rider) }}</span>
                <span class="telemetry-cat-tag">{{ rider.category?.name || 'N/A' }}</span>
              </div>
              <div v-if="ridersArrived.length === 0" class="telemetry-empty">
                Ningún corredor ha cruzado la meta aún.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="right-panel">
        <MetaQueueTable />
      </div>
    </div>

    <!-- LAYOUT MÓVIL: Cola FIFO en tarjetas + Asignación Bottom Sheet -->
    <div v-else class="mobile-layout fade-in">
      <MetaBrakingQueue @assign="openAssignSheet" />

      <!-- Bottom Sheet Modal de Asignación -->
      <MetaAssignModal
        v-if="selectedItemForAssign"
        :queue-item="selectedItemForAssign"
        @close="closeAssignSheet"
        @assigned="closeAssignSheet"
      />
    </div>

    <!-- Toast de Notificación de Llegada en Tiempo Real -->
    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="isToastActive" class="arrival-toast-wrapper">
          <div class="arrival-toast-card">
            <div class="toast-glow-border"></div>
            <span class="material-icons toast-icon">notifications_active</span>
            <div class="toast-text-col">
              <h5>¡Llegada Registrada!</h5>
              <p>Marca de tiempo congelada. En espera de confirmar placa.</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useMeta } from '../hooks/useMeta';
import MetaGatillo from '../components/desktop/MetaGatillo.vue';
import MetaQueueTable from '../components/desktop/MetaQueueTable.vue';
import MetaBrakingQueue from '../components/mobile/MetaBrakingQueue.vue';
import MetaAssignModal from '../components/mobile/MetaAssignModal.vue';

const isDesktop = ref(window.innerWidth >= 1024);
const selectedItemForAssign = ref(null);
let channel = null;

const {
  loadInitialData,
  addQueueItemLocally,
  handleRiderFinishedEvent,
  riders,
  activeCompetition,
  finishTimeQueue
} = useMeta();

const isToastActive = ref(false);
let toastTimeout = null;

function showArrivalToast() {
  isToastActive.value = true;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    isToastActive.value = false;
  }, 4000);
}

watch(() => finishTimeQueue.value.length, (newVal, oldVal) => {
  // Disparar solo cuando se añaden registros nuevos a la cola
  if (newVal > oldVal) {
    showArrivalToast();
  }
});

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

function formatTimeStr(dateStr) {
  if (!dateStr) return '';
  try {
    let cleanStr = String(dateStr);
    if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
      if (cleanStr.includes(' ')) {
        cleanStr = cleanStr.replace(' ', 'T') + 'Z';
      } else {
        cleanStr = cleanStr + 'Z';
      }
    }
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateStr;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dateStr;
  }
}

const ridersInRace = computed(() => {
  return riders.value.filter(r => r.race_status === 'en_carrera');
});

const ridersArrived = computed(() => {
  return riders.value.filter(r => r.race_status === 'llego');
});

function checkViewport() {
  isDesktop.value = window.innerWidth >= 1024;
}

function openAssignSheet(item) {
  selectedItemForAssign.value = item;
}

function closeAssignSheet() {
  selectedItemForAssign.value = null;
}

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

onMounted(() => {
  loadInitialData();
  window.addEventListener('resize', checkViewport);

  // Suscripción en tiempo real a Laravel Echo / Reverb
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
      loadInitialData(); // reload riders list to update statuses in columns
    });

  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkViewport);
  if (stopwatchInterval) clearInterval(stopwatchInterval);
  if (channel && window.Echo) {
    channel.stopListening('.TimeFreezedInMeta');
    channel.stopListening('.RiderFinished');
  }
});
</script>

<style scoped>
.meta-page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  width: 100%;
}

.telemetry-time-badge {
  font-family: monospace;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.15);
  padding: 2px 6px;
  border-radius: 6px;
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

.meta-view-root {
  flex: 1;
  width: 100%;
  min-height: 0;
}

@media (min-width: 1024px) {
  .meta-view-root {
    height: 100%;
  }
}

/* Layout Desktop: Dos paneles (Gatillo/Telemetría a la izquierda, Cola a la derecha al 40%) */
.desktop-layout {
  display: flex;
  height: 100%;
  gap: 24px;
}

.left-panel-dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.gatillo-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: var(--shadow-premium);
  min-height: 240px;
}

/* Telemetry split view at bottom */
.telemetry-sections {
  display: flex;
  gap: 16px;
  height: 280px;
  min-height: 200px;
}

.telemetry-col {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  box-shadow: var(--shadow-premium);
}

.telemetry-col-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.telemetry-col-header h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.telemetry-icon {
  font-size: 18px;
}

.text-orange {
  color: var(--color-primary);
}

.text-green {
  color: var(--color-success);
}

.telemetry-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.telemetry-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12.5px;
}

.telemetry-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 900;
  color: var(--color-primary);
}

.telemetry-plate.text-green {
  color: var(--color-success);
}

.telemetry-name {
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.telemetry-cat-tag {
  font-size: 10px;
  font-weight: 700;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-text-secondary);
}

.telemetry-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 12.5px;
  font-weight: 600;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-input-bg);
  padding: 20px;
}

.right-panel {
  width: 40%;
  min-width: 360px;
  max-width: 480px;
  height: 100%;
}

/* Layout Móvil */
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

/* Estilos Premium del Toast de Llegada */
.arrival-toast-wrapper {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 90%;
  max-width: 420px;
  pointer-events: none;
}

.arrival-toast-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(15, 15, 15, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 94, 0, 0.25);
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 94, 0, 0.15);
  color: #FFFFFF;
  pointer-events: auto;
  overflow: hidden;
}

.toast-glow-border {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary);
}

.toast-icon {
  color: var(--color-primary);
  font-size: 28px;
  animation: alarm-shake 0.6s ease-in-out infinite alternate;
}

@keyframes alarm-shake {
  0% { transform: rotate(-8deg); }
  100% { transform: rotate(8deg); }
}

.toast-text-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-text-col h5 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--color-primary);
  margin: 0;
}

.toast-text-col p {
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* Transición del Toast */
.toast-fade-enter-active {
  animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.toast-fade-leave-active {
  animation: toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes toast-in {
  from {
    transform: translate(-50%, -40px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -30px);
    opacity: 0;
  }
}

</style>
