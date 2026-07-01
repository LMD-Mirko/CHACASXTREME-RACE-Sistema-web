<template>
  <div class="braking-queue-container fade-in">
    <div class="header-row">
      <h3>Cola de Frenado (FIFO)</h3>
      <span class="count-badge">{{ finishTimeQueue.length }} pendientes</span>
    </div>

    <!-- Lista de Llegadas Recientes en Tarjetas Grandes -->
    <div class="cards-list" v-if="finishTimeQueue.length > 0">
      <div
        v-for="(item, index) in finishTimeQueue"
        :key="item.id"
        class="arrival-card"
        @click="$emit('assign', item)"
      >
        <div class="card-left">
          <div class="arrival-index">Llegada #{{ index + 1 }}</div>
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

    <!-- Vacío -->
    <div v-else class="empty-state">
      <span class="material-icons">timer_off</span>
      <p>Esperando cruces de corredores por meta...</p>
    </div>
  </div>
</template>

<script setup>
import { useMeta } from '../../hooks/useMeta';

defineEmits(['assign']);

const { finishTimeQueue, annulBlindTime } = useMeta();

function formatTimeStr(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(' ');
  return parts.length > 1 ? parts[1] : dateStr;
}

function onDiscard(id) {
  if (confirm('¿Anular esta marca de tiempo?')) {
    annulBlindTime(id);
  }
}
</script>

<style scoped>
.braking-queue-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.header-row h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

.count-badge {
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 94, 0, 0.05);
  border: 1px solid rgba(255, 94, 0, 0.12);
  padding: 4px 10px;
  border-radius: 12px;
  color: var(--color-primary);
  text-transform: uppercase;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.arrival-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-premium);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  animation: slideIn 0.3s ease-out forwards;
  touch-action: manipulation;
  user-select: none;
}

.arrival-card:active {
  transform: scale(0.97);
  background: var(--color-input-bg);
}

.card-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.arrival-index {
  font-size: 10px;
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
  font-size: 18px;
  animation: pulse 1.2s infinite ease-in-out;
}

.arrival-time {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.arrow-chevron {
  font-size: 24px;
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.arrival-card:hover .arrow-chevron {
  color: var(--color-primary);
  transform: translateX(2px);
}

.btn-discard {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
}

.btn-discard:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: var(--color-error);
  color: var(--color-error);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 16px;
  text-align: center;
  color: var(--color-text-secondary);
  gap: 8px;
}

.empty-state span {
  font-size: 40px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes slideIn {
  from {
    transform: translateY(15px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
