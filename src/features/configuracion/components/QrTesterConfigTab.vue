<template>
  <div class="media-tab">
    <header class="page-head">
      <div>
        <h2>Probar QR</h2>
        <p>
          Escaneá un sticker o pegá el texto del QR. El backend dice si ya tiene
          competidor o si falta asociar la placa.
        </p>
      </div>
      <AppButton @click="qrOpen = true">
        <span class="material-icons">qr_code_scanner</span>
        Abrir cámara
      </AppButton>
    </header>

    <section class="manual-card">
      <label class="manual-label" for="qr-paste">Pegar payload del QR</label>
      <div class="manual-row">
        <AppInput
          id="qr-paste"
          v-model="manualRaw"
          placeholder="CXR4.1.42.abc… o URL con ?d=…"
          icon="content_paste"
          aria-label="Pegar texto del QR"
          @keyup.enter="resolveManual"
        />
        <AppButton :loading="manualBusy" :disabled="!manualRaw.trim() || manualBusy" @click="resolveManual">
          Resolver
        </AppButton>
      </div>
      <p v-if="normalizedHint" class="hint">Normalizado: <code>{{ normalizedHint }}</code></p>
    </section>

    <section v-if="result" class="result-card" :class="resultClass">
      <div class="result-kicker">
        <span class="material-icons">{{ resultIcon }}</span>
        <span>{{ resultTitle }}</span>
      </div>

      <template v-if="result.ok && result.assigned && result.rider">
        <div class="rider-block">
          <img
            v-if="riderPhoto"
            :src="riderPhoto"
            :alt="result.rider.full_name"
            class="rider-photo"
          />
          <div v-else class="rider-photo rider-photo--empty">
            <span class="material-icons">person</span>
          </div>
          <div class="rider-meta">
            <p class="plate">#{{ result.plate_number ?? result.rider.plate_number }}</p>
            <h2>{{ result.rider.full_name }}</h2>
            <p class="muted">{{ result.rider.category_name || result.rider.category?.name || 'Sin categoría' }}</p>
            <p v-if="result.rider.race_status || result.rider.status" class="status-pill">
              {{ result.rider.race_status || result.rider.status }}
            </p>
          </div>
        </div>
      </template>

      <template v-else-if="result.ok && !result.assigned">
        <p class="plate big">#{{ result.plate_number ?? '?' }}</p>
        <h2>Falta asociar</h2>
        <p class="muted">
          {{ result.message || 'QR válido, pero ninguna ficha tiene esta placa asignada.' }}
        </p>
        <p class="hint">Asigná la placa en Competidores o Entrega de placas y volvé a escanear.</p>
      </template>

      <template v-else>
        <h2>QR no válido</h2>
        <p class="muted">{{ result.message || 'No se pudo resolver este código.' }}</p>
      </template>
    </section>

    <section v-else class="empty-card">
      <span class="material-icons">qr_code_2</span>
      <p>Todavía no hay lecturas. Abrí la cámara o pegá un payload.</p>
    </section>

    <section v-if="history.length" class="history">
      <h3>Últimos escaneos</h3>
      <ul>
        <li v-for="(item, i) in history" :key="`${item.at}-${i}`" :class="`hist--${item.kind}`">
          <span class="hist-plate">#{{ item.plate }}</span>
          <span class="hist-name">{{ item.label }}</span>
          <span class="hist-when">{{ item.when }}</span>
        </li>
      </ul>
    </section>

    <ContinuousQrScanner
      :open="qrOpen"
      mode="auto"
      role-label="PRUEBA"
      title="Reconocer QR"
      subtitle="Solo consulta: no registra paso ni largada. Te dice el competidor o si falta asociar."
      :on-commit="commitProbe"
      :on-resolve="applyResult"
      @close="qrOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import ContinuousQrScanner from '../../../components/qr/ContinuousQrScanner.vue';
import { resolvePlateQr } from '../../../core/qr/plateQrApi.js';
import { normalizePlateQrPayload } from '../../../core/qr/plateQrNormalize.js';
import { storageUrl } from '../../../core/network/storageUrl.js';

const qrOpen = ref(false);
const manualRaw = ref('');
const manualBusy = ref(false);
const result = ref(null);
const history = ref([]);

