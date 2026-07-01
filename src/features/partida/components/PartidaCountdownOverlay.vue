<template>
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div v-if="show" class="countdown-overlay">
        <!-- Animated speed lines background for high velocity racing look -->
        <div class="speed-lines-container">
          <div class="speed-line" v-for="i in 8" :key="i"></div>
        </div>
        
        <!-- Pulsing radar rings -->
        <div class="radar-pulse"></div>
        
        <div class="countdown-number-wrapper">
          <div 
            class="countdown-number" 
            :class="{ 
              'countdown-number--salida': countdown === 0,
              'countdown-number--active': countdown > 0 
            }"
            :key="countdown"
          >
            {{ countdownText }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  countdown: {
    type: Number,
    required: true
  }
});

const countdownText = computed(() => {
  if (props.countdown === 0) return '¡SALIDA!';
  return props.countdown;
});
</script>

<style scoped>
.countdown-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-countdown-overlay-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  overflow: hidden;
  transition: background-color 0.3s;
}

/* Speed Lines Background */
.speed-lines-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.15;
}

.speed-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  height: 2px;
  width: 100px;
  animation: fly-across var(--duration, 0.8s) infinite linear;
}

.speed-line:nth-child(1) { top: 15%; left: -150px; --duration: 0.5s; width: 150px; }
.speed-line:nth-child(2) { top: 35%; left: -200px; --duration: 0.8s; width: 120px; }
.speed-line:nth-child(3) { top: 55%; left: -120px; --duration: 0.6s; width: 180px; }
.speed-line:nth-child(4) { top: 75%; left: -250px; --duration: 0.4s; width: 100px; }
.speed-line:nth-child(5) { top: 25%; left: -100px; --duration: 0.7s; width: 140px; }
.speed-line:nth-child(6) { top: 45%; left: -180px; --duration: 0.5s; width: 110px; }
.speed-line:nth-child(7) { top: 65%; left: -220px; --duration: 0.9s; width: 160px; }
.speed-line:nth-child(8) { top: 85%; left: -140px; --duration: 0.6s; width: 130px; }

@keyframes fly-across {
  0% { transform: translateX(0) scaleX(1); left: -150px; }
  50% { transform: translateX(50vw) scaleX(2); }
  100% { transform: translateX(120vw) scaleX(1); left: 100%; }
}

/* Pulsing radar rings */
.radar-pulse {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 4px solid var(--color-primary);
  opacity: 0;
  z-index: 0;
  animation: radar-expand 1s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
}

@keyframes radar-expand {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.countdown-number-wrapper {
  z-index: 1;
  perspective: 1000px;
}

.countdown-number {
  font-family: var(--font-headings);
  font-size: 110px;
  font-weight: 900;
  font-style: italic; /* Slanted speed font */
  color: var(--color-countdown-text);
  text-align: center;
  user-select: none;
  transition: color 0.3s;
}

.countdown-number--active {
  color: var(--color-countdown-text);
  text-shadow: 
    0 0 10px var(--color-countdown-text),
    0 0 30px var(--color-primary),
    0 0 60px var(--color-accent-red);
  animation: extreme-tick 1s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.countdown-number--salida {
  color: var(--color-success);
  font-size: 80px;
  text-shadow: 
    0 0 20px #FFFFFF,
    0 0 40px var(--color-success),
    0 0 80px #047857,
    0 0 160px var(--color-success);
  animation: extreme-salida-shake 0.5s infinite alternate ease-in-out;
}

@media (min-width: 600px) {
  .countdown-number {
    font-size: 240px;
  }
  .countdown-number--salida {
    font-size: 180px;
  }
}

@keyframes extreme-tick {
  0% { transform: scale(0.4) rotate(-15deg); opacity: 0; }
  30% { transform: scale(1.1) rotate(5deg); opacity: 1; }
  70% { transform: scale(1.0) rotate(0deg); }
  100% { transform: scale(1.2) rotate(15deg); opacity: 0; }
}

@keyframes extreme-salida-shake {
  0% { transform: scale(1.0) translate(-4px, -2px) rotate(-2deg); }
  50% { transform: scale(1.05) translate(4px, 2px) rotate(2deg); }
  100% { transform: scale(1.1) translate(-2px, 4px) rotate(-1deg); }
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.4s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
