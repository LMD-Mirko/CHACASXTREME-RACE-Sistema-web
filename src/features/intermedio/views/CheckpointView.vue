<template>
  <div class="checkpoint-view-root">
    <!-- Interfaz de Operación Principal -->
    <div class="operation-layout fade-in">
      <!-- Caso A: Ya hay largada iniciada -->
      <div v-if="hasStart" class="operation-active-view">
        <CheckpointScanner />
        <CheckpointHistory />
        <CheckpointOfflineStatus />
      </div>

      <!-- Caso B: Esperando la largada (si no hay salida no se muestra el panel) -->
      <div v-else class="waiting-start-view">
        <div class="waiting-card">
          <!-- Cabecera del checkpoint configurado -->
          <div class="waiting-station-header">
            <span class="material-icons station-icon">room</span>
            <h2>{{ checkpointName }}</h2>
            <span class="station-phase">{{ selectedPhase === 'practica' ? 'Prueba' : 'Final' }}</span>
          </div>

          <!-- Animación de radar pulsante de carrera -->
          <div class="radar-pulse-container">
            <div class="radar-ring"></div>
            <div class="radar-ring-outer"></div>
            <div class="radar-center">
              <span class="material-icons beacon-icon">sensors</span>
            </div>
          </div>

          <div class="waiting-details">
            <h3>Esperando Largada</h3>
            <p>La rampa de partida aún no ha registrado la largada oficial de esta competencia.</p>
            <div class="active-event-badge">
              <span class="material-icons event-icon">event</span>
              <span>{{ activeCompetition?.name || 'Chacas Xtreme' }}</span>
            </div>
          </div>

          <!-- Acciones de reconfiguración o recarga -->
          <div class="waiting-actions">
            <button class="btn-check-again" @click="loadInitialData" :disabled="isLoading">
              <span class="material-icons" :class="{ 'rotating': isLoading }">sync</span>
              <span>{{ isLoading ? 'Comprobando...' : 'Recomprobar Estado' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useCheckpoint } from '../hooks/useCheckpoint';
import CheckpointScanner from '../components/CheckpointScanner.vue';
import CheckpointHistory from '../components/CheckpointHistory.vue';
import CheckpointOfflineStatus from '../components/CheckpointOfflineStatus.vue';

const {
  checkpointName,
  activeCompetition,
  selectedPhase,
  hasStart,
  loadInitialData,
  loadRiders,
  riders,
  isLoading
} = useCheckpoint();

let channel = null;
let mountainChannel = null;
let pollInterval = null;

function startPolling() {
  stopPolling();
  pollInterval = setInterval(() => {
    if (!hasStart.value) {
      loadInitialData();
    }
  }, 6000); // Polling every 6 seconds as backup
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// React to hasStart flag to handle polling
watch(hasStart, (started) => {
  if (!started) {
    startPolling();
  } else {
    stopPolling();
  }
}, { immediate: true });

onMounted(() => {
  loadInitialData();
  
  // Suscripción a WebSockets para actualizaciones reactivas
  if (window.Echo) {
    channel = window.Echo.channel('race-timing');
    
    // Recargar lista si se aplican correcciones manuales
    channel.listen('.CorrectionsApplied', () => {
      loadRiders();
    });

    // Suscripción a canal de montaña para incidentes y largadas
    mountainChannel = window.Echo.channel('race-mountain');

    // Si un corredor se retira en otro punto, actualizar estado
    mountainChannel.listen('.RiderIncidentReported', (e) => {
      const idx = riders.value.findIndex(r => r.id === e.rider_id);
      if (idx !== -1) riders.value[idx].race_status = 'DNF';
    });

    // Si se da la largada en el Punto de Partida, activar inmediatamente
    mountainChannel.listen('.CategoryMangaStarted', () => {
      loadInitialData();
    });
  }
});

onBeforeUnmount(() => {
  stopPolling();
  if (channel && window.Echo) {
    channel.stopListening('.CorrectionsApplied');
  }
  if (mountainChannel && window.Echo) {
    mountainChannel.stopListening('.RiderIncidentReported');
    mountainChannel.stopListening('.CategoryMangaStarted');
  }
});
</script>

<style scoped>
.checkpoint-view-root {
  min-height: 100%;
}

.operation-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.4s ease forwards;
}

.operation-active-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Waiting View Styles */
.waiting-start-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 16px;
}

.waiting-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
}

.waiting-station-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.station-icon {
  font-size: 28px;
  color: var(--color-primary);
}

.waiting-station-header h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--color-text-primary);
  margin-top: 4px;
}

.station-phase {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 3px 8px;
  border-radius: 6px;
  margin-top: 4px;
}

/* Radar Pulse Animation */
.radar-pulse-container {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.radar-center {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.3);
}

.beacon-icon {
  font-size: 24px;
  color: #FFFFFF;
  animation: pulseBeacon 2s infinite ease-in-out;
}

.radar-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  opacity: 0;
  z-index: 1;
  animation: radarPulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}

.radar-ring-outer {
  position: absolute;
  width: 130%;
  height: 130%;
  border-radius: 50%;
  border: 1px solid var(--color-primary);
  opacity: 0;
  z-index: 1;
  animation: radarPulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  animation-delay: 0.6s;
}

.waiting-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.waiting-details h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.waiting-details p {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.active-event-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 94, 0, 0.05);
  border: 1px solid rgba(255, 94, 0, 0.12);
  color: var(--color-primary);
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  margin: 8px auto 0 auto;
}

.event-icon {
  font-size: 16px;
}

/* Actions */
.waiting-actions {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
}

.btn-check-again {
  height: 48px;
  border-radius: 12px;
  border: none;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 13.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
  transition: all 0.2s ease;
}

.btn-check-again:hover:not(:disabled) {
  opacity: 0.95;
}

.btn-change-setup-waiting {
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-change-setup-waiting:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.rotating {
  animation: spin 1.2s infinite linear;
}

/* Keyframes */
@keyframes pulseBeacon {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes radarPulse {
  0% {
    transform: scale(0.6);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
