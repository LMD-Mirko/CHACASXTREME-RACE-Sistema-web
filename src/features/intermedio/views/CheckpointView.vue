<template>
  <div class="checkpoint-view-root">
    <div class="operation-layout fade-in">
      <div v-if="hasStart" class="operation-active-view">
        <!-- Banner de mesa compartida (3 celulares, 1 punto) -->
        <div class="mesh-station-banner">
          <div class="mesh-station-left">
            <span class="material-icons mesh-icon">hub</span>
            <div class="mesh-copy">
              <strong>Punto medio · mesa compartida</strong>
              <span>{{ checkpointName }} · los 3 celulares se sincronizan en vivo</span>
            </div>
          </div>
          <div class="mesh-stats">
            <span class="mesh-stat mesh-stat--ok">
              <span class="material-icons">done_all</span>
              {{ arrivedCount }}
            </span>
            <span class="mesh-stat">
              <span class="material-icons">pending</span>
              {{ pendingCount }}
            </span>
          </div>
        </div>

        <CheckpointScanner />
        <CheckpointHistory />
        <CheckpointOfflineStatus />
      </div>

      <div v-else class="waiting-start-view">
        <div class="waiting-card">
          <div class="waiting-station-header">
            <span class="material-icons station-icon">room</span>
            <h2>{{ checkpointName }}</h2>
            <span class="station-phase">{{ selectedPhase === 'practica' ? 'Prueba' : 'Final' }}</span>
            <span class="station-mesh-hint">Mesa compartida · varios celulares</span>
          </div>

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

          <div class="waiting-actions">
            <button class="btn-check-again" @click="() => loadInitialData()" :disabled="isLoading">
              <span class="material-icons" :class="{ rotating: isLoading }">sync</span>
              <span>{{ isLoading ? 'Comprobando...' : 'Recomprobar Estado' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
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
  isLoading,
  arrivedCount,
  pendingCount,
  applyRemoteCheckpointPass,
} = useCheckpoint();

let pollInterval = null;

function startPolling() {
  stopPolling();
  pollInterval = setInterval(() => {
    if (!hasStart.value) {
      loadInitialData({ soft: true });
    } else {
      // Respaldo si el WebSocket falla entre los 3 celulares
      loadRiders();
    }
  }, hasStart.value ? 10000 : 6000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

watch(
  hasStart,
  () => {
    startPolling();
  },
  { immediate: true }
);

const handlePassedCheckpoint = (e) => {
  const applied = applyRemoteCheckpointPass(e?.detail);
  if (!applied) {
    // Correcciones / fase distinta: soft refresh
    loadRiders();
  }
};

const handleRiderIncident = (e) => {
  const incident = e.detail;
  const idx = riders.value.findIndex((r) => r.id === incident.rider_id);
  if (idx !== -1) riders.value[idx].race_status = 'DNF';
};

const handleMangaStarted = () => {
  loadInitialData();
};

const handleRaceReset = () => {
  loadInitialData();
};

const handleCorrections = () => {
  loadRiders();
};

onMounted(() => {
  loadInitialData();

  window.addEventListener('rider-passed-checkpoint', handlePassedCheckpoint);
  window.addEventListener('rider-finished', handleCorrections);
  window.addEventListener('rider-incident-reported', handleRiderIncident);
  window.addEventListener('category-manga-started', handleMangaStarted);
  window.addEventListener('corrections-applied', handleCorrections);
  window.addEventListener('race-reset', handleRaceReset);
});

onBeforeUnmount(() => {
  stopPolling();
  window.removeEventListener('rider-passed-checkpoint', handlePassedCheckpoint);
  window.removeEventListener('rider-finished', handleCorrections);
  window.removeEventListener('rider-incident-reported', handleRiderIncident);
  window.removeEventListener('category-manga-started', handleMangaStarted);
  window.removeEventListener('corrections-applied', handleCorrections);
  window.removeEventListener('race-reset', handleRaceReset);
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
  gap: 16px;
}

.mesh-station-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 94, 0, 0.08), rgba(16, 185, 129, 0.06));
  border: 1px solid rgba(255, 94, 0, 0.18);
}

.mesh-station-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mesh-icon {
  color: var(--color-primary);
  font-size: 22px;
}

.mesh-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mesh-copy strong {
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--color-text-primary);
}

.mesh-copy span {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mesh-stats {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.mesh-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text-secondary);
}

.mesh-stat .material-icons {
  font-size: 14px;
}

.mesh-stat--ok {
  color: var(--color-success);
  border-color: rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.08);
}

.station-mesh-hint {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.3px;
}

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
  color: #ffffff;
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
  color: #ffffff;
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

.rotating {
  animation: spin 1.2s infinite linear;
}

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

@media (max-width: 560px) {
  .mesh-station-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .mesh-copy span {
    white-space: normal;
  }
}
</style>
