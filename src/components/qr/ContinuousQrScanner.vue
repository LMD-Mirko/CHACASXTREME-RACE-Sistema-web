<template>
  <Teleport to="body">
    <div v-if="open" class="qr-session" role="dialog" aria-modal="true">
      <header class="qr-session__top">
        <div class="qr-session__titles">
          <span class="qr-session__badge">{{ roleLabel }} · {{ engineLabel }}</span>
          <h2>{{ title }}</h2>
          <p>{{ subtitle }}</p>
        </div>
        <div class="qr-session__controls">
          <button
            v-if="hasTorch"
            type="button"
            class="qr-session__tool"
            :class="{ 'qr-session__tool--on': torchOn }"
            :aria-label="torchOn ? 'Apagar linterna' : 'Encender linterna'"
            @click="toggleTorch"
          >
            <span class="material-icons">{{ torchOn ? 'flash_on' : 'flash_off' }}</span>
          </button>
          <button
            v-if="hasZoom"
            type="button"
            class="qr-session__tool"
            aria-label="Acercar"
            @click="bumpZoom"
          >
            <span class="material-icons">zoom_in</span>
          </button>
          <button type="button" class="qr-session__exit" @click="exit">
            <span class="material-icons">close</span>
            <span>Salir</span>
          </button>
        </div>
      </header>

      <div class="qr-session__stage">
        <div ref="mountRef" class="qr-session__reader"></div>

        <div
          class="qr-session__frame"
          :class="{
            'qr-session__frame--lock': lockPulse,
            'qr-session__frame--ok': lockPulse === 'ok',
            'qr-session__frame--err': lockPulse === 'err',
          }"
          aria-hidden="true"
        >
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          <span class="scan-beam" />
        </div>

        <p class="qr-session__hint">{{ hintText }}</p>
        <p v-if="statusLine" class="qr-session__status">{{ statusLine }}</p>
      </div>

      <div class="qr-session__feed">
        <div v-if="flash" class="qr-flash" :class="`qr-flash--${flash.type}`">
          <strong>{{ flash.title }}</strong>
          <span>{{ flash.detail }}</span>
        </div>
        <ul v-if="recent.length" class="qr-recent">
          <li v-for="(item, i) in recent" :key="`${item.plate}-${i}`">
            <span class="plate">#{{ item.plate }}</span>
            <span class="name">{{ item.name }}</span>
            <span class="when">{{ item.when }}</span>
          </li>
        </ul>
      </div>

      <div v-if="pendingConfirm" class="qr-confirm" @click.self="cancelConfirm">
        <div class="qr-confirm__card">
          <p class="qr-confirm__kicker">Confirmar escaneo</p>
          <div class="qr-confirm__plate">#{{ pendingConfirm.plate_number }}</div>
          <h3>{{ pendingConfirm.full_name }}</h3>
          <p class="qr-confirm__cat">{{ pendingConfirm.category_name || '—' }}</p>
          <div class="qr-confirm__actions">
            <button type="button" class="btn-ghost" :disabled="busy" @click="cancelConfirm">
              Cancelar
            </button>
            <button type="button" class="btn-ok" :disabled="busy" @click="acceptConfirm">
              {{ busy ? 'Guardando…' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { AdvancedQrEngine, supportsNativeBarcode } from '../../core/qr/advancedQrEngine.js';
import { resolvePlateQr } from '../../core/qr/plateQrApi.js';

const props = defineProps({
  open: { type: Boolean, default: false },
  /** auto = Intermedio (sin modal). confirm = Partida/Meta */
  mode: { type: String, default: 'auto' },
  roleLabel: { type: String, default: 'QR' },
  title: { type: String, default: 'Escanear placas' },
  subtitle: { type: String, default: 'Acerca el celular al sticker. Seguí escaneando sin salir.' },
  confirmLabel: { type: String, default: 'Confirmar' },
  /**
   * Acción del padre tras resolver rider.
   * Debe retornar Promise<{ ok:boolean, already?:boolean, message?:string }>
   */
  onCommit: { type: Function, required: true },
});

const emit = defineEmits(['close']);

const mountRef = ref(null);
const flash = ref(null);
const recent = ref([]);
const pendingConfirm = ref(null);
const busy = ref(false);
const lockPulse = ref('');
const torchOn = ref(false);
const hasTorch = ref(false);
const hasZoom = ref(false);
const engineName = ref(supportsNativeBarcode() ? 'native' : 'compat');
const statusLine = ref('');
const zoomFactor = ref(1.4);

const engineLabel = computed(() =>
  engineName.value === 'native' ? 'Motor nativo' : 'Motor compat',
);

const hintText = computed(() =>
  props.mode === 'confirm'
    ? 'Apuntá → confirma → siguiente (doble lectura segura)'
    : 'Escaneo continuo inteligente · registro al instante',
);

let engine = null;
let flashTimer = null;
let lockTimer = null;
/** @type {Map<number, number>} plate → cooldownUntil */
const plateCooldown = new Map();
/** payloads en vuelo (resolver+commit) */
const inflightPayloads = new Set();
let queuedPayload = null;
let audioCtx = null;

function beep(ok = true) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = ok ? 'triangle' : 'sawtooth';
    o.frequency.value = ok ? 980 : 180;
    g.gain.value = 0.035;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + (ok ? 0.07 : 0.14));
  } catch { /* ignore */ }
}

