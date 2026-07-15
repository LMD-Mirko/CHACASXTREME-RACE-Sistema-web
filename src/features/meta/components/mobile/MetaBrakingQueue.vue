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
          <button
            type="button"
            class="btn-scan"
            title="Escanear QR de placa"
            aria-label="Escanear QR de placa"
            @click.stop="openScan(item)"
          >
            <span class="material-icons">qr_code_scanner</span>
          </button>
          <span class="material-icons arrow-chevron">chevron_right</span>
        </div>
      </div>
    </div>

    <!-- Vacío -->
    <div v-else class="empty-state">
      <span class="material-icons">timer_off</span>
      <p>Esperando cruces de corredores por meta...</p>
    </div>

    <ContinuousQrScanner
      :open="!!scanTarget"
      mode="confirm"
      role-label="META"
      title="Asignar por QR"
      :subtitle="scanSubtitle"
      confirm-label="Asignar a este tiempo"
      :on-commit="commitScan"
      @close="scanTarget = null"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useMeta } from '../../hooks/useMeta';
import { formatRaceClockMs } from '../../../../core/time/raceTime';
import ContinuousQrScanner from '../../../../components/qr/ContinuousQrScanner.vue';

defineEmits(['assign']);

const { finishTimeQueue, assignBlindTime } = useMeta();
const scanTarget = ref(null);

const scanSubtitle = computed(() => {
  if (!scanTarget.value) return '';
  const t = formatTimeStr(scanTarget.value.blind_timestamp);
  return `Tiempo congelado ${t}. Escaneá la placa y confirmá.`;
});

function formatTimeStr(dateStr) {
  if (!dateStr) return '';
  return formatRaceClockMs(dateStr);
}

function openScan(item) {
  scanTarget.value = item;
}

async function commitScan(rider) {
  if (!scanTarget.value?.id) {
    return { ok: false, message: 'Sin tiempo seleccionado' };
  }
  if (!rider?.plate_number) {
    return { ok: false, message: 'QR sin placa' };
  }
  const result = await assignBlindTime(
    scanTarget.value.id,
    parseInt(rider.plate_number, 10),
    { silent: true },
  );
  if (result?.ok) {
    scanTarget.value = null;
    return { ok: true };
  }
  return {
    ok: false,
    already: !!result?.already,
    message: result?.message || 'No se pudo asignar',
  };
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
  position: relative;
  background-color: var(--color-surface);
  background-image: 
    linear-gradient(90deg, var(--color-surface) 70%, rgba(255, 94, 0, 0.04) 100%),
    url('../../../assets/flame-fire-border-frame-silhouette-template-illustration-clipart-vector-removebg-preview.png');
  background-position: right top;
  background-repeat: no-repeat;
  background-size: auto 60%;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-premium);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  animation: slideIn 0.3s ease-out forwards;
  touch-action: manipulation;
  user-select: none;
}

.arrival-card:active {
  transform: scale(0.97);
  background-color: var(--color-input-bg);
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
  gap: 8px;
}

.arrow-chevron {
  font-size: 22px;
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.arrival-card:hover .arrow-chevron {
  color: var(--color-primary);
  transform: translateX(2px);
}

.btn-scan {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(255, 94, 0, 0.35);
  background: rgba(255, 94, 0, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-scan:active {
  transform: scale(0.96);
}

.btn-scan .material-icons {
  font-size: 22px;
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
