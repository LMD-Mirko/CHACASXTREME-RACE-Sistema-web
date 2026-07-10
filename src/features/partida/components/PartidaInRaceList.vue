<template>
  <div class="monitoring-panel">
    <div class="panel-header">
      <h3>Pilotos en Carrera (Descendiendo)</h3>
      <span class="badge-count">{{ ridersStillRacingCount }} en pista</span>
    </div>

    <div class="descending-list">
      <div
        v-for="rider in activeRiders"
        :key="rider.id"
        class="descending-row"
        :class="{ 
          'descending-row--arrived': rider.race_status === 'llego', 
          'descending-row--dnf': rider.race_status === 'DNF' 
        }"
      >
        <span class="descending-plate" :class="{ 'plate--arrived': rider.race_status === 'llego' }">
          #{{ rider.plate_number }}
        </span>
        <div class="descending-info">
          <span class="descending-name">{{ rider.full_name }}</span>
          <span class="descending-team">{{ rider.club_team || 'Independiente' }}</span>
        </div>
        
        <!-- Estado Dinámico Deportista -->
        <div v-if="rider.race_status === 'llego'" class="status-pill status-pill--arrived">
          <span class="material-icons">check_circle</span>
          <span>Llegó</span>
        </div>
        <div v-else-if="rider.race_status === 'DNF'" class="status-pill status-pill--dnf">
          <span class="material-icons">cancel</span>
          <span>Retirado</span>
        </div>
        <div v-else class="status-pill status-pill--racing">
          <span class="material-icons spinning-icon">sync</span>
          <span>En Pista</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activeRiders: {
    type: Array,
    required: true
  }
});

const ridersStillRacingCount = computed(() => {
  return props.activeRiders.filter(r => r.race_status === 'en_carrera' || r.race_status === 'pre_inscrito').length;
});
</script>

<style scoped>
.monitoring-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-premium);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-count {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}

.descending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;
  padding-right: 4px;
}

.descending-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-left: 4px solid transparent;
  border-radius: 12px;
  gap: 12px;
  transition: all 0.25s ease;
}

.descending-row--arrived {
  border-left: 4px solid var(--color-success) !important;
  opacity: 0.85;
}

.descending-row--dnf {
  border-left: 4px solid var(--color-error) !important;
  opacity: 0.7;
}

.descending-plate {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 94, 0, 0.1);
}

.plate--arrived {
  color: var(--color-success) !important;
  background: rgba(16, 185, 129, 0.05) !important;
  border-color: rgba(16, 185, 129, 0.15) !important;
}

.descending-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: 1px;
}

.descending-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.descending-team {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
  height: 24px;
}

.status-pill--racing {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  border: 1px solid rgba(255, 94, 0, 0.15);
}

.status-pill--arrived {
  background: rgba(16, 185, 129, 0.08);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.status-pill--dnf {
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.spinning-icon {
  font-size: 14px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
