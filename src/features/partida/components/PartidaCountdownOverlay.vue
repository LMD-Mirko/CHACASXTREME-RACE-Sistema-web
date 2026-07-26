<template>
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div v-if="show" class="countdown-overlay" :class="{ 'overlay--go': countdown === 0 }">
        <!-- 1. Grid editorial and dynamic background -->
        <div class="overlay-grid-bg"></div>
        <div class="overlay-slanted-wipe" :class="{ 'slanted-wipe--go': countdown === 0 }"></div>

        <!-- 2. Cockpit content centered -->
        <div class="overlay-content">
          <!-- Giant Glowing Ring with Count Inside -->
          <div class="glow-pulse-ring" :class="{ 'pulse-ring--go': countdown === 0 }">
            <svg class="ring-svg" viewBox="0 0 100 100">
              <circle class="ring-track" cx="50" cy="50" r="45"></circle>
              <circle 
                class="ring-active-bar" 
                :class="{ 'ring-active-bar--go': countdown === 0 }"
                cx="50" cy="50" r="45"
                :stroke-dasharray="strokeDashArrayVal"
              ></circle>
            </svg>
            
            <div class="center-number-display">
              <div 
                class="giant-plate-number" 
                :key="countdown"
                :class="{ 
                  'number--tick': countdown > 0, 
                  'number--go': countdown === 0 
                }"
              >
                {{ countdownText }}
              </div>
            </div>
          </div>

          <!-- Bottom Telemetry Card styled as finished overlay panel -->
          <div class="telemetry-card" :class="{ 'card--go': countdown === 0 }">
            <!-- Diagonal Hazard Strip Header Decor -->
            <div class="hazard-stripe-decor" :class="{ 'decor--go': countdown === 0 }"></div>

            <div class="card-inner">
              <div class="status-msg">
                {{ countdown === 0 ? '¡SALIDA INMEDIATA!' : 'PRESURIZANDO MOTORES' }}
              </div>
              <div class="telemetry-log">
                <span class="pulse-indicator" :class="{ 'indicator--go': countdown === 0 }"></span>
                <span>SYSTEM STATUS: {{ countdown === 0 ? 'LAUNCH OK' : 'STAGE READY' }}</span>
              </div>
            </div>

            <!-- Corners decoration -->
            <div class="corner-mark top-left"></div>
            <div class="corner-mark top-right"></div>
            <div class="corner-mark bottom-left"></div>
            <div class="corner-mark bottom-right"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  countdown: { type: Number, required: true }
});

const countdownText = computed(() => {
  if (props.countdown === 0) return 'GO!';
  return props.countdown;
});

// Circular dash calculations
const strokeDashArrayVal = computed(() => {
  if (props.countdown === 0) return '283 283';
  const val = ((4 - props.countdown) / 3) * 283;
  return `${val} 283`;
});
</script>

<style scoped>
.countdown-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 2, 2, 0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100010;
  overflow: hidden;
  color: #ffffff;
  padding: 16px;
  font-family: 'Space Grotesk', sans-serif;
}

/* Grid Editorial Background */
.overlay-grid-bg {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 94, 0, 0.02) 1.5px, transparent 1.5px), 
    linear-gradient(90deg, rgba(255, 94, 0, 0.02) 1.5px, transparent 1.5px);
  background-size: 30px 30px;
  z-index: 1;
  opacity: 0.8;
}

/* Fondo ambient full-bleed (el antiguo wipe a 140vw + translateX(-20vw) cortaba un lado) */
.overlay-slanted-wipe {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 32%, rgba(255, 94, 0, 0.16) 0%, transparent 55%),
    #0a0a0a;
  z-index: 2;
  transition: background 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  overflow: hidden;
}

.overlay-slanted-wipe::before {
  content: '';
  position: absolute;
  top: -20%;
  left: 50%;
  width: 4px;
  height: 140%;
  margin-left: -2px;
  background: #ff5e00;
  box-shadow: 0 0 28px rgba(255, 94, 0, 0.45);
  transform: skewX(-12deg) translateX(-18vw);
  opacity: 0.85;
  transition: background 0.5s ease, box-shadow 0.5s ease;
}

.slanted-wipe--go {
  background:
    radial-gradient(circle at 50% 32%, rgba(16, 185, 129, 0.14) 0%, transparent 55%),
    #060d09;
}

