<template>
  <div class="panic-footer">
    <div v-if="!confirmingReset" class="panic-action-container">
      <button
        class="panic-btn"
        @click="confirmingReset = true"
      >
        <span class="material-icons">lock</span>
        RESETEAR SALIDA EN FALSO
      </button>
    </div>

    <Transition name="fade">
      <div v-if="confirmingReset" class="panic-confirmation-banner">
        <div class="confirmation-text">
          <span class="material-icons warning-icon">warning</span>
          <span>¿Confirmas reiniciar la manga? Los competidores volverán a pre-inscritos.</span>
        </div>
        <div class="confirmation-actions">
          <button class="confirm-btn" @click="handlePanicReset" :disabled="loading">
            {{ loading ? 'RESETEANDO...' : 'SÍ, RESETEAR' }}
          </button>
          <button class="cancel-btn" @click="confirmingReset = false" :disabled="loading">
            CANCELAR
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['reset']);
const confirmingReset = ref(false);

function handlePanicReset() {
  emit('reset');
  confirmingReset.value = false;
}
</script>

<style scoped>
.panic-footer {
  margin-top: 10px;
}

.panic-action-container {
  display: flex;
  justify-content: center;
}

.panic-btn {
  background: var(--color-error);
  color: #FFFFFF;
  border: none;
  font-family: var(--font-family);
  font-size: 13.5px;
  font-weight: 700;
  padding: 14px 24px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
  width: 100%;
}

@media (min-width: 600px) {
  .panic-btn {
    width: auto;
  }
}

.panic-btn span {
  font-size: 18px;
}

.panic-btn:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
  filter: brightness(1.05);
}

.panic-btn:active {
  transform: translateY(0);
}

/* Banner de confirmación */
.panic-confirmation-banner {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  text-align: center;
}

@media (min-width: 768px) {
  .panic-confirmation-banner {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}

.confirmation-text {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.warning-icon {
  color: var(--color-error);
  font-size: 24px;
}

.confirmation-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  background: var(--color-error);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  filter: brightness(1.05);
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: var(--color-border);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
