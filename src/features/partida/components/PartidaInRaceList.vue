<template>
  <div class="monitoring-panel">
    <div class="panel-header">
      <h3>Pilotos en Carrera (Descendiendo)</h3>
      <span class="badge-count">{{ activeRiders.length }} en pista</span>
    </div>

    <div class="descending-list">
      <div
        v-for="rider in activeRiders"
        :key="rider.id"
        class="descending-row"
      >
        <span class="descending-plate">#{{ rider.plate_number }}</span>
        <div class="descending-info">
          <span class="descending-name">{{ rider.full_name }}</span>
          <span class="descending-team">{{ rider.club_team || 'Independiente' }}</span>
        </div>
        <div class="status-pill status-pill--racing">
          <span class="material-icons spinning-icon">sync</span>
          En Pista
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeRiders: {
    type: Array,
    required: true
  }
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
  border-radius: 12px;
  gap: 12px;
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

.descending-info {
  flex: 1;
  display: flex;
  flex-direction: column;
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
}

.descending-team {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.spinning-icon {
  font-size: 14px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
