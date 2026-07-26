<template>
  <div class="share-wrap" ref="wrapRef">
    <button
      type="button"
      class="share-trigger"
      :class="{ 'is-sent': sent }"
      :aria-label="ariaLabel"
      :title="sent ? `${ariaLabel} (ya enviado)` : ariaLabel"
      :disabled="loading"
      @click.stop="toggle"
    >
      <span class="material-icons">{{ triggerIcon }}</span>
      <span v-if="sent" class="share-trigger__dot" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="share-pop"
        :style="popStyle"
        role="dialog"
        aria-label="Compartir enlace"
        @click.stop
      >
        <p class="share-pop__label">{{ title }}</p>
        <div class="share-pop__actions">
          <button
            type="button"
            class="share-pop__btn"
            :disabled="!payload?.url || loading"
            title="Copiar enlace"
            @click="copy"
          >
            <span class="material-icons">content_copy</span>
            <span>Copiar</span>
          </button>
          <button
            type="button"
            class="share-pop__btn share-pop__btn--wa"
            :disabled="(!payload?.whatsapp_url && !payload?.whatsapp_phone) || loading"
            title="Enviar por WhatsApp"
            @click="whatsapp"
          >
            <span class="material-icons">chat</span>
            <span>WhatsApp</span>
          </button>
        </div>
        <p v-if="hint" class="share-pop__hint">{{ hint }}</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  /** async () => ({ url, whatsapp_url }) */
  loadLink: { type: Function, required: true },
  title: { type: String, default: 'Compartir enlace' },
  ariaLabel: { type: String, default: 'Compartir enlace' },
  triggerIcon: { type: String, default: 'link' },
  /** Ya se compartió al menos una vez (solo visual; no bloquea reenvío). */
  sent: { type: Boolean, default: false },
});

const emit = defineEmits(['copied', 'sent', 'error']);

const wrapRef = ref(null);
const open = ref(false);
const loading = ref(false);
const payload = ref(null);
const hint = ref('');
const anchor = ref({ top: 0, left: 0 });

const popStyle = computed(() => ({
  top: `${anchor.value.top}px`,
  left: `${anchor.value.left}px`,
}));

function place() {
  const el = wrapRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const popW = 220;
  let left = r.right - popW;
  if (left < 8) left = 8;
  if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
  let top = r.bottom + 8;
  if (top + 120 > window.innerHeight) top = Math.max(8, r.top - 128);
  anchor.value = { top, left };
}

async function ensureLoaded(force = false) {
  if (!force && payload.value?.url && payload.value?.whatsapp_text) {
    return payload.value;
  }
  loading.value = true;
  hint.value = '';
  try {
    const data = await props.loadLink();
    payload.value = {
      url: data?.url || null,
      whatsapp_url: data?.whatsapp_url || null,
      whatsapp_text: data?.whatsapp_text || null,
      whatsapp_phone: data?.whatsapp_phone || null,
    };
    if (!payload.value.url) {
      hint.value = 'No se pudo generar el enlace.';
    } else if (!payload.value.whatsapp_url && !payload.value.whatsapp_phone) {
      hint.value = 'Sin teléfono: solo puedes copiar.';
    }
    return payload.value;
  } catch (e) {
    hint.value = e.friendlyMessage || e.message || 'Error al generar enlace.';
    emit('error', e);
    return null;
  } finally {
    loading.value = false;
  }
}

async function toggle() {
  if (open.value) {
    open.value = false;
    return;
  }
  place();
  open.value = true;
  await ensureLoaded();
  place();
}

async function copy() {
  const data = await ensureLoaded();
  if (!data?.url) return;
  try {
    await navigator.clipboard.writeText(data.url);
    hint.value = 'Enlace copiado';
    emit('copied', data.url);
    emit('sent', { via: 'copy', url: data.url });
  } catch {
    hint.value = data.url;
  }
}

async function whatsapp() {
  const data = await ensureLoaded(true);
  const phone = data?.whatsapp_phone;
  const text = data?.whatsapp_text;
  const openUrl = data?.whatsapp_url;

  if (!openUrl && !phone) {
    hint.value = 'Falta teléfono para WhatsApp.';
    return;
  }

  // Desktop: copiar mensaje y abrir chat (el texto en la URL a veces se corta).
  if (text) {
    try {
      await navigator.clipboard.writeText(text);
      hint.value = 'Mensaje copiado. Pégalo en el chat (Ctrl+V).';
    } catch {
      hint.value = 'Abriendo WhatsApp… si falta el texto, usa Copiar.';
    }
  }

  window.open(openUrl || `https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  emit('sent', { via: 'whatsapp', url: data?.url || null });
  setTimeout(() => {
    open.value = false;
  }, 2500);
}

function onDocClick(e) {
  if (!open.value) return;
  const wrap = wrapRef.value;
  if (wrap && wrap.contains(e.target)) return;
  if (e.target?.closest?.('.share-pop')) return;
  open.value = false;
}

function onKey(e) {
  if (e.key === 'Escape') open.value = false;
}

onMounted(() => {
  document.addEventListener('click', onDocClick);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', place);
  window.removeEventListener('scroll', place, true);
});
</script>

<style scoped>
.share-wrap {
  position: relative;
  display: inline-flex;
}

.share-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--color-border, #333);
  background: var(--color-input-bg, var(--color-surface, transparent));
  color: var(--color-text-primary, #eee);
  cursor: pointer;
}

.share-trigger.is-sent {
  border-color: rgba(34, 160, 90, 0.55);
  color: #1b8a45;
}

.share-trigger__dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22a05a;
  box-shadow: 0 0 0 2px var(--color-surface, #141414);
}

.share-trigger:disabled {
  opacity: 0.5;
  cursor: wait;
}

.share-trigger .material-icons {
  font-size: 18px;
}

.share-pop {
  position: fixed;
  z-index: 1200;
  width: 220px;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--color-border, #333);
  background: var(--color-surface, #141414);
  color: var(--color-text-primary, #f5f5f5);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.share-pop__label {
  margin: 0 0 0.55rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #999);
}

.share-pop__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.share-pop__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0.35rem;
  border-radius: 10px;
  border: 1px solid var(--color-border, #333);
  background: var(--color-input-bg, var(--color-surface, #1a1a1a));
  color: var(--color-text-primary, #eee);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.share-pop__btn .material-icons {
  font-size: 20px;
}

.share-pop__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.share-pop__btn--wa {
  border-color: rgba(37, 211, 102, 0.45);
  color: #1faa55;
}

.share-pop__hint {
  margin: 0.55rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-text-secondary, #999);
  word-break: break-all;
}
</style>
