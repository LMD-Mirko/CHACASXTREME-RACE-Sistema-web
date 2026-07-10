<template>
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div v-if="show" class="countdown-overlay" :class="{ 'overlay--go': countdown === 0 }">
        <!-- Fondo de Cuadrícula con Banderas de Meta Cruzadas -->
        <div class="hud-bg-effects">
          <div class="check-flag-overlay" :class="{ 'check-flag-overlay--active': countdown === 0 }"></div>
          <div class="hud-scanner-line"></div>
        </div>

        <div class="hud-cockpit-box">
          <!-- Tacómetro de Largada Circular (Raider HUD) -->
          <div class="hud-tachometer-circle" :class="{ 'tachometer--go': countdown === 0 }">
            <!-- Arcos del Tacómetro (Indicadores LED) -->
            <svg class="hud-svg-ring" viewBox="0 0 100 100">
              <circle class="ring-track" cx="50" cy="50" r="45"></circle>
              <circle 
                class="ring-active-bar" 
                :class="{ 'ring-active-bar--go': countdown === 0 }"
                cx="50" cy="50" r="45"
                :stroke-dasharray="strokeDashArrayVal"
              ></circle>
            </svg>

            <!-- Foco Central: Número o SALIDA -->
            <div class="hud-center-display">
              <div 
                class="hud-huge-number" 
                :class="{ 
                  'animate-tick-orange': countdown > 0, 
                  'animate-go-green': countdown === 0 
                }"
              >
                {{ countdownText }}
              </div>
            </div>
          </div>

          <!-- Detalles de Estado de Carrera -->
          <div class="hud-meta-plate">
            <span class="hud-status-title" :class="{ 'hud-status-title--go': countdown === 0 }">
              {{ countdown === 0 ? '¡PISTA LIBRE!' : 'PRESURIZANDO MOTORES' }}
            </span>
            <div class="hud-telemetry-row">
              <span class="sensor-indicator animate-ping-sensor"></span>
              <span class="telemetry-log">STAGE READY • LAUNCH DETECTED</span>
            </div>
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
  if (props.countdown === 0) return '¡SALIDA!';
  return props.countdown;
});

// Calculate radial stroke dasharray based on countdown:
// Radius is 45, Circumference is 2 * Math.PI * 45 = 282.74
// 3 left -> 94 active (282.74 * (1/3))
// 2 left -> 188 active
// 1 left -> 282 active
// 0 left -> 282 active (full ring)
const strokeDashArrayVal = computed(() => {
  if (props.countdown === 0) return '283 283';
  const val = ((4 - props.countdown) / 3) * 283;
  return `${val} 283`;
});
</script>

<style scoped>
/* Contenedor Principal con desenfoque de velocidad */
.countdown-overlay {
  position: fixed;
  inset: 0;
  background: #020203;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  overflow: hidden;
  color: #FFFFFF;
  padding: 16px;
  font-family: 'Space Grotesk', sans-serif;
  transition: background-color 0.3s ease;
}

.overlay--go {
  background: #010805 !important;
}

/* Efectos de fondo del HUD */
.hud-bg-effects {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* Textura de bandera a cuadros gigante */
.check-flag-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 20px, transparent 20px, transparent 40px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 20px, transparent 20px, transparent 40px);
  opacity: 0.6;
  transition: opacity 0.3s;
}

.check-flag-overlay--active {
  background-image: 
    repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.02) 0px, rgba(16, 185, 129, 0.02) 20px, transparent 20px, transparent 40px),
    repeating-linear-gradient(-45deg, rgba(16, 185, 129, 0.02) 0px, rgba(16, 185, 129, 0.02) 20px, transparent 20px, transparent 40px);
  opacity: 1;
}

/* Línea de escaneo láser roja/verde */
.hud-scanner-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 94, 0, 0.4), transparent);
  animation: scan-vertical 3s infinite linear;
}

.overlay--go .hud-scanner-line {
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
}

@keyframes scan-vertical {
  0% { top: -10%; }
  100% { top: 110%; }
}

.hud-cockpit-box {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
}

/* Tacómetro Circular */
.hud-tachometer-circle {
  position: relative;
  width: clamp(240px, 60vw, 380px);
  height: clamp(240px, 60vw, 380px);
  border-radius: 50%;
  background: radial-gradient(circle, #0e0f12 0%, #060708 100%);
  border: 4px solid #1a1c22;
  box-shadow: 
    0 25px 60px rgba(0, 0, 0, 0.8),
    inset 0 0 25px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(255, 94, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.tachometer--go {
  border-color: #10B981;
  box-shadow: 
    0 25px 60px rgba(0, 0, 0, 0.8),
    inset 0 0 35px rgba(16, 185, 129, 0.15),
    0 0 50px rgba(16, 185, 129, 0.2);
}

.hud-svg-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* Start from top */
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.02);
  stroke-width: 6;
}

.ring-active-bar {
  fill: none;
  stroke: #FF5E00;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  filter: drop-shadow(0 0 8px rgba(255, 94, 0, 0.6));
}

.ring-active-bar--go {
  stroke: #10B981;
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8));
}

.hud-center-display {
  position: relative;
  z-index: 5;
}

.hud-huge-number {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 950;
  line-height: 1;
  font-style: italic;
  letter-spacing: -2px;
  user-select: none;
}

.animate-tick-orange {
  font-size: clamp(90px, 20vw, 150px);
  color: #FF5E00;
  background: linear-gradient(180deg, #FFFFFF 30%, #FF5E00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 5px 15px rgba(255, 94, 0, 0.4));
  animation: tick-scale-in 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
}

.animate-go-green {
  font-size: clamp(54px, 12vw, 84px);
  color: #10B981;
  background: linear-gradient(180deg, #FFFFFF 20%, #10B981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 10px 25px rgba(16, 185, 129, 0.6));
  animation: go-blast-scale 0.4s infinite alternate ease-in-out;
  letter-spacing: 1px;
}

/* Placa inferior de estado */
.hud-meta-plate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hud-status-title {
  font-size: clamp(10px, 2.5vw, 12px);
  font-weight: 900;
  letter-spacing: 4px;
  color: #FF5E00;
  text-transform: uppercase;
  background: rgba(255, 94, 0, 0.08);
  border: 1px solid rgba(255, 94, 0, 0.2);
  padding: 4px 14px;
  border-radius: 8px;
}

.hud-status-title--go {
  color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  letter-spacing: 5px;
}

.hud-telemetry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(9px, 2vw, 10px);
  color: #4a5568;
  font-weight: 800;
  letter-spacing: 1px;
}

.sensor-indicator {
  width: 6px;
  height: 6px;
  background: #FF5E00;
  border-radius: 50%;
}

.overlay--go .sensor-indicator {
  background: #10B981;
}

.animate-ping-sensor {
  animation: sensor-ping-anim 1s infinite alternate;
}

/* Animaciones */
@keyframes tick-scale-in {
  0% { transform: scale(0.7) rotate(-10deg); opacity: 0; }
  40% { transform: scale(1.1) rotate(5deg); opacity: 1; }
  100% { transform: scale(1.0) rotate(0); }
}

@keyframes go-blast-scale {
  0% { transform: scale(0.95) skewX(-3deg); }
  100% { transform: scale(1.15) skewX(3deg); }
}

@keyframes sensor-ping-anim {
  from { opacity: 0.3; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1.3); }
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.3s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