function pulse(kind) {
  lockPulse.value = kind || 'lock';
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(() => { lockPulse.value = ''; }, kind ? 520 : 280);
}

function showFlash(type, title, detail) {
  flash.value = { type, title, detail };
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash.value = null; }, 1500);
}

function pushRecent(rider) {
  recent.value = [
    {
      plate: rider.plate_number,
      name: rider.full_name,
      when: new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    },
    ...recent.value,
  ].slice(0, 8);
}

function plateKey(rider) {
  return parseInt(rider?.plate_number, 10) || 0;
}

function isPlateCool(plate) {
  const until = plateCooldown.get(plate) || 0;
  return Date.now() >= until;
}

function coolPlate(plate, ms) {
  plateCooldown.set(plate, Date.now() + ms);
}

async function pauseCamera() {
  try { await engine?.pause(); } catch { /* */ }
}

async function resumeCamera() {
  try { await engine?.resume(); } catch { /* */ }
}

async function toggleTorch() {
  if (!engine) return;
  const ok = await engine.toggleTorch();
  if (ok) torchOn.value = engine.torchOn;
}

async function bumpZoom() {
  if (!engine || !hasZoom.value) return;
  zoomFactor.value = zoomFactor.value >= 2.2 ? 1.2 : zoomFactor.value + 0.4;
  await engine.setZoom(zoomFactor.value);
}

/**
 * Pipeline inteligente:
 * - caché de resolve (API)
 * - cooldown por placa (no por frame)
 * - cola de 1 payload si está busy con otra placa
 */
async function handlePayload(payload) {
  if (!props.open || pendingConfirm.value) return;
  if (inflightPayloads.has(payload)) return;

  // Si está ocupado con otra cosa, guardar el más reciente distinto
  if (busy.value) {
    queuedPayload = payload;
    statusLine.value = 'Cola inteligente…';
    return;
  }

  inflightPayloads.add(payload);
  busy.value = true;
  pulse('lock');
  statusLine.value = 'Validando…';

  try {
    const rider = await resolvePlateQr(payload);
    if (!rider) {
      beep(false);
      pulse('err');
      showFlash('err', 'QR inválido', 'No pertenece a esta edición');
      statusLine.value = '';
      return;
    }

    const plate = plateKey(rider);
    if (!isPlateCool(plate)) {
      statusLine.value = '';
      return;
    }

    if (props.mode === 'confirm') {
      beep(true);
      pulse('ok');
      pendingConfirm.value = rider;
      statusLine.value = '';
      await pauseCamera();
      return;
    }

    // Modo auto
    const result = await props.onCommit(rider);
    if (result?.already) {
      coolPlate(plate, 1600);
      beep(false);
      pulse('err');
      showFlash('warn', `#${rider.plate_number}`, result.message || 'Ya estaba marcado');
    } else if (result?.ok) {
      coolPlate(plate, 1400);
      beep(true);
      pulse('ok');
      showFlash('ok', `#${rider.plate_number}`, rider.full_name);
      pushRecent(rider);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([18, 30, 18]);
      }
    } else {
      coolPlate(plate, 900);
      beep(false);
      pulse('err');
      showFlash('err', `#${rider.plate_number}`, result?.message || 'No se pudo registrar');
    }
    statusLine.value = '';
  } catch (e) {
    beep(false);
    pulse('err');
    showFlash('err', 'Error', e.friendlyMessage || e.message || 'Fallo al leer QR');
    statusLine.value = '';
  } finally {
    inflightPayloads.delete(payload);
    busy.value = false;
    // Drenar cola
    if (queuedPayload && queuedPayload !== payload) {
      const next = queuedPayload;
      queuedPayload = null;
      queueMicrotask(() => handlePayload(next));
    } else {
      queuedPayload = null;
    }
  }
}

