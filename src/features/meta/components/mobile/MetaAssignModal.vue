<template>
  <div class="bottom-sheet-overlay" @click.self="$emit('close')">
    <div class="bottom-sheet-content fade-up">
      <!-- Encabezado del Bottom Sheet -->
      <div class="sheet-header">
        <div class="drag-indicator"></div>
        <div class="title-row">
          <h4>Vincular Corredor</h4>
          <button class="btn-close" @click="$emit('close')">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="arrival-meta">
          <span>Tiempo congelado:</span>
          <strong class="arrival-time">{{ formatTimeStr(queueItem?.blind_timestamp) }}</strong>
        </div>
      </div>

      <!-- Formulario de Entrada -->
      <div class="sheet-body">
        <div class="input-container">
          <label class="input-lbl">Número de Placa</label>
          <div class="field-wrapper">
            <span class="material-icons search-plate-icon">tag</span>
            <input
              ref="plateInput"
              v-model="plateNumber"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="Digitar placa..."
              class="numeric-field-large"
              @keyup.enter="onSubmit"
            />
          </div>
        </div>

        <!-- Validador de Piloto en Tiempo Real (Dinámico con Servidor) -->
        <Transition name="fade">
          <div class="validation-box validation-box--loading" v-if="isLoadingRider">
            <span class="material-icons rotating loader-icon">sync</span>
            <span class="loading-msg">Consultando piloto en carrera...</span>
          </div>

          <div class="validation-box validation-box--success" v-else-if="matchedRider">
            <span class="material-icons check-ok">check_circle</span>
            <div class="rider-preview">
              <span class="rider-preview-name">{{ matchedRider.full_name }}</span>
              <div class="rider-preview-meta">
                <span class="rider-preview-cat">{{ matchedRider.category?.name || 'Categoría N/A' }}</span>
                <span class="divider-mini">•</span>
                <span class="rider-preview-team">{{ matchedRider.club_team || matchedRider.origin || 'Sin club' }}</span>
              </div>
              <span class="confirmation-question">¿Confirmas que es este competidor?</span>
            </div>
          </div>

          <div class="validation-box validation-box--error" v-else-if="plateNumber && showNotFound">
            <span class="material-icons check-err">error</span>
            <span class="error-msg">Piloto no encontrado o no está en carrera</span>
          </div>
        </Transition>

        <!-- Botón de Confirmación -->
        <button
          class="btn-confirm-assign"
          :disabled="!plateNumber || !matchedRider || isLoading"
          @click="onSubmit"
        >
          <span class="material-icons">done_all</span>
          {{ isLoading ? 'Guardando...' : 'Confirmar Asignación' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useMeta } from '../../hooks/useMeta';
import { getInRaceRiderByPlate } from '../../services/metaService';

const props = defineProps({
  queueItem: { type: Object, required: true }
});

const emit = defineEmits(['close', 'assigned']);

const { assignBlindTime, isLoading } = useMeta();

const plateNumber = ref('');
const plateInput = ref(null);
const matchedRider = ref(null);
const isLoadingRider = ref(false);
const showNotFound = ref(false);

let debounceTimeout = null;

watch(plateNumber, (newVal) => {
  matchedRider.value = null;
  showNotFound.value = false;
  
  if (debounceTimeout) clearTimeout(debounceTimeout);
  
  const trimmed = newVal.trim();
  if (!trimmed) {
    isLoadingRider.value = false;
    return;
  }
  
  isLoadingRider.value = true;
  debounceTimeout = setTimeout(async () => {
    try {
      const response = await getInRaceRiderByPlate(trimmed);
      if (response && response.success && response.data) {
        matchedRider.value = response.data;
      } else {
        matchedRider.value = null;
        showNotFound.value = true;
      }
    } catch (err) {
      matchedRider.value = null;
      showNotFound.value = true;
    } finally {
      isLoadingRider.value = false;
    }
  }, 400); // 400ms debounce
});

function formatTimeStr(dateStr) {
  if (!dateStr) return '';
  try {
    let cleanStr = String(dateStr).trim();
    
    // 1. Reemplazar espacio por 'T' para compatibilidad con Safari
    cleanStr = cleanStr.replace(' ', 'T');
    
    // 2. Si no tiene 'Z' ni '+', agregar 'Z' para indicar UTC
    if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
      cleanStr = cleanStr + 'Z';
    }
    
    // 3. Truncar los microsegundos a milisegundos (máximo 3 dígitos tras el punto)
    let parts = cleanStr.split('.');
    if (parts.length > 1) {
      let suffix = parts[1].includes('Z') ? 'Z' : '';
      let dec = parts[1].replace(/[^0-9]/g, '');
      cleanStr = parts[0] + '.' + dec.substring(0, 3) + suffix;
    }
    
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      const tPart = cleanStr.split('T')[1];
      if (tPart) {
        return tPart.split('.')[0].replace('Z', '');
      }
      return dateStr;
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  } catch (e) {
    return dateStr;
  }
}

async function onSubmit() {
  if (!plateNumber.value || !matchedRider.value || isLoading.value) return;
  if (navigator.vibrate) {
    navigator.vibrate(60); // Retroalimentación háptica rápida al confirmar
  }
  await assignBlindTime(props.queueItem.id, parseInt(plateNumber.value));
  emit('assigned');
}

onMounted(() => {
  if (plateInput.value) {
    plateInput.value.focus();
  }
});
</script>

<style scoped>
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet-content {
  width: 100%;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  border-radius: 24px 24px 0 0;
  padding: 16px 20px 32px 20px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drag-indicator {
  width: 40px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  margin: 0 auto 8px auto;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-row h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--color-text-primary);
  letter-spacing: 0.5px;
}

.btn-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.arrival-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: var(--color-input-bg);
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.arrival-time {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  color: var(--color-primary);
  font-weight: 900;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-lbl {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

.field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-plate-icon {
  position: absolute;
  left: 16px;
  color: var(--color-text-secondary);
  font-size: 20px;
}

.numeric-field-large {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  text-align: center;
  font-size: 26px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 900;
  outline: none;
  transition: border-color 0.2s;
  letter-spacing: 1px;
  padding: 0 48px;
}

.numeric-field-large:focus {
  border-color: var(--color-primary);
}

.validation-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  min-height: 60px;
}

.validation-box--loading {
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.loader-icon {
  color: var(--color-primary);
}

.loading-msg {
  font-size: 13px;
  font-weight: 700;
}

.validation-box--success {
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.check-ok {
  color: var(--color-success);
  font-size: 24px;
}

.rider-preview {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.rider-preview-name {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.rider-preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.divider-mini {
  color: var(--color-border);
}

.confirmation-question {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  margin-top: 4px;
  letter-spacing: 0.3px;
}

.validation-box--error {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.check-err {
  color: var(--color-error);
  font-size: 24px;
}

.error-msg {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-error);
}

.btn-confirm-assign {
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
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.25);
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.btn-confirm-assign:hover:not(:disabled) {
  opacity: 0.95;
}

.btn-confirm-assign:disabled {
  background: var(--color-border);
  color: var(--color-text-secondary);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.rotating {
  animation: spin 1.2s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-up {
  animation: fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
