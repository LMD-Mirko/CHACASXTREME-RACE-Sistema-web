<template>
  <div class="partida-trigger-sticky-footer">
    <div class="trigger-footer-content">
      <!-- Fila 1: Verificación de Seguridad -->
      <div v-if="raceState === 'idle'" class="security-check-row">
        <div class="security-controls-wrapper">
          <!-- Advertencia de pilotos sin confirmar (Estilo Deportivo) -->
          <div v-if="!allActiveRidersPresent" class="presence-warning-badge">
            <span class="material-icons warning-icon-small">warning_amber</span>
            <span>PRESENCIA INCOMPLETA: Pulsa sobre los pilotos para registrarlos.</span>
          </div>

          <label class="custom-checkbox-container" :class="{ 'checkbox-disabled': !allActiveRidersPresent || isSyncing }">
            <input
              type="checkbox"
              :checked="isGridConfirmed"
              :disabled="!allActiveRidersPresent || isSyncing"
              @change="$emit('update:isGridConfirmed', $event.target.checked)"
            />
            <span class="checkmark"></span>
            <span class="checkbox-label">
              CONFIRMAR GRILLA COMPLETA (PASAR LISTA)
            </span>
          </label>
        </div>
      </div>

      <!-- Fila 2: Botón de Largada Táctil Extremo -->
      <PartidaLaunchButton
        v-if="raceState === 'idle'"
        :disabled="!isGridConfirmed || !allActiveRidersPresent || isSyncing"
        :loading="loading"
        @launch="$emit('launch')"
      />
    </div>

    <!-- Overlay de Cuenta Regresiva Gigante -->
    <PartidaCountdownOverlay
      :show="raceState === 'counting'"
      :countdown="countdown"
    />
  </div>
</template>

<script setup>
import PartidaLaunchButton from './PartidaLaunchButton.vue';
import PartidaCountdownOverlay from './PartidaCountdownOverlay.vue';

defineProps({
  isGridConfirmed: { type: Boolean, required: true },
  allActiveRidersPresent: { type: Boolean, required: true },
  raceState: { type: String, required: true },
  countdown: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  isSyncing: { type: Boolean, default: false }
});

defineEmits(['update:isGridConfirmed', 'launch']);
</script>

<style scoped>
.partida-trigger-sticky-footer {
  position: sticky;
  bottom: 0;
  width: 100%;
  background: var(--color-surface); /* Adapts to active theme */
  border: 1px solid var(--color-border); /* Matches other cards */
  border-top: 3px solid var(--color-primary); /* Sport orange border accent */
  border-radius: 16px; /* Matches other cards */
  padding: 16px;
  box-shadow: var(--shadow-premium), 0 -4px 20px rgba(0, 0, 0, 0.04);
  z-index: 100;
  margin-top: 20px;
}

.dark-theme .partida-trigger-sticky-footer {
  background: rgba(15, 15, 15, 0.98);
  border-color: rgba(255, 255, 255, 0.08);
  border-top-color: var(--color-primary);
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4);
}

.trigger-footer-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-controls-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.presence-warning-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #B45309; /* Dark Amber for high-contrast visibility on light theme */
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.dark-theme .presence-warning-badge {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.25);
  color: var(--color-secondary);
}

.warning-icon-small {
  font-size: 15px;
}

.security-check-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.custom-checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 32px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text-primary); /* Adapts to active theme */
  user-select: none;
  touch-action: manipulation;
  min-height: 24px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.dark-theme .custom-checkbox-container {
  color: #E2E8F0;
}

.checkbox-disabled {
  opacity: 0.5; /* Good visibility when disabled */
  cursor: not-allowed !important;
}

.checkbox-disabled .checkbox-label {
  color: var(--color-text-secondary);
}

.custom-checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 1px;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.2s;
}

.dark-theme .checkmark {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.custom-checkbox-container:hover input:not(:disabled) ~ .checkmark {
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(255, 94, 0, 0.3);
}

.custom-checkbox-container input:checked ~ .checkmark {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 12px var(--color-primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.custom-checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.custom-checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  padding-top: 2px;
}

/* === RESPONSIVO MÓVIL (< 600px): Hace el footer flotante mucho más compacto === */
@media (max-width: 600px) {
  .partida-trigger-sticky-footer {
    padding: 10px 12px;
    margin-top: 12px;
    border-top-width: 2px;
    border-radius: 14px;
  }
  
  .trigger-footer-content {
    gap: 8px;
  }
  
  .presence-warning-badge {
    padding: 6px 10px;
    font-size: 10px;
    border-radius: 6px;
    line-height: 1.3;
  }
  
  .custom-checkbox-container {
    font-size: 11px;
    padding-left: 28px;
    min-height: 20px;
  }
  
  .checkmark {
    height: 18px;
    width: 18px;
    border-radius: 5px;
  }
  
  .custom-checkbox-container .checkmark:after {
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
  }
}
</style>
