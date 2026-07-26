<template>
  <div class="launch-action-row">
    <button
      class="extreme-trigger-btn"
      :class="{
        'extreme-trigger-btn--holding': isHolding,
        'extreme-trigger-btn--disabled': disabled || loading
      }"
      :disabled="disabled || loading"
      @mousedown="startHold"
      @mouseup="endHold"
      @mouseleave="endHold"
      @touchstart="startHold"
      @touchend="endHold"
      @touchcancel="endHold"
    >
      <!-- Barra de progreso con diseño industrial Hazard / Rayas deportivas -->
      <div 
        class="hold-progress-bar" 
        :class="{ 'hold-progress-bar--disabled': disabled || loading }"
        :style="{ width: (disabled || loading ? 100 : holdProgress) + '%' }"
      ></div>
      
      <div class="btn-inner-content">
        <span class="material-icons trigger-icon">
          {{ isHolding ? 'bolt' : 'double_arrow' }}
        </span>
        <span class="trigger-text">
          {{ isHolding ? 'INICIANDO SECUENCIA...' : 'MANTENER PRESIONADO PARA LARGAR AVALANCHA' }}
        </span>
      </div>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['launch']);

const isHolding = ref(false);
const holdProgress = ref(0);
let holdInterval = null;
let holdStartTime = 0;

function startHold(e) {
  e.preventDefault();
  if (props.disabled || props.loading) return;
  
  isHolding.value = true;
  holdProgress.value = 0;
  holdStartTime = Date.now();
  
  holdInterval = setInterval(() => {
    const elapsed = Date.now() - holdStartTime;
    const progress = Math.min((elapsed / 2000) * 100, 100);
    holdProgress.value = progress;
    
    if (progress >= 100) {
      triggerLaunch();
    }
  }, 16);
}

function endHold() {
  if (!isHolding.value) return;
  isHolding.value = false;
  holdProgress.value = 0;
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
}

function triggerLaunch() {
  endHold();
  emit('launch');
}
</script>

<style scoped>
.launch-action-row {
  width: 100%;
}

.extreme-trigger-btn {
  position: relative;
  width: 100%;
  min-height: 58px;
  border: none;
  /* Gradiente extremo: Naranja a Rojo Chacas X con inclinación deportiva */
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-red) 100%);
  color: #FFFFFF;
  font-family: var(--font-family);
  font-size: 13.5px;
  font-weight: 900;
  font-style: italic; /* Inclinación de velocidad */
  letter-spacing: 0.8px;
  text-transform: uppercase;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(225, 29, 72, 0.35);
  transition: transform 0.25s, box-shadow 0.25s, filter 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
}

@media (max-width: 600px) {
  .extreme-trigger-btn {
    min-height: 50px;
    font-size: 12px;
    border-radius: 12px;
  }
}

.hold-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15),
    rgba(255, 255, 255, 0.15) 10px,
    rgba(255, 255, 255, 0.3) 10px,
    rgba(255, 255, 255, 0.3) 20px
  );
  width: 0%;
  z-index: 1;
}

.hold-progress-bar--disabled {
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.015),
    rgba(0, 0, 0, 0.015) 10px,
    rgba(0, 0, 0, 0.03) 10px,
    rgba(0, 0, 0, 0.03) 20px
  ) !important;
}

.dark-theme .hold-progress-bar--disabled {
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.02) 10px,
    rgba(255, 255, 255, 0.05) 10px,
    rgba(255, 255, 255, 0.05) 20px
  ) !important;
}

.btn-inner-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.trigger-icon {
  font-size: 22px;
}

.extreme-trigger-btn:hover:not(.extreme-trigger-btn--disabled) {
  box-shadow: 0 6px 26px rgba(225, 29, 72, 0.55);
  filter: brightness(1.1);
}

.extreme-trigger-btn:active:not(.extreme-trigger-btn--disabled) {
  transform: scale(0.98);
}

.extreme-trigger-btn--holding {
  box-shadow: 0 0 35px rgba(225, 29, 72, 0.9) !important;
  transform: scale(0.98);
}

.extreme-trigger-btn--disabled {
  background: #E2E8F0 !important;
  border: 1px solid #CBD5E1 !important;
  color: #94A3B8 !important;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

.dark-theme .extreme-trigger-btn--disabled {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.22) !important;
}
</style>
