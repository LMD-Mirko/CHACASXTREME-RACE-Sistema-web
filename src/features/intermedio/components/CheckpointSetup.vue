<template>
  <div class="setup-container fade-in">
    <div class="setup-card">
      <div class="setup-header">
        <h2>Configurar Punto de Control</h2>
        <p>Establece tu posición física en la ruta de Chacas Xtreme</p>
      </div>

      <div class="setup-form">
        <!-- Selector de Checkpoint Predefinido -->
        <div class="form-group">
          <label>Punto de Control</label>
          <div class="preset-selector">
            <button
              v-for="name in presetPoints"
              :key="name"
              type="button"
              class="preset-btn"
              :class="{ 'preset-btn--active': checkpointName === name }"
              @click="setPoint(name)"
            >
              {{ name }}
            </button>
            <button
              type="button"
              class="preset-btn"
              :class="{ 'preset-btn--active': isCustom }"
              @click="setCustom"
            >
              Otro Punto
            </button>
          </div>
        </div>

        <!-- Input de Nombre Personalizado (solo si se selecciona "Otro") -->
        <Transition name="slide">
          <div v-if="isCustom" class="form-group custom-input-group">
            <label>Nombre del Checkpoint Personalizado</label>
            <input
              type="text"
              v-model="customName"
              placeholder="Ej. Entrada Túnel, Quebrada 2"
              class="custom-input"
            />
          </div>
        </Transition>



        <div class="info-redundancy-box">
          <span class="material-icons info-icon-mini">info</span>
          <p class="info-text-mini">
            Se permite más de un dispositivo por punto para respaldo y redundancia. El servidor previene marcas duplicadas.
          </p>
        </div>

        <!-- Botón de Envío -->
        <button
          class="submit-btn"
          :disabled="!isValid"
          @click="confirmSetup"
        >
          <span class="material-icons">play_circle_filled</span>
          <span>Iniciar Operaciones</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCheckpoint } from '../hooks/useCheckpoint';

const emit = defineEmits(['setup-complete']);
const { checkpointName } = useCheckpoint();

const presetPoints = ['Punto 1', 'Punto 2', 'Punto 3', 'META'];
const isCustom = ref(!presetPoints.includes(checkpointName.value));
const customName = ref(isCustom.value ? checkpointName.value : '');

const isValid = computed(() => {
  if (isCustom.value) {
    return customName.value.trim().length > 0;
  }
  return checkpointName.value.length > 0;
});

function setPoint(name) {
  isCustom.value = false;
  checkpointName.value = name;
}

function setCustom() {
  isCustom.value = true;
  checkpointName.value = customName.value;
}

function confirmSetup() {
  if (isCustom.value) {
    checkpointName.value = customName.value.trim();
  }
  emit('setup-complete');
}
</script>

<style scoped>
.setup-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 16px;
}

.setup-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.setup-header h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-primary);
}

.setup-header p {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preset-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.preset-btn {
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  touch-action: manipulation;
}

.preset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.preset-btn--active {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
}

.custom-input {
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: 14.5px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
}

.custom-input:focus {
  border-color: var(--color-primary);
}

/* Selector Segmentado de Fase */
.phase-selector-segmented {
  display: flex;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 3px;
  height: 44px;
}

.phase-segment-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  font-family: var(--font-family);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-segment-btn--active {
  background: var(--color-text-primary);
  color: var(--color-background) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .phase-segment-btn--active {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

/* Info Box */
.info-redundancy-box {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: rgba(255, 94, 0, 0.04);
  border: 1px dashed rgba(255, 94, 0, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
}

.info-icon-mini {
  font-size: 16px;
  color: var(--color-primary);
  margin-top: 1px;
}

.info-text-mini {
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

/* Botón Iniciar */
.submit-btn {
  height: 52px;
  border-radius: 12px;
  border: none;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.15);
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 94, 0, 0.25);
}

.submit-btn:disabled {
  background: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