async function acceptConfirm() {
  if (!pendingConfirm.value || busy.value) return;
  busy.value = true;
  try {
    const rider = pendingConfirm.value;
    const plate = plateKey(rider);
    const result = await props.onCommit(rider);
    pendingConfirm.value = null;
    coolPlate(plate, 1500);
    if (result?.already) {
      showFlash('warn', `#${rider.plate_number}`, result.message || 'Ya estaba');
      pulse('err');
    } else if (result?.ok) {
      showFlash('ok', `#${rider.plate_number}`, rider.full_name);
      pushRecent(rider);
      pulse('ok');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    } else {
      showFlash('err', `#${rider.plate_number}`, result?.message || 'No se pudo guardar');
      pulse('err');
    }
  } finally {
    busy.value = false;
    await resumeCamera();
  }
}

async function cancelConfirm() {
  pendingConfirm.value = null;
  await resumeCamera();
}

async function startEngine() {
  await nextTick();
  await stopEngine();
  const el = mountRef.value;
  if (!el) return;

  engine = new AdvancedQrEngine(el, {
    onPayload: (payload) => { handlePayload(payload); },
    onReady: (info) => {
      engineName.value = info.engine;
      hasTorch.value = !!info.torch;
      hasZoom.value = !!info.zoom;
      torchOn.value = false;
      statusLine.value = info.engine === 'native'
        ? 'Detector nativo activo'
        : 'Modo compatibilidad';
      setTimeout(() => {
        if (statusLine.value.includes('activo') || statusLine.value.includes('compat')) {
          statusLine.value = '';
        }
      }, 1800);
    },
    onError: (err) => {
      showFlash('err', 'Cámara', err?.message || 'No se pudo iniciar');
    },
  });

  await engine.start();
}

async function stopEngine() {
  if (!engine) return;
  try { await engine.stop(); } catch { /* */ }
  engine = null;
  torchOn.value = false;
}

function exit() {
  emit('close');
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      recent.value = [];
      flash.value = null;
      pendingConfirm.value = null;
      plateCooldown.clear();
      inflightPayloads.clear();
      queuedPayload = null;
      statusLine.value = 'Iniciando cámara…';
      try {
        await startEngine();
      } catch (e) {
        showFlash('err', 'Cámara', e?.message || 'No se pudo abrir la cámara');
        statusLine.value = '';
      }
    } else {
      document.body.style.overflow = '';
      await stopEngine();
    }
  },
);

onBeforeUnmount(async () => {
  document.body.style.overflow = '';
  if (flashTimer) clearTimeout(flashTimer);
  if (lockTimer) clearTimeout(lockTimer);
  await stopEngine();
});
</script>

<style scoped>
.qr-session {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: #050505;
  color: #fff;
  overscroll-behavior: none;
}

.qr-session__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: max(12px, env(safe-area-inset-top)) 14px 10px;
  background: linear-gradient(180deg, rgba(0,0,0,.92), rgba(0,0,0,.55));
  position: relative;
  z-index: 3;
}

.qr-session__badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ff5e00;
  margin-bottom: 4px;
}

.qr-session__titles h2 {
  margin: 0;
  font-size: clamp(1.05rem, 4vw, 1.35rem);
  font-weight: 800;
}

.qr-session__titles p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: rgba(255,255,255,.65);
  max-width: 28rem;
  line-height: 1.35;
}

.qr-session__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qr-session__tool,
.qr-session__exit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.08);
  color: #fff;
  border-radius: 999px;
  padding: 10px 12px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.qr-session__tool {
  width: 44px;
  height: 44px;
  padding: 0;
}

.qr-session__tool--on {
  background: rgba(255, 94, 0, 0.25);
  border-color: rgba(255, 94, 0, 0.7);
  color: #ff5e00;
}

.qr-session__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
}

.qr-session__reader {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-session__reader :deep(video),
.qr-session__reader :deep(.aqr-video) {
  width: 100% !important;
  height: 100% !important;
  max-height: 100%;
  object-fit: cover !important;
  border-radius: 0;
}

.qr-session__reader :deep(.aqr-h5),
.qr-session__reader :deep(#reader),
.qr-session__reader :deep([id^='aqr-h5']) {
  width: 100% !important;
  max-width: 100% !important;
  border: none !important;
}

.qr-session__reader :deep(img) {
  display: none !important;
}

.qr-session__frame {
  pointer-events: none;
  position: absolute;
  width: min(72vw, 300px);
  aspect-ratio: 1;
  max-width: 78%;
  transition: box-shadow 160ms ease, transform 160ms ease;
}

.qr-session__frame--lock {
  box-shadow: 0 0 0 2px rgba(255, 94, 0, 0.55);
  transform: scale(1.02);
}

.qr-session__frame--ok {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.75), 0 0 28px rgba(16, 185, 129, 0.35);
}

.qr-session__frame--err {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.7);
}

