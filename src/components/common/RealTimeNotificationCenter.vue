<template>
  <div class="notification-center-container">
    
    <!-- 1. MODAL CENTRAL PREMIUM (Paso por Checkpoint Intermedio / Punto Medio) -->
    <Transition name="modal-scale">
      <div v-if="checkpointAlert" class="modal-overlay-glow">
        <div class="checkpoint-premium-modal">
          <!-- Efecto de resplandor superior -->
          <div class="glow-header animate-pulse-glow"></div>
          
          <div class="modal-body">
            <!-- Icono animado -->
            <div class="badge-icon-container">
              <span class="material-icons animate-bounce-subtle">query_builder</span>
            </div>
            
            <h4 class="modal-subtitle">Punto de Control: {{ checkpointAlert.checkpoint_name }}</h4>
            
            <!-- Placa en grande -->
            <div class="plate-number-display">
              <span class="hash-symbol">#</span>{{ checkpointAlert.plate_number }}
            </div>
            
            <!-- Datos del competidor -->
            <h2 class="rider-full-name">{{ checkpointAlert.full_name }}</h2>
            <p class="rider-team-name">
              <span class="material-icons info-small-icon">group</span>
              {{ checkpointAlert.club_team || 'Ninguno' }}
            </p>
            
            <!-- Categoría -->
            <div class="category-capsule">
              {{ checkpointAlert.category_name }}
            </div>

            <!-- Tiempos -->
            <div class="times-summary-grid">
              <div class="time-item-box">
                <span class="time-lbl">Hora de Registro</span>
                <strong class="time-val">{{ formatTimeOnly(checkpointAlert.exact_time) }}</strong>
              </div>
              <div class="time-item-box time-item-box--primary">
                <span class="time-lbl">Tiempo Transcurrido</span>
                <strong class="time-val time-val--highlight">{{ checkpointAlert.elapsed_time || 'N/A' }}</strong>
              </div>
            </div>
          </div>

          <!-- Barra de progreso autocierre -->
          <div class="autoclose-progress-bar">
            <div class="progress-fill"></div>
          </div>
          
          <button class="modal-dismiss-btn" @click="checkpointAlert = null">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 1b. MINI TOAST EN ESQUINA PARA EL EMISOR DEL CHECKPOINT -->
    <Transition name="toast-slide-right">
      <div v-if="senderPassToast" class="sender-pass-toast">
        <div class="sender-toast-indicator"></div>
        <span class="material-icons sender-toast-icon">check_circle</span>
        <div class="sender-toast-body">
          <span class="sender-toast-plate">#{{ senderPassToast.plate_number }}</span>
          <div class="sender-toast-text">
            <h5 class="sender-toast-name">{{ senderPassToast.full_name }}</h5>
            <p class="sender-toast-time">Registro: {{ formatTimeOnly(senderPassToast.exact_time) }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 2. DRAWER/MODAL LATERAL PREMIUM PARA ADMINS (Asignación en Meta) -->
    <Transition name="drawer-slide">
      <div v-if="adminFinishedAlert" class="admin-finished-drawer">
        <div class="drawer-glow-stripe"></div>
        <div class="drawer-header">
          <div class="header-text-group">
            <span class="material-icons drawer-bell animate-pulse-fast">sports_score</span>
            <div>
              <h3>Arribo Registrado</h3>
              <p class="drawer-subtitle-status">Sincronización de Meta en Vivo</p>
            </div>
          </div>
          <button class="drawer-close-btn" @click="adminFinishedAlert = null">
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="drawer-content">
          <!-- Tarjeta de Competidor Estilo Rider -->
          <div class="rider-sport-card">
            <div class="rider-sport-header">
              <span class="rider-sport-tag">PILOTO REGISTRADO</span>
            </div>
            <div class="rider-sport-body">
              <div class="rider-plate-giant">
                <span class="plate-hash">#</span>
                <span class="plate-num">{{ adminFinishedAlert.plate_number }}</span>
              </div>
              <div class="rider-sport-info">
                <h4 class="rider-sport-name">{{ adminFinishedAlert.full_name }}</h4>
                <div class="rider-sport-meta-row">
                  <span class="material-icons info-icon-cat">motorcycle</span>
                  <span class="rider-sport-cat">{{ adminFinishedAlert.category_name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Métricas Deportivas con explicación -->
          <div class="metrics-sport-section">
            <h5 class="section-sport-title">INFORMACIÓN GENERAL DE LLEGADA</h5>

            <!-- Hora de Cruce -->
            <div class="metric-sport-row">
              <div class="metric-sport-icon-box">
                <span class="material-icons">alarm</span>
              </div>
              <div class="metric-sport-details">
                <div class="metric-sport-header-row">
                  <span class="metric-sport-lbl">Cruce de Meta</span>
                  <strong class="metric-sport-val">{{ formatTimeOnly(adminFinishedAlert.exact_time) }}</strong>
                </div>
                <p class="metric-sport-desc">Hora exacta del reloj del servidor registrada al pasar por los sensores de meta.</p>
              </div>
            </div>

            <!-- Tiempo Neto -->
            <div class="metric-sport-row">
              <div class="metric-sport-icon-box orange-box">
                <span class="material-icons icon-orange-color">timer</span>
              </div>
              <div class="metric-sport-details">
                <div class="metric-sport-header-row">
                  <span class="metric-sport-lbl">Tiempo de Carrera</span>
                  <strong class="metric-sport-val metric-orange-val">{{ adminFinishedAlert.net_time }}</strong>
                </div>
                <p class="metric-sport-desc">Tiempo neto transcurrido (Tiempo de meta menos hora de largada de categoría).</p>
              </div>
            </div>

            <!-- Posición Provisional -->
            <div class="metric-sport-row">
              <div class="metric-sport-icon-box green-box">
                <span class="material-icons icon-green-color">emoji_events</span>
              </div>
              <div class="metric-sport-details">
                <div class="metric-sport-header-row">
                  <span class="metric-sport-lbl">Clasificación Provisional</span>
                  <strong class="metric-sport-val metric-green-val">Puesto #{{ adminFinishedAlert.current_position }}</strong>
                </div>
                <p class="metric-sport-desc">Posición actual en la tabla general de su categoría según las llegadas registradas hasta ahora.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Informativo -->
        <div class="drawer-sport-footer">
          <div class="footer-sync-badge">
            <span class="material-icons">sync</span>
            <span>GUARDADO EN BASE DE DATOS</span>
          </div>
          <button class="footer-dismiss-btn" @click="adminFinishedAlert = null">
            Aceptar
          </button>
        </div>
      </div>
    </Transition>

    <!-- 3. TOAST PREMIUM FLOTANTE GENERAL (Otros roles - RiderFinished) -->
    <Transition name="toast-slide">
      <div v-if="generalFinishedAlert" class="general-finished-toast" @click="generalFinishedAlert = null">
        <div class="toast-glow-edge"></div>
        <span class="material-icons finished-icon">emoji_events</span>
        <div class="toast-txt-col">
          <h5>¡Meta Cruzada!</h5>
          <p>Placa <strong>#{{ generalFinishedAlert.plate_number }}</strong> — {{ generalFinishedAlert.full_name }} ({{ generalFinishedAlert.net_time }})</p>
        </div>
      </div>
    </Transition>

    <!-- 4. TOAST PARA METAS (TimeFreezedInMeta) -->
    <!-- 4. TOAST PARA METAS (TimeFreezedInMeta) -->
    <Transition name="toast-slide">
      <div v-if="metaFreezedAlert" class="meta-freezed-toast">
        <div class="toast-glow-edge-blue"></div>
        <span class="material-icons freezed-icon animate-pulse-fast">timer</span>
        <div class="toast-txt-col">
          <h5>¡Marca Registrada!</h5>
          <p>Cola de tiempos actualizada con nueva llegada ciega.</p>
        </div>
      </div>
    </Transition>

    <!-- 5. TOAST PARA REINICIO DE CARRERA (RaceReset) -->
    <Transition name="toast-slide">
      <div v-if="raceResetAlert" class="race-reset-toast">
        <div class="toast-glow-edge-red"></div>
        <span class="material-icons reset-icon animate-pulse-fast text-red">sync_problem</span>
        <div class="toast-txt-col">
          <h5 class="text-red-title">Competencia Reiniciada</h5>
          <p>{{ raceResetAlert.message }}</p>
        </div>
      </div>
    </Transition>

    <!-- 6. MODAL PREMIUM GRILLA CONFIRMADA (RollCallFinished) -->
    <Transition name="modal-scale">
      <div v-if="rollCallFinishedAlert && userRole !== 'PARTIDA'" class="modal-overlay-glow">
        <div class="checkpoint-premium-modal roll-call-finished-modal">
          <div class="glow-header glow-header--success"></div>
          
          <div class="modal-body">
            <div class="badge-icon-container badge-icon-container--success">
              <span class="material-icons animate-bounce-subtle">fact_check</span>
            </div>
            
            <h4 class="modal-subtitle">GRILLA CONFIRMADA</h4>
            <h2 class="category-title">{{ rollCallFinishedAlert.category_name }}</h2>
            <p class="phase-lbl-sub">{{ rollCallFinishedAlert.phase === 'practica' ? 'Prueba de Entrenamiento' : 'Manga de Carrera Final' }}</p>
            
            <div class="present-riders-badge">
              <span class="material-icons">people</span>
              <span>{{ rollCallFinishedAlert.total_present }} Competidores Listos</span>
            </div>
            
            <!-- Listado de Pilotos en Grilla -->
            <div class="grid-riders-list-scroll">
              <div v-for="rider in rollCallFinishedAlert.riders" :key="rider.id" class="grid-rider-row-tech">
                <span class="plate-number-tech">#{{ rider.plate_number }}</span>
                <div class="rider-text-details">
                  <span class="rider-name-tech">{{ rider.full_name }}</span>
                  <span class="rider-club-tech">{{ rider.club_team || 'Independiente' }}</span>
                </div>
              </div>
            </div>
          </div>

          <button class="modal-dismiss-btn" @click="rollCallFinishedAlert = null">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 7. OVERLAY GIGANTE DE CUENTA REGRESIVA DE LARGADA (CountdownStarted) -->
    <Transition name="fade">
      <div v-if="liveCountdownVal !== null && userRole !== 'PARTIDA'" class="giant-countdown-overlay" :class="{ 'overlay--go': liveCountdownVal === '¡SALIDA!' }">
        <!-- Fondo de Cuadrícula con Banderas de Meta Cruzadas -->
        <div class="hud-bg-effects">
          <div class="check-flag-overlay" :class="{ 'check-flag-overlay--active': liveCountdownVal === '¡SALIDA!' }"></div>
          <div class="hud-scanner-line"></div>
        </div>

        <div class="hud-cockpit-box">
          <!-- Tacómetro de Largada Circular (Raider HUD) -->
          <div class="hud-tachometer-circle" :class="{ 'tachometer--go': liveCountdownVal === '¡SALIDA!' }">
            <!-- Arcos del Tacómetro (Indicadores LED) -->
            <svg class="hud-svg-ring" viewBox="0 0 100 100">
              <circle class="ring-track" cx="50" cy="50" r="45"></circle>
              <circle 
                class="ring-active-bar" 
                :class="{ 'ring-active-bar--go': liveCountdownVal === '¡SALIDA!' }"
                cx="50" cy="50" r="45"
                :stroke-dasharray="getLiveStrokeDashArray"
              ></circle>
            </svg>

            <!-- Foco Central: Número o SALIDA -->
            <div class="hud-center-display">
              <div 
                class="hud-huge-number" 
                :class="{ 
                  'animate-tick-orange': typeof liveCountdownVal === 'number', 
                  'animate-go-green': liveCountdownVal === '¡SALIDA!' 
                }"
              >
                {{ liveCountdownVal }}
              </div>
            </div>
          </div>

          <!-- Detalles de Estado de Carrera -->
          <div class="hud-meta-plate">
            <span class="hud-status-title" :class="{ 'hud-status-title--go': liveCountdownVal === '¡SALIDA!' }">
              {{ countdownCategory }}
            </span>
            <div class="hud-telemetry-row">
              <span class="sensor-indicator animate-ping-sensor"></span>
              <span class="telemetry-log">STAGE READY • LAUNCH DETECTED</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

const checkpointAlert = ref(null);
const senderPassToast = ref(null);
const adminFinishedAlert = ref(null);
const generalFinishedAlert = ref(null);
const metaFreezedAlert = ref(null);
const raceResetAlert = ref(null);
const rollCallFinishedAlert = ref(null);
const liveCountdownVal = ref(null);
const countdownCategory = ref('');

const getLiveStrokeDashArray = computed(() => {
  if (liveCountdownVal.value === '¡SALIDA!') return '283 283';
  const rawNum = typeof liveCountdownVal.value === 'number' ? liveCountdownVal.value : 3;
  const val = ((4 - rawNum) / 3) * 283;
  return `${val} 283`;
});

let channels = [];
let checkpointTimeout = null;
let adminFinishedTimeout = null;
let generalFinishedTimeout = null;
let metaFreezedTimeout = null;
let raceResetTimeout = null;
let countdownInterval = null;

const userRole = ref(localStorage.getItem('user_role')?.toUpperCase() || '');

function formatTimeOnly(dateTimeStr) {
  if (!dateTimeStr) return '';
  try {
    let cleanStr = String(dateTimeStr);
    if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
      if (cleanStr.includes(' ')) {
        cleanStr = cleanStr.replace(' ', 'T') + 'Z';
      } else {
        cleanStr = cleanStr + 'Z';
      }
    }
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dateTimeStr;
  }
}

function playPassSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.error('Audio play error', e);
  }
}

function playSenderPassSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // subtle high tick
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {}
}

function playFinishSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Arpegio de victoria
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }, idx * 100);
    });
  } catch (e) {
    console.error('Audio finish play error', e);
  }
}

function playResetSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.6); // descend to A2
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.error('Audio reset play error', e);
  }
}

function playTickSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); // high pitched beep
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
}

function playGoSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // horn sound
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {}
}

onMounted(() => {
  // Listen for storage changes to sync role dynamically if it changes without reload
  window.addEventListener('storage', () => {
    userRole.value = localStorage.getItem('user_role')?.toUpperCase() || '';
  });

  if (window.Echo) {
    // 1. Canal race-mountain
    const mountainChannel = window.Echo.channel('race-mountain');
    channels.push(mountainChannel);

    // Escucha de paso por Checkpoint
    mountainChannel.listen('.RiderPassedCheckpoint', (e) => {
      // Disparar evento DOM para actualizar componentes que lo necesiten
      window.dispatchEvent(new CustomEvent('rider-passed-checkpoint', { detail: e }));

      const myRole = userRole.value?.toUpperCase();
      const myCheckpointName = localStorage.getItem('checkpoint_name') || 'Control Intermedio';
      const isMyCheckpoint = e.checkpoint_name?.toUpperCase() === myCheckpointName.toUpperCase();

      if (myRole === 'INTERMEDIO' && isMyCheckpoint) {
        // I am the sender of this pass! Show a small toast instead of giant modal
        senderPassToast.value = e;
        playSenderPassSound();
        if (checkpointTimeout) clearTimeout(checkpointTimeout);
        checkpointTimeout = setTimeout(() => {
          senderPassToast.value = null;
        }, 4000);
      } else {
        // Show giant central modal for other devices
        checkpointAlert.value = e;
        playPassSound();
        if (checkpointTimeout) clearTimeout(checkpointTimeout);
        checkpointTimeout = setTimeout(() => {
          checkpointAlert.value = null;
        }, 5000); // Closes after 5s
      }
    });

    // Escucha de incidentes y retiros
    mountainChannel.listen('.RiderIncidentReported', (e) => {
      window.dispatchEvent(new CustomEvent('rider-incident-reported', { detail: e }));
    });

    // Escucha de largadas
    mountainChannel.listen('.CategoryMangaStarted', (e) => {
      window.dispatchEvent(new CustomEvent('category-manga-started', { detail: e }));
    });

    // Escucha de fin de pase de lista
    mountainChannel.listen('.RollCallFinished', (e) => {
      window.dispatchEvent(new CustomEvent('roll-call-finished', { detail: e }));
      rollCallFinishedAlert.value = e;
    });

    // Escucha de cuenta regresiva
    mountainChannel.listen('.CountdownStarted', (e) => {
      window.dispatchEvent(new CustomEvent('countdown-started', { detail: e }));
      
      countdownCategory.value = e.category_name;
      liveCountdownVal.value = e.duration_seconds;
      playTickSound();

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        if (typeof liveCountdownVal.value === 'number') {
          liveCountdownVal.value--;
          if (liveCountdownVal.value === 0) {
            liveCountdownVal.value = '¡SALIDA!';
            playGoSound();
          } else {
            playTickSound();
          }
        } else {
          // It was '¡SALIDA!', clear the overlay
          clearInterval(countdownInterval);
          countdownInterval = null;
          liveCountdownVal.value = null;
        }
      }, 1000);
    });

    // 2. Canal race-timing
    const timingChannel = window.Echo.channel('race-timing');
    channels.push(timingChannel);

    // Escucha de corredor finalizado en meta (Asignación)
    timingChannel.listen('.RiderFinished', (e) => {
      window.dispatchEvent(new CustomEvent('rider-finished', { detail: e }));

      // Comportamiento según el rol
      const role = localStorage.getItem('user_role')?.toUpperCase() || '';
      
      if (role === 'META' || role === 'ADMIN') {
        if (navigator.vibrate) {
          navigator.vibrate([200]); // Vibrate phone on rider finished/assigned
        }
      }

      // Mostrar siempre el toast general verde en todos los roles (incluido ADMIN)
      generalFinishedAlert.value = e;
      playFinishSound();
      if (generalFinishedTimeout) clearTimeout(generalFinishedTimeout);
      generalFinishedTimeout = setTimeout(() => {
        generalFinishedAlert.value = null;
      }, 8000); // Increased from 5s to 8s (+3s)

      // Si es ADMIN, también mostrar el panel lateral de detalles
      if (role === 'ADMIN') {
        adminFinishedAlert.value = e;
        if (adminFinishedTimeout) clearTimeout(adminFinishedTimeout);
        adminFinishedTimeout = setTimeout(() => {
          adminFinishedAlert.value = null;
        }, 11000); // Increased from 8s to 11s (+3s)
      }
    });

    // Escucha de marca congelada en meta (Pulsador)
    timingChannel.listen('.TimeFreezedInMeta', (e) => {
      window.dispatchEvent(new CustomEvent('time-freezed-in-meta', { detail: e }));

      // Solo avisar al staff de meta (quien está asignando) o admin
      const role = localStorage.getItem('user_role')?.toUpperCase() || '';
      if (role === 'META' || role === 'ADMIN') {
        metaFreezedAlert.value = e;
        playSenderPassSound(); // Play clear high-pitched beep
        if (navigator.vibrate) {
          navigator.vibrate([150, 100, 150]); // Double vibration
        }
        if (metaFreezedTimeout) clearTimeout(metaFreezedTimeout);
        metaFreezedTimeout = setTimeout(() => {
          metaFreezedAlert.value = null;
        }, 7000); // Increased from 4s to 7s (+3s)
      }
    });

    // Escucha de correcciones manuales
    timingChannel.listen('.CorrectionsApplied', (e) => {
      window.dispatchEvent(new CustomEvent('corrections-applied', { detail: e }));
    });

    // 3. Canal race-infrastructure (reinicio de competencia)
    const infraChannel = window.Echo.channel('race-infrastructure');
    channels.push(infraChannel);

    infraChannel.listen('.RaceReset', (e) => {
      window.dispatchEvent(new CustomEvent('race-reset', { detail: e }));

      raceResetAlert.value = e;
      playResetSound();

      if (raceResetTimeout) clearTimeout(raceResetTimeout);
      raceResetTimeout = setTimeout(() => {
        raceResetAlert.value = null;
      }, 6000);
    });
  }
});

