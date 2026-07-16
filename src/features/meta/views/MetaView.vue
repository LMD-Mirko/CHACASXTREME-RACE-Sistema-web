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
        <strong class="telemetry-val highlight-time">{{ formatStartClock(activeCompetition?.start_time) }}</strong>
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

    <!-- 8. MODAL DE FINALIZACIÓN EXCELENTE / MANGA COMPLETADA -->
    <Teleport to="body">
      <Transition name="modal-scale">
        <div v-if="showSuccessMangaModal" class="manga-completed-overlay">
          <div class="manga-completed-card">
            <div class="glow-header-sport"></div>
            
            <div class="card-body-content-sport">
              <div class="badge-icon-completed animate-bounce-subtle">
                <span class="material-icons">sports_motorsports</span>
              </div>
              
              <h4 class="completed-subtitle">MANGA FINALIZADA</h4>
              <h2 class="completed-title">{{ activeCompetition?.name || 'CHACAS XTREME' }}</h2>
              <p class="completed-phase">{{ activeCompetition?.phase === 'practica' ? 'PRUEBA DE ENTRENAMIENTO' : 'MANGA DE CARRERA FINAL' }}</p>
              
              <div class="metrics-grid-completed">
                <div class="metric-box-comp">
                  <span class="lbl-box-comp">COMPETIDORES EN META</span>
                  <strong class="val-box-comp">{{ ridersArrived.length }} / {{ riders.length }}</strong>
                </div>
                <div class="metric-box-comp">
                  <span class="lbl-box-comp">TIEMPO TRANSCURRIDO</span>
                  <strong class="val-box-comp">{{ stopwatchTime }}</strong>
                </div>
              </div>
              
              <p class="completed-congrats">¡Todos los pilotos en pista han cruzado la meta con éxito!</p>
            </div>

            <button class="manga-dismiss-btn" @click="showSuccessMangaModal = false">
              Aceptar y Continuar
            </button>
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
import { formatTimeOnly, formatTimeStr } from '../../../core/time/raceTime';
import { useMangaElapsedStopwatch } from '../../../core/time/useMangaElapsedStopwatch';

const isDesktop = ref(window.innerWidth >= 1024);
const selectedItemForAssign = ref(null);

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

const showSuccessMangaModal = ref(false);
const hasRidersLoaded = ref(false);

function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, startTime, duration) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0.12, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(startTime);
      o.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    playTone(659.25, now, 0.4); // E5
    playTone(830.61, now + 0.1, 0.4); // G#5
    playTone(987.77, now + 0.2, 0.6); // B5
  } catch (e) {}
}


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

function formatStartClock(dateTimeStr) {
  if (!dateTimeStr) return 'Esperando Largada';
  return formatTimeOnly(dateTimeStr);
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

const ridersInRace = computed(() => {
  return riders.value.filter(r => r.race_status === 'en_carrera');
});

const ridersArrived = computed(() => {
  return riders.value.filter(r => r.race_status === 'llego');
});

const mangaCompletedLocally = computed(() => {
  return hasRidersLoaded.value &&
    riders.value.length > 0 &&
    ridersInRace.value.length === 0 &&
    ridersArrived.value.length > 0;
});

const { stopwatchTime } = useMangaElapsedStopwatch(activeCompetition, {
  isCompleted: mangaCompletedLocally,
});

watch(() => riders.value.length, (newLength) => {
  if (newLength > 0) {
    hasRidersLoaded.value = true;
  }
});

watch(() => ridersInRace.value.length, (newVal) => {
  if (hasRidersLoaded.value && newVal === 0 && riders.value.length > 0) {
    showSuccessMangaModal.value = true;
    playSuccessSound();
  } else {
    showSuccessMangaModal.value = false;
  }
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
  window.addEventListener('resize', checkViewport);
  window.addEventListener('category-manga-started', loadInitialData);
  // Bus DOM (NotificationCenter) — evita stopListening que mataba notificaciones globales
  window.addEventListener('time-freezed-in-meta', onTimeFreezedDom);
  window.addEventListener('rider-finished', onRiderFinishedDom);
  window.addEventListener('time-annulled-in-meta', onTimeAnnulledDom);
  window.addEventListener('queue-cleared-in-meta', onQueueClearedDom);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkViewport);
  window.removeEventListener('category-manga-started', loadInitialData);
  window.removeEventListener('time-freezed-in-meta', onTimeFreezedDom);
  window.removeEventListener('rider-finished', onRiderFinishedDom);
  window.removeEventListener('time-annulled-in-meta', onTimeAnnulledDom);
  window.removeEventListener('queue-cleared-in-meta', onQueueClearedDom);
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
  min-width: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .telemetry-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 12px;
    padding: 10px 12px;
  }

  .telemetry-lbl {
    font-size: 10px;
  }

  .telemetry-val {
    font-size: 12.5px;
  }
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
  top: calc(16px + env(safe-area-inset-top, 0px));
  left: 16px;
  right: 16px;
  z-index: 9999;
  width: auto;
  max-width: 420px;
  margin: 0 auto;
  pointer-events: none;
  box-sizing: border-box;
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
    transform: translateY(-40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-30px);
    opacity: 0;
  }
}

/* ==========================================================================
   8. MODAL DE FINALIZACIÓN EXCELENTE (Manga Completada)
   ========================================================================== */
.manga-completed-overlay {
  position: fixed;
  inset: 0;
  z-index: 15000;
  background: rgba(8, 8, 10, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.manga-completed-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(16, 185, 129, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: background 0.3s;
}

.glow-header-sport {
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, #10B981, #059669);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
}

.card-body-content-sport {
  padding: 30px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.badge-icon-completed {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10B981;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.1);
}

.badge-icon-completed span {
  font-size: 38px;
}

.completed-subtitle {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #10B981;
  letter-spacing: 2px;
  margin: 0;
}

.completed-title {
  font-size: 20px;
  font-weight: 850;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin: 0;
  line-height: 1.2;
}

.completed-phase {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
  margin: 0;
  margin-top: -4px;
}

.metrics-grid-completed {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.metric-box-comp {
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  padding: 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.lbl-box-comp {
  font-size: 8.5px;
  font-weight: 800;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

.val-box-comp {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 900;
  color: var(--color-text-primary);
}

.completed-congrats {
  font-size: 12px;
  font-weight: 650;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.manga-dismiss-btn {
  width: calc(100% - 48px);
  margin: 0 24px 28px;
  background: #10B981;
  color: #FFFFFF;
  border: none;
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 14px;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;
}

.manga-dismiss-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  background: #059669;
}

.manga-dismiss-btn:active {
  transform: translateY(0);
}

/* Transición Escala */
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Animaciones */
.animate-bounce-subtle {
  animation: bounce-subtle-comp 2.5s infinite ease-in-out;
}

@keyframes bounce-subtle-comp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.dark-theme .manga-completed-card {
  background-color: #0c0c0e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.15) !important;
}

.dark-theme .metric-box-comp {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

</style>
