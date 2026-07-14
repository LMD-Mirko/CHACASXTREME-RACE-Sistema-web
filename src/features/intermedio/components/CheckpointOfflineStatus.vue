<template>
  <div
    class="offline-status-bar"
    :class="{ 'offline-status-bar--offline': !isOnline }"
  >
    <div class="status-info">
      <span class="material-icons status-icon">
        {{ isOnline ? 'wifi' : 'wifi_off' }}
      </span>
      <div class="status-text">
        <span class="status-title">
          {{ isOnline ? 'Conectado al Servidor' : 'Sin Señal Celular' }}
        </span>
        <span class="status-desc" v-if="offlinePasses.length > 0">
          {{ offlinePasses.length }} marcas en este celular (pendientes de sync).
        </span>
        <span class="status-desc" v-else>
          {{ isOnline ? 'Mesa sincronizada · WebSocket activo.' : 'Sin red · guardando solo en este celular.' }}
        </span>
      </div>
    </div>

    <!-- Botón de Sincronización Manual (si hay elementos offline) -->
    <Transition name="fade">
      <button
        v-if="offlinePasses.length > 0"
        class="btn-sync-batch"
        :disabled="!isOnline || isLoading"
        @click="syncOfflineQueue"
      >
        <span class="material-icons">sync</span>
        {{ isLoading ? 'Enviando...' : 'Sincronizar Lote' }}
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { useCheckpoint } from '../hooks/useCheckpoint';

const {
  isOnline,
  offlinePasses,
  isLoading,
  syncOfflineQueue
} = useCheckpoint();
</script>

<style scoped>
.offline-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  min-height: 56px; /* Tactile target size > 48px */
  border-radius: 14px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: var(--color-success);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 16px;
}

.offline-status-bar--offline {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  color: var(--color-secondary);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 24px;
}

.status-text {
  display: flex;
  flex-direction: column;
}

.status-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.status-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.btn-sync-batch {
  height: 40px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.2);
  transition: all 0.2s ease;
}

.btn-sync-batch:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-sync-batch:disabled {
  background: #E2E8F0; /* Highly legible locked styling SDD-004 */
  color: #64748B;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1; /* override normal opacity */
}

/* Dark theme disabled overrides */
:global(.dark-theme) .btn-sync-batch:disabled {
  background: #1E293B;
  color: #64748B;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