onBeforeUnmount(() => {
  if (checkpointTimeout) clearTimeout(checkpointTimeout);
  if (adminFinishedTimeout) clearTimeout(adminFinishedTimeout);
  if (generalFinishedTimeout) clearTimeout(generalFinishedTimeout);
  if (metaFreezedTimeout) clearTimeout(metaFreezedTimeout);
  if (raceResetTimeout) clearTimeout(raceResetTimeout);
  if (countdownInterval) clearInterval(countdownInterval);

  if (window.Echo) {
    window.Echo.leaveChannel('race-timing');
    window.Echo.leaveChannel('race-mountain');
    window.Echo.leaveChannel('race-infrastructure');
  }
});
</script>

<style scoped>
.notification-center-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 11000;
  font-family: var(--font-family);
}

.notification-center-container * {
  pointer-events: auto;
}

/* ==========================================================================
   1. MODAL CENTRAL PREMIUM (Paso por Checkpoint Intermedio)
   ========================================================================== */
.modal-overlay-glow {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12000;
  padding: 20px;
  pointer-events: auto;
}

.checkpoint-premium-modal {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 94, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

/* Efecto superior de resplandor */
.glow-header {
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary));
}

.modal-body {
  padding: 36px 30px 24px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
}

.badge-icon-container {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: rgba(255, 94, 0, 0.08);
  border: 1.5px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--color-primary);
}

