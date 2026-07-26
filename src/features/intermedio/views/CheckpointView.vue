<template>
  <div class="checkpoint-view-root">
    <div class="operation-layout fade-in">
      <div v-if="!hasStart" class="waiting-inline-banner">
        <span class="material-icons">sensors</span>
        <div>
          <strong>Esperando largada</strong>
          <span>Ya podés preparar QR y lista. El registro queda listo al largar.</span>
        </div>
        <button type="button" class="btn-soft-sync" :disabled="isLoading" @click="() => loadInitialData()">
          <span class="material-icons" :class="{ rotating: isLoading }">sync</span>
        </button>
      </div>

      <div class="operation-active-view">
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

.waiting-inline-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.1);
  color: var(--color-text-primary);
}

.waiting-inline-banner > .material-icons {
  color: #f59e0b;
  font-size: 22px;
  flex-shrink: 0;
}

.waiting-inline-banner div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.waiting-inline-banner strong {
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.waiting-inline-banner span {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.35;
}

.btn-soft-sync {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 10px;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-soft-sync .material-icons {
  font-size: 20px;
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

.rotating {
  animation: spin 1.2s infinite linear;
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
