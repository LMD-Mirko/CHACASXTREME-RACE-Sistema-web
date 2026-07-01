<template>
  <div class="stopwatch-container">
    <!-- Reloj de Carrera General -->
    <div class="stopwatch-card">
      <span class="stopwatch-title">Tiempo Transcurrido</span>
      <div class="stopwatch-display">
        {{ timeFormatted }}
      </div>
      <div class="launch-stamp-badge">
        <span class="material-icons stamp-icon">schedule</span>
        <span>Largada Oficial: {{ formatStamp(startTime) }}</span>
      </div>
    </div>

    <!-- Lista de Pilotos en Carrera -->
    <PartidaInRaceList :active-riders="activeRiders" />

    <!-- Botón de Pánico (Reset de Manga) -->
    <PartidaPanicReset :loading="loading" @reset="$emit('reset')" />
  </div>
</template>

<script setup>
import PartidaInRaceList from './PartidaInRaceList.vue';
import PartidaPanicReset from './PartidaPanicReset.vue';

defineProps({
  timeFormatted: { type: String, required: true },
  startTime: { type: Number, required: true },
  activeRiders: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

defineEmits(['reset']);

function formatStamp(epoch) {
  if (!epoch) return '—';
  const date = new Date(epoch);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}
</script>

<style scoped>
.stopwatch-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.4s ease forwards;
}

.stopwatch-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-premium);
  position: relative;
  overflow: hidden;
}

.stopwatch-card::after {
  content: '';
  position: absolute;
  width: 150px;
  height: 150px;
  background: var(--color-primary);
  filter: blur(50px);
  opacity: 0.08;
  z-index: 0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.stopwatch-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 1;
}

.stopwatch-display {
  font-family: 'Poppins', monospace;
  font-size: 48px;
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: -1px;
  margin: 6px 0;
  z-index: 1;
  text-shadow: 0 0 20px rgba(255, 94, 0, 0.15);
}

@media (min-width: 600px) {
  .stopwatch-display {
    font-size: 64px;
  }
}

.launch-stamp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  z-index: 1;
}

.stamp-icon {
  font-size: 16px;
}
</style>
