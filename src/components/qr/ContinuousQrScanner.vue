<template>
  <Teleport to="body">
    <div v-if="open" class="qr-session" role="dialog" aria-modal="true">
      <header class="qr-session__top">
        <div class="qr-session__titles">
          <span class="qr-session__badge">{{ roleLabel }}</span>
          <h2>{{ title }}</h2>
          <p>{{ subtitle }}</p>
        </div>
        <button type="button" class="qr-session__exit" @click="exit">
          <span class="material-icons">close</span>
          <span>Salir</span>
        </button>
      </header>

      <div class="qr-session__stage">
        <div :id="readerId" class="qr-session__reader"></div>
        <div class="qr-session__frame" aria-hidden="true">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
        </div>
        <p class="qr-session__hint">{{ hintText }}</p>
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

      <!-- Confirmación solo Partida / Meta -->
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
import { Html5Qrcode } from 'html5-qrcode';
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

const readerId = `qr-reader-${Math.random().toString(36).slice(2, 9)}`;
const flash = ref(null);
const recent = ref([]);
const pendingConfirm = ref(null);
const busy = ref(false);
const hintText = computed(() =>
  props.mode === 'confirm'
    ? 'Escaneá → confirmar → seguí con el siguiente'
    : 'Escaneo continuo · se registra al instante',
);

let scanner = null;
let cooldownUntil = 0;
let lastPayload = '';
let flashTimer = null;
let paused = false;

function beep(ok = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = ok ? 880 : 220;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.08 : 0.16));
  } catch { /* ignore */ }
}

function showFlash(type, title, detail) {
  flash.value = { type, title, detail };
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash.value = null; }, 1600);
}

function pushRecent(rider) {
  recent.value = [
    {
      plate: rider.plate_number,
      name: rider.full_name,
      when: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    ...recent.value,
  ].slice(0, 8);
}

async function pauseCamera() {
  paused = true;
  try { await scanner?.pause?.(true); } catch { /* ignore */ }
}

async function resumeCamera() {
  paused = false;
  try { await scanner?.resume?.(); } catch { /* ignore */ }
}

async function handleDecoded(raw) {
  if (!props.open || busy.value || paused) return;
  const now = Date.now();
  if (now < cooldownUntil) return;
  if (raw === lastPayload && now - cooldownUntil < 4000) return;

  busy.value = true;
  try {
    const rider = await resolvePlateQr(raw);
    if (!rider) {
      beep(false);
      showFlash('err', 'QR inválido', 'No pertenece a esta edición');
      cooldownUntil = Date.now() + 1200;
      return;
    }

    lastPayload = raw;

    if (props.mode === 'confirm') {
      beep(true);
      pendingConfirm.value = rider;
      await pauseCamera();
      return;
    }

    // Modo automático (Intermedio)
    const result = await props.onCommit(rider);
    cooldownUntil = Date.now() + 2200;
    if (result?.already) {
      beep(false);
      showFlash('warn', `#${rider.plate_number}`, result.message || 'Ya estaba marcado');
    } else if (result?.ok) {
      beep(true);
      showFlash('ok', `#${rider.plate_number}`, rider.full_name);
      pushRecent(rider);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
    } else {
      beep(false);
      showFlash('err', `#${rider.plate_number}`, result?.message || 'No se pudo registrar');
    }
  } catch (e) {
    beep(false);
    showFlash('err', 'Error', e.friendlyMessage || e.message || 'Fallo al leer QR');
    cooldownUntil = Date.now() + 1500;
  } finally {
    busy.value = false;
  }
}

async function acceptConfirm() {
  if (!pendingConfirm.value || busy.value) return;
  busy.value = true;
  try {
    const rider = pendingConfirm.value;
    const result = await props.onCommit(rider);
    pendingConfirm.value = null;
    cooldownUntil = Date.now() + 1800;
    if (result?.already) {
      showFlash('warn', `#${rider.plate_number}`, result.message || 'Ya estaba');
    } else if (result?.ok) {
      showFlash('ok', `#${rider.plate_number}`, rider.full_name);
      pushRecent(rider);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    } else {
      showFlash('err', `#${rider.plate_number}`, result?.message || 'No se pudo guardar');
    }
  } finally {
    busy.value = false;
    await resumeCamera();
  }
}

async function cancelConfirm() {
  pendingConfirm.value = null;
  cooldownUntil = Date.now() + 800;
  await resumeCamera();
}

async function startScanner() {
  await nextTick();
  await stopScanner();
  scanner = new Html5Qrcode(readerId, { verbose: false });
  const cameras = await Html5Qrcode.getCameras().catch(() => []);
  const back = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[0];
  const config = {
    fps: 12,
    qrbox: (viewW, viewH) => {
      const side = Math.floor(Math.min(viewW, viewH) * 0.72);
      return { width: side, height: side };
    },
    aspectRatio: 1,
    disableFlip: false,
  };
  const camIdOrConfig = back?.id || { facingMode: 'environment' };
  await scanner.start(
    camIdOrConfig,
    config,
    (text) => { handleDecoded(text); },
    () => {},
  );
}

async function stopScanner() {
  if (!scanner) return;
  try {
    const state = scanner.getState?.();
    // 2 = SCANNING, 3 = PAUSED in html5-qrcode
    if (state === 2 || state === 3) await scanner.stop();
    await scanner.clear();
  } catch { /* ignore */ }
  scanner = null;
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
      lastPayload = '';
      try {
        await startScanner();
      } catch (e) {
        showFlash('err', 'Cámara', e?.message || 'No se pudo abrir la cámara');
      }
    } else {
      document.body.style.overflow = '';
      await stopScanner();
    }
  },
);

onBeforeUnmount(async () => {
  document.body.style.overflow = '';
  if (flashTimer) clearTimeout(flashTimer);
  await stopScanner();
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

.qr-session__exit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.08);
  color: #fff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  flex-shrink: 0;
}

.qr-session__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-session__reader {
  width: min(100%, 560px);
  max-height: 100%;
}

.qr-session__reader :deep(video) {
  object-fit: cover !important;
  border-radius: 16px;
}

.qr-session__frame {
  pointer-events: none;
  position: absolute;
  width: min(72vw, 280px);
  aspect-ratio: 1;
  max-width: 72%;
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

.qr-session__hint {
  position: absolute;
  bottom: 10px;
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0,0,0,.55);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,.85);
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
  .qr-session__frame { width: min(78vw, 260px); }
  .qr-session__exit { padding: 12px 14px; min-height: 44px; }
  .btn-ghost, .btn-ok { min-height: 48px; }
}

@media (max-height: 640px) {
  .qr-session__feed { min-height: 72px; }
  .qr-recent { max-height: 72px; }
  .qr-session__hint { bottom: 6px; font-size: 0.7rem; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .qr-session__reader { width: min(100%, 640px); }
  .qr-session__frame { width: min(56vw, 320px); }
}

@media (min-width: 900px) {
  .qr-session__stage { padding: 12px 0; }
  .qr-confirm { place-items: center; }
}
</style>