.slanted-wipe--go::before {
  background: #10b981;
  box-shadow: 0 0 28px rgba(16, 185, 129, 0.4);
}

/* Content layout — anclado al viewport, siempre centrado */
.overlay-content {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 1rem;
  box-sizing: border-box;
  text-align: center;
  pointer-events: none;
}

.overlay-content > * {
  pointer-events: auto;
}

/* Glowing Pulse Ring */
.glow-pulse-ring {
  position: relative;
  width: clamp(240px, 48vw, 340px);
  height: clamp(240px, 48vw, 340px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulseRing 1.8s ease-in-out infinite;
}

@keyframes pulseRing {
  0%, 100% { filter: drop-shadow(0 0 15px rgba(255, 94, 0, 0.25)); }
  50% { filter: drop-shadow(0 0 35px rgba(255, 94, 0, 0.55)); }
}

.pulse-ring--go {
  animation: pulseRingGo 1.8s ease-in-out infinite;
}

@keyframes pulseRingGo {
  0%, 100% { filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.3)); }
  50% { filter: drop-shadow(0 0 35px rgba(16, 185, 129, 0.6)); }
}

.ring-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.03);
  stroke-width: 4;
}

.ring-active-bar {
  fill: none;
  stroke: #ff5e00;
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dasharray 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.ring-active-bar--go {
  stroke: #10b981;
}

.center-number-display {
  position: relative;
  z-index: 5;
}

/* Giant Number */
.giant-plate-number {
  font-family: 'Space Grotesk', 'Impact', sans-serif;
  font-weight: 950;
  line-height: 1;
  font-style: italic;
  letter-spacing: -2px;
  user-select: none;
}

.number--tick {
  font-size: clamp(90px, 16vw, 130px);
  background: linear-gradient(135deg, #ffffff 30%, #ff5e00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: tickScale 0.95s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes tickScale {
  0% { transform: scale(0.6) rotate(-15deg); opacity: 0; filter: blur(4px); }
  50% { transform: scale(1.15) rotate(5deg); opacity: 1; filter: blur(0); }
  100% { transform: scale(1.0) rotate(0); }
}

.number--go {
  font-size: clamp(54px, 10vw, 76px);
  background: linear-gradient(135deg, #ffffff 20%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: goBlast 0.4s infinite alternate ease-in-out;
  letter-spacing: 2px;
}

@keyframes goBlast {
  0% { transform: scale(0.95) skewX(-4deg); }
  100% { transform: scale(1.12) skewX(4deg); }
}

/* Bottom Telemetry Card */
.telemetry-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(10, 10, 10, 0.85);
  border: 1px solid rgba(255, 94, 0, 0.25);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.5s ease;
}

.card--go {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.1);
}

.card-inner {
  padding: 1.2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-msg {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 3px;
  color: #ff5e00;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(255, 94, 0, 0.2);
}

.card--go .status-msg {
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
}

.telemetry-log {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  font-family: monospace;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 700;
  letter-spacing: 1px;
}

.pulse-indicator {
  width: 6px;
  height: 6px;
  background: #ff5e00;
  border-radius: 50%;
  animation: indicatorPulse 0.8s infinite alternate;
}

.indicator--go {
  background: #10b981;
}

@keyframes indicatorPulse {
  from { opacity: 0.3; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}

/* Hazard Tape Header Decor */
.hazard-stripe-decor {
  height: 8px;
  width: 100%;
  background: repeating-linear-gradient(
    -45deg,
    #000,
    #000 6px,
    #ff5e00 6px,
    #ff5e00 12px
  );
}

.decor--go {
  background: repeating-linear-gradient(
    -45deg,
    #000,
    #000 6px,
    #10b981 6px,
    #10b981 12px
  );
}

/* Corner markers style */
.telemetry-card .corner-mark {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1.5px solid #ff5e00;
  pointer-events: none;
  opacity: 0.7;
}

.card--go .corner-mark {
  border-color: #10b981;
}

.telemetry-card .corner-mark.top-left { top: 12px; left: 12px; border-right: none; border-bottom: none; }
.telemetry-card .corner-mark.top-right { top: 12px; right: 12px; border-left: none; border-bottom: none; }
.telemetry-card .corner-mark.bottom-left { bottom: 12px; left: 12px; border-right: none; border-top: none; }
.telemetry-card .corner-mark.bottom-right { bottom: 12px; right: 12px; border-left: none; border-top: none; }

/* Transitions */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.4s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