.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 3px solid #ff5e00;
}
.corner.tl { top: 0; left: 0; border-right: 0; border-bottom: 0; border-radius: 8px 0 0 0; }
.corner.tr { top: 0; right: 0; border-left: 0; border-bottom: 0; border-radius: 0 8px 0 0; }
.corner.bl { bottom: 0; left: 0; border-right: 0; border-top: 0; border-radius: 0 0 0 8px; }
.corner.br { bottom: 0; right: 0; border-left: 0; border-top: 0; border-radius: 0 0 8px 0; }

.scan-beam {
  position: absolute;
  left: 8%;
  right: 8%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff5e00, transparent);
  box-shadow: 0 0 12px rgba(255, 94, 0, 0.85);
  animation: beam 1.55s ease-in-out infinite;
}

@keyframes beam {
  0% { top: 12%; opacity: 0.35; }
  50% { top: 78%; opacity: 1; }
  100% { top: 12%; opacity: 0.35; }
}

.qr-session__hint {
  position: absolute;
  bottom: 36px;
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0,0,0,.55);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,.85);
  z-index: 2;
  text-align: center;
  max-width: 90%;
}

.qr-session__status {
  position: absolute;
  bottom: 10px;
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 94, 0, 0.9);
  z-index: 2;
}

.qr-session__feed {
  padding: 10px 14px max(14px, env(safe-area-inset-bottom));
  background: linear-gradient(0deg, #0a0a0a, #111);
  border-top: 1px solid rgba(255,255,255,.08);
  min-height: 92px;
}

.qr-flash {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 0.9rem;
}
.qr-flash--ok { background: rgba(16,185,129,.18); border: 1px solid rgba(16,185,129,.45); }
.qr-flash--warn { background: rgba(251,191,36,.15); border: 1px solid rgba(251,191,36,.4); }
.qr-flash--err { background: rgba(239,68,68,.16); border: 1px solid rgba(239,68,68,.4); }

.qr-recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow: auto;
}
.qr-recent li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  font-size: 0.78rem;
  color: rgba(255,255,255,.75);
}
.qr-recent .plate { color: #ff5e00; font-weight: 800; }
.qr-recent .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qr-recent .when { color: rgba(255,255,255,.45); }

.qr-confirm {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(0,0,0,.62);
  display: grid;
  place-items: end center;
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.qr-confirm__card {
  width: min(100%, 420px);
  background: #141414;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 20px;
  padding: 1.15rem 1.2rem 1.1rem;
  text-align: center;
}

.qr-confirm__kicker {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,.5);
  font-weight: 700;
}

.qr-confirm__plate {
  margin-top: 0.35rem;
  font-size: clamp(2.4rem, 10vw, 3.2rem);
  font-weight: 900;
  color: #ff5e00;
  line-height: 1;
}

.qr-confirm__card h3 {
  margin: 0.35rem 0 0.15rem;
  font-size: 1.1rem;
}

.qr-confirm__cat {
  margin: 0 0 1rem;
  color: rgba(255,255,255,.55);
  font-size: 0.85rem;
}

.qr-confirm__actions {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 8px;
}

.btn-ghost, .btn-ok {
  border-radius: 12px;
  padding: 14px 12px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  border: none;
}

.btn-ghost {
  background: rgba(255,255,255,.08);
  color: #fff;
  border: 1px solid rgba(255,255,255,.15);
}

.btn-ok {
  background: #ff5e00;
  color: #fff;
}

.btn-ghost:disabled, .btn-ok:disabled { opacity: 0.55; cursor: wait; }

@media (max-width: 480px) {
  .qr-session__titles p { font-size: 0.74rem; }
  .qr-session__frame { width: min(78vw, 280px); }
  .qr-session__exit { padding: 12px 14px; min-height: 44px; }
  .btn-ghost, .btn-ok { min-height: 48px; }
}

@media (max-height: 640px) {
  .qr-session__feed { min-height: 72px; }
  .qr-recent { max-height: 72px; }
  .qr-session__hint { bottom: 28px; font-size: 0.7rem; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .qr-session__frame { width: min(56vw, 340px); }
}

@media (min-width: 900px) {
  .qr-session__stage { padding: 0; }
  .qr-confirm { place-items: center; }
}
</style>