.badge-icon-container span {
  font-size: 32px;
}

.modal-subtitle {
  font-family: var(--font-headings);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.plate-number-display {
  font-family: var(--font-headings);
  font-size: 64px;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  letter-spacing: -2px;
}

.hash-symbol {
  font-size: 32px;
  opacity: 0.6;
  margin-right: 2px;
  margin-top: 6px;
}

.rider-full-name {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin-bottom: 4px;
  line-height: 1.2;
}

.rider-team-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}

.info-small-icon {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.category-capsule {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 4px 12px;
  border-radius: 30px;
  margin-bottom: 24px;
}

/* Grilla de Tiempos */
.times-summary-grid {
  display: flex;
  width: 100%;
  gap: 12px;
}

.time-item-box {
  flex: 1;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.time-item-box--primary {
  border-color: rgba(255, 94, 0, 0.25);
  background: rgba(255, 94, 0, 0.03);
}

.time-lbl {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-val {
  font-size: 15px;
  font-weight: 800;
  font-family: monospace;
  color: var(--color-text-primary);
}

.time-val--highlight {
  color: var(--color-primary);
  font-size: 16px;
}

/* Barra de progreso de autocierre */
.autoclose-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 100%;
  background: var(--color-primary);
  animation: shrink-width 5s linear forwards;
  transform-origin: left;
}

@keyframes shrink-width {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.modal-dismiss-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-dismiss-btn:hover {
  background: rgba(255, 94, 0, 0.05);
  color: var(--color-primary);
}

/* ==========================================================================
   2. DRAWER/MODAL LATERAL (Asignación en Meta para Administradores)
   ========================================================================== */
/* ==========================================================================
   2. DRAWER/MODAL LATERAL (Asignación en Meta para Administradores)
   ========================================================================== */
.admin-finished-drawer {
  position: fixed;
  top: 24px;
  right: 24px;
  bottom: 24px;
  width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 94, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 12000;
}

.drawer-glow-stripe {
  height: 4px;
  background: linear-gradient(90deg, #10B981, #059669);
}

.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-text-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-bell {
  color: #10B981;
  font-size: 26px;
}

.drawer-header h3 {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-primary);
  letter-spacing: 0.5px;
  margin: 0;
}

.drawer-subtitle-status {
  font-size: 10px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  margin-top: 1px;
}

.drawer-close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.drawer-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

.drawer-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
}

/* Tarjeta de competidor estilo Rider */
.rider-sport-card {
  background: rgba(255, 94, 0, 0.03);
  border: 1px solid rgba(255, 94, 0, 0.15);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.rider-sport-header {
  background: rgba(255, 94, 0, 0.08);
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 94, 0, 0.1);
  display: flex;
}

.rider-sport-tag {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 1px;
}

.rider-sport-body {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.rider-plate-giant {
  background: #FF5E00;
  color: #FFFFFF;
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: baseline;
  box-shadow: 0 4px 10px rgba(255, 94, 0, 0.3);
}

.plate-hash {
  font-size: 14px;
  font-weight: 700;
  opacity: 0.8;
}

.plate-num {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.rider-sport-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.rider-sport-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin: 0;
  margin-bottom: 4px;
}

.rider-sport-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.info-icon-cat {
  font-size: 14px;
}

.rider-sport-cat {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

/* Sección de métricas */
.metrics-sport-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-sport-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 800;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
  margin: 0;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 6px;
}

.metric-sport-row {
  display: flex;
  gap: 14px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
}

.metric-sport-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-sport-icon-box span {
  font-size: 20px;
  color: var(--color-text-secondary);
}

.orange-box {
  background: rgba(255, 94, 0, 0.08);
}

.green-box {
  background: rgba(16, 185, 129, 0.08);
}

.metric-sport-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  text-align: left;
}

.metric-sport-header-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.metric-sport-lbl {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.metric-sport-val {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.metric-sport-desc {
  font-size: 9.5px;
  color: var(--color-text-secondary);
  line-height: 1.3;
  margin: 0;
}

/* Footer del Drawer */
.drawer-sport-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-input-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-sync-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 800;
  color: #10B981;
}

.footer-sync-badge span {
  font-size: 12px;
}

.footer-dismiss-btn {
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 8px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-dismiss-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(255, 255, 255, 0.1);
}

.icon-orange-color {
  color: var(--color-primary) !important;
}

.icon-green-color {
  color: var(--color-success) !important;
}

.metric-orange-val {
  color: var(--color-primary) !important;
  font-family: monospace;
  font-size: 15px;
}

.metric-green-val {
  color: var(--color-success) !important;
  font-size: 15px;
}

/* ==========================================================================
   3. TOAST PREMIUM FLOTANTE GENERAL (Otros roles - RiderFinished)
   ========================================================================== */
.general-finished-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(16, 185, 129, 0.1);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  z-index: 12000;
}

.toast-glow-edge {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-success);
}

.finished-icon {
  color: var(--color-success);
  font-size: 24px;
}

.toast-txt-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toast-txt-col h5 {
  font-size: 13px;
  font-weight: 800;
  color: var(--color-success);
  margin: 0;
}

.toast-txt-col p {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

@media (max-width: 767px) {
  .general-finished-toast,
  .meta-freezed-toast {
    bottom: auto !important;
    top: 12px !important;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    width: calc(100% - 32px) !important;
    max-width: 380px !important;
  }
  
  /* Sobrescribir transiciones en móvil para evitar conflictos con translateX(-50%) y deslizar desde arriba */
  .toast-slide-enter-active {
    animation: slide-in-top-bounce-mobile 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
  }
  .toast-slide-leave-active {
    animation: slide-out-top-mobile 0.3s ease forwards !important;
  }
}

@keyframes slide-in-top-bounce-mobile {
  from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

@keyframes slide-out-top-mobile {
  from { transform: translateX(-50%) translateY(0); opacity: 1; }
  to { transform: translateX(-50%) translateY(-30px); opacity: 0; }
}

/* ==========================================================================
   4. TOAST PARA METAS (TimeFreezedInMeta)
   ========================================================================== */
.meta-freezed-toast {
  position: fixed;
  bottom: 84px;
  right: 24px;
  width: 320px;
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(59, 130, 246, 0.1);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 12000;
}

.toast-glow-edge-blue {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3B82F6;
}

.freezed-icon {
  color: #3B82F6;
  font-size: 24px;
}

.animate-pulse-fast {
  animation: pulse-quick 1s infinite alternate;
}

@keyframes pulse-quick {
  from { transform: scale(0.92); opacity: 0.8; }
  to { transform: scale(1.08); opacity: 1; }
}

/* ==========================================================================
   Transiciones de Animación
   ========================================================================== */

/* 1. Modal Scale */
.modal-scale-enter-active {
  animation: overlay-fade-in 0.25s ease forwards;
}
.modal-scale-enter-active .checkpoint-premium-modal {
  animation: scale-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.modal-scale-leave-active {
  animation: overlay-fade-out 0.25s ease forwards;
}
.modal-scale-leave-active .checkpoint-premium-modal {
  animation: scale-down 0.25s ease forwards;
}

@keyframes overlay-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes overlay-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes scale-up {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes scale-down {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.9); opacity: 0; }
}

/* 2. Drawer Slide */
.drawer-slide-enter-active {
  animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.drawer-slide-leave-active {
  animation: slide-out-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slide-in-right {
  from { transform: translateX(110%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slide-out-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(110%); opacity: 0; }
}

/* 3. Toast Slide */
.toast-slide-enter-active {
  animation: slide-in-bottom-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.toast-slide-leave-active {
  animation: slide-out-bottom 0.3s ease forwards;
}

@keyframes slide-in-bottom-bounce {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes slide-out-bottom {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(30px); opacity: 0; }
}

.animate-pulse-glow {
  animation: pulse-glow-header 2s infinite alternate ease-in-out;
}

@keyframes pulse-glow-header {
  from { filter: brightness(0.95) drop-shadow(0 0 2px rgba(255, 94, 0, 0.3)); }
  to { filter: brightness(1.25) drop-shadow(0 0 8px rgba(255, 94, 0, 0.7)); }
}

.animate-bounce-subtle {
  animation: bounce-subtle-effect 2.5s infinite ease-in-out;
}

@keyframes bounce-subtle-effect {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.dark-theme .checkpoint-premium-modal,
.dark-theme .admin-finished-drawer {
  background-color: #0c0c0e !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 94, 0, 0.08) !important;
}

.dark-theme .rider-sport-card {
  background-color: rgba(255, 94, 0, 0.06) !important;
  border-color: rgba(255, 94, 0, 0.25) !important;
}

.dark-theme .rider-sport-header {
  background-color: rgba(255, 94, 0, 0.12) !important;
  border-bottom-color: rgba(255, 94, 0, 0.15) !important;
}

.dark-theme .metric-sport-row {
  background-color: rgba(255, 255, 255, 0.02) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.dark-theme .metric-sport-icon-box {
  background-color: rgba(255, 255, 255, 0.04) !important;
}

.dark-theme .drawer-sport-footer {
  background-color: rgba(255, 255, 255, 0.01) !important;
  border-top-color: rgba(255, 255, 255, 0.06) !important;
}

.dark-theme .time-item-box {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.dark-theme .rider-card-horizontal,
.dark-theme .drawer-details-grid {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.dark-theme .category-capsule {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

/* ==========================================================================
   5. TOAST PARA REINICIO DE CARRERA (RaceReset)
   ========================================================================== */
.race-reset-toast {
  position: fixed;
  bottom: 144px;
  right: 24px;
  width: 320px;
  background: rgba(20, 10, 10, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(239, 68, 68, 0.15);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 12000;
}

.toast-glow-edge-red {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #EF4444;
}

.reset-icon {
  color: #EF4444;
  font-size: 24px;
}

.text-red {
  color: #EF4444 !important;
}

.text-red-title {
  color: #EF4444 !important;
  font-weight: 800;
  margin: 0;
}

/* ==========================================================================
   6. MODAL FIN DE PASE DE LISTA (RollCallFinished)
   ========================================================================== */
.glow-header--success {
  background: linear-gradient(90deg, #10B981, #34D399, #10B981) !important;
}

.badge-icon-container--success {
  background: rgba(16, 185, 129, 0.08) !important;
  border-color: #10B981 !important;
  color: #10B981 !important;
}

.category-title {
  font-size: 22px;
  font-weight: 900;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.phase-lbl-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  font-weight: 600;
}

.present-riders-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10B981;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 20px;
}

.grid-riders-list-scroll {
  width: 100%;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-background);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-rider-row-tech {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px dashed var(--color-border);
}

.grid-rider-row-tech:last-child {
  border-bottom: none;
}

.plate-number-tech {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
  border: 1px solid rgba(255, 94, 0, 0.15);
  padding: 2px 8px;
  border-radius: 8px;
  min-width: 42px;
  text-align: center;
}

.rider-text-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.rider-name-tech {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rider-club-tech {
  font-size: 10px;
  color: var(--color-text-secondary);
}

/* ==========================================================================
   7. OVERLAY GIGANTE DE CUENTA REGRESIVA (CountdownStarted)
   ========================================================================== */
.giant-countdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 13000;
  background: #020203;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #FFFFFF;
  padding: 16px;
  font-family: 'Space Grotesk', sans-serif;
  transition: background-color 0.3s ease;
}

.giant-countdown-overlay.overlay--go {
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

/* ==========================================================================
   8. MINI TOAST EN ESQUINA PARA EMISOR (CheckpointPass)
   ========================================================================== */
.sender-pass-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 300px;
  background: rgba(20, 20, 25, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 10px rgba(16, 185, 129, 0.1);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 12500;
  pointer-events: auto;
}

.sender-toast-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #10B981;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.sender-toast-icon {
  color: #10B981;
  font-size: 22px;
  animation: scale-up-bounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.sender-toast-body {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.sender-toast-plate {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 800;
  color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 6px;
  border-radius: 6px;
  min-width: 38px;
  text-align: center;
}

.sender-toast-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.sender-toast-name {
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.sender-toast-time {
  font-size: 10px;
  color: #94A3B8;
  margin: 0;
}

/* Transición para deslizar desde la derecha */
.toast-slide-right-enter-active {
  animation: slide-in-right-toast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.toast-slide-right-leave-active {
  animation: slide-out-right-toast 0.25s ease-in forwards;
}

@keyframes slide-in-right-toast {
  from {
    transform: translateX(120%) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes slide-out-right-toast {
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(120%) scale(0.9);
    opacity: 0;
  }
}

@keyframes scale-up-bounce {
  from { transform: scale(0.5); }
  to { transform: scale(1); }
}
</style>