const normalizedHint = computed(() => {
  const n = normalizePlateQrPayload(manualRaw.value);
  return n && n !== manualRaw.value.trim() ? n : '';
});

const resultClass = computed(() => {
  if (!result.value) return '';
  if (!result.value.ok) return 'result-card--err';
  if (!result.value.assigned) return 'result-card--warn';
  return 'result-card--ok';
});

const resultIcon = computed(() => {
  if (!result.value?.ok) return 'error';
  if (!result.value.assigned) return 'link_off';
  return 'verified';
});

const resultTitle = computed(() => {
  if (!result.value?.ok) return 'Inválido';
  if (!result.value.assigned) return 'Sin asociar';
  return 'Competidor encontrado';
});

const riderPhoto = computed(() => {
  const r = result.value?.rider;
  if (!r) return '';
  return storageUrl(r.photo_url || r.photo || r.avatar || '');
});

function applyResult(resolved) {
  if (!resolved) return;
  result.value = resolved;

  const plate = resolved.plate_number ?? resolved.rider?.plate_number ?? '?';
  let kind = 'err';
  let label = resolved.message || 'QR inválido';

  if (resolved.ok && resolved.assigned && resolved.rider) {
    kind = 'ok';
    label = resolved.rider.full_name || 'Competidor';
  } else if (resolved.ok && !resolved.assigned) {
    kind = 'warn';
    label = resolved.message || 'Falta asociar';
  }

  const now = new Date();
  history.value = [
    {
      plate,
      label,
      kind,
      at: now.getTime(),
      when: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    ...history.value,
  ].slice(0, 12);
}

async function resolveManual() {
  const raw = manualRaw.value.trim();
  if (!raw || manualBusy.value) return;
  manualBusy.value = true;
  try {
    const resolved = await resolvePlateQr(raw);
    applyResult(resolved);
  } finally {
    manualBusy.value = false;
  }
}

/** Modo sonda: no escribe en carrera, solo confirma lectura. */
async function commitProbe() {
  return { ok: true };
}
</script>

<style scoped>
.media-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
  box-sizing: border-box;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-head h2 {
  margin: 0 0 6px;
  font-family: var(--font-headings);
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.page-head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.4;
  max-width: 42ch;
}

.manual-card,
.result-card,
.empty-card,
.history {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
}

.manual-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.manual-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.manual-row :deep(.app-input),
.manual-row :deep(.input-wrapper) {
  flex: 1;
}

.hint {
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.hint code {
  font-size: 0.75rem;
  word-break: break-all;
}

.result-card--ok {
  border-color: rgba(16, 185, 129, 0.45);
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.12);
}

.result-card--warn {
  border-color: rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.12);
}

.result-card--err {
  border-color: rgba(239, 68, 68, 0.45);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.12);
}

.result-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.result-card--ok .result-kicker { color: var(--color-success); }
.result-card--warn .result-kicker { color: var(--color-secondary); }
.result-card--err .result-kicker { color: var(--color-error); }

.rider-block {
  display: flex;
  gap: 14px;
  align-items: center;
}

.rider-photo {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--color-input-bg);
  flex-shrink: 0;
}

.rider-photo--empty {
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
}

.rider-meta h2,
.result-card > h2 {
  margin: 0 0 4px;
  font-family: var(--font-headings);
  font-size: 1.35rem;
  color: var(--color-text-primary);
}

.plate {
  margin: 0 0 4px;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.plate.big {
  font-size: 2rem;
  margin-bottom: 8px;
}

.muted {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.status-pill {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  color: var(--color-text-secondary);
  padding: 28px 16px;
}

.empty-card .material-icons {
  font-size: 40px;
  opacity: 0.55;
}

.history h3 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.history ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history li {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
  font-size: 0.9rem;
}

.hist-plate {
  font-weight: 800;
  color: var(--color-primary);
}

.hist-name {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hist-when {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.hist--ok .hist-name { color: var(--color-success); }
.hist--warn .hist-name { color: var(--color-secondary); }
.hist--err .hist-name { color: var(--color-error); }

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
  }

  .manual-row {
    flex-direction: column;
  }
}
</style>
