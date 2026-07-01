<template>
  <div class="gatillo-container">
    <button
      class="pulsador-btn"
      :class="{ 'pulsador-btn--active': isActive }"
      @mousedown="pulseActive"
      @mouseup="pulseRelease"
      @mouseleave="pulseRelease"
      @touchstart.prevent="pulseActiveTouch"
      @touchend="pulseRelease"
    >
      <div class="pulsador-content">
        <span class="material-icons gatillo-icon">sports_score</span>
        <span class="btn-text">CONGELAR TIEMPO</span>
        <span class="btn-subtext">[ BARRA ESPACIADORA ]</span>
      </div>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useMeta } from '../../hooks/useMeta';

const { triggerBlindTime } = useMeta();
const isActive = ref(false);

function pulseActive() {
  isActive.value = true;
  triggerBlindTime();
}

function pulseActiveTouch() {
  isActive.value = true;
  triggerBlindTime();
}

function pulseRelease() {
  isActive.value = false;
}

function handleKeyDown(e) {
  // Avoid capturing spacebar if focus is on an input or select
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (!isActive.value) {
      isActive.value = true;
      triggerBlindTime();
    }
  }
}

function handleKeyUp(e) {
  if (e.code === 'Space') {
    isActive.value = false;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style scoped>
.gatillo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.pulsador-btn {
  width: 100%;
  max-width: 440px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 10px solid var(--color-border);
  background: radial-gradient(circle, var(--color-primary) 0%, #CC4B00 100%);
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: 0 20px 50px rgba(255, 94, 0, 0.3), inset 0 4px 10px rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  outline: none;
  touch-action: manipulation;
}

.pulsador-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.pulsador-btn--active {
  transform: scale(0.95) translateY(2px) !important;
  box-shadow: 0 5px 15px rgba(255, 94, 0, 0.5), inset 0 -4px 10px rgba(0,0,0,0.6) !important;
  background: radial-gradient(circle, #CC4B00 0%, #883300 100%) !important;
  border-color: var(--color-primary) !important;
}

.pulsador-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.gatillo-icon {
  font-size: 80px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.btn-text {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-subtext {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-secondary);
  letter-spacing: 0.5px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
