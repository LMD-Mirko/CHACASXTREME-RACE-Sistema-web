<template>
  <Teleport to="body">
    <Transition name="staff-chat-sheet">
      <div
        v-if="panelOpen"
        class="staff-chat-backdrop"
        @click.self="closePanel"
      >
        <section
          class="staff-chat-panel"
          role="dialog"
          aria-label="Chat staff en caliente"
          @click.stop
        >
          <header class="staff-chat-panel__head">
            <div>
              <h2>Chat en caliente</h2>
              <p>Staff · sincronizado por WebSocket</p>
            </div>
            <button type="button" class="icon-btn" aria-label="Cerrar" @click="closePanel">
              <span class="material-icons">close</span>
            </button>
          </header>

          <div ref="listRef" class="staff-chat-panel__list" aria-live="polite">
            <p v-if="loadingHistory" class="muted">Cargando mensajes…</p>
            <p v-else-if="!messages.length" class="muted">
              Aún no hay mensajes. Escribe para avisar a Partida, Intermedio o Meta.
            </p>
            <article
              v-for="msg in messages"
              :key="msg.id"
              class="bubble"
              :class="{ mine: isMine(msg) }"
            >
              <div class="bubble__meta">
                <span class="bubble__name">{{ msg.user?.name || 'Staff' }}</span>
                <span class="bubble__role">{{ msg.user?.role || '' }}</span>
                <span class="bubble__time">{{ formatTime(msg.created_at) }}</span>
              </div>
              <p class="bubble__body">{{ msg.body }}</p>
            </article>
          </div>

          <form class="staff-chat-panel__composer" @submit.prevent="onSubmit">
            <p v-if="error" class="form-error">{{ error }}</p>
            <div class="composer-row">
              <input
                v-model="draft"
                type="text"
                maxlength="500"
                placeholder="Mensaje al staff…"
                enterkeyhint="send"
                autocomplete="off"
                :disabled="sending"
              />
              <button type="submit" class="send-btn" :disabled="sending || !draft.trim()">
                <span class="material-icons">send</span>
              </button>
            </div>
            <p class="hint">{{ draft.length }}/500 · máx. 1 msg / 2s</p>
          </form>
        </section>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="toast && !panelOpen" class="staff-chat-toast">
        <span class="material-icons">forum</span>
        <span>{{ toast }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { useAuth } from '../../login/hooks/useAuth';
import { useStaffChat } from '../composables/useStaffChat';

const { currentUser } = useAuth();
const {
  messages,
  panelOpen,
  loadingHistory,
  sending,
  error,
  toast,
  closePanel,
  sendMessage,
} = useStaffChat();

const draft = ref('');
const listRef = ref(null);

function isMine(msg) {
  return Number(msg?.user?.id) === Number(currentUser.value?.id);
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

async function scrollBottom() {
  await nextTick();
  const el = listRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

watch(
  () => [panelOpen.value, messages.value.length],
  () => {
    if (panelOpen.value) scrollBottom();
  }
);

async function onSubmit() {
  const text = draft.value;
  const msg = await sendMessage(text);
  if (msg) {
    draft.value = '';
    scrollBottom();
  }
}
</script>

<style scoped>
.staff-chat-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.staff-chat-panel {
  width: min(520px, 100%);
  height: min(70vh, 640px);
  max-height: calc(100dvh - 24px);
  background: var(--color-surface, #141414);
  color: var(--color-text-primary, #f5f5f5);
  border: 1px solid var(--color-border, #333);
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.35);
}

@media (min-width: 1024px) {
  .staff-chat-backdrop {
    inset: auto;
    right: 18px;
    bottom: 72px;
    width: 340px;
    height: 420px;
    max-height: calc(100vh - 96px);
    background: transparent;
    pointer-events: none;
    display: block;
  }
  .staff-chat-panel {
    pointer-events: auto;
    width: 100%;
    height: 100%;
    max-height: none;
    border-radius: 14px;
    border: 1px solid var(--color-border, #333);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
  }
  .staff-chat-panel__head {
    padding: 0.7rem 0.8rem 0.55rem;
  }
  .staff-chat-panel__head h2 {
    font-size: 0.95rem;
  }
  .staff-chat-panel__list {
    padding: 0.65rem 0.75rem;
  }
  .bubble__body {
    font-size: 0.85rem;
  }
  .staff-chat-toast {
    bottom: 24px;
    right: 72px;
    left: auto;
    transform: none;
  }
}

.staff-chat-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.95rem 1rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #2a2a2a);
}

.staff-chat-panel__head h2 {
  margin: 0;
  font-size: 1.05rem;
}

.staff-chat-panel__head p {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-secondary, #999);
}

.icon-btn {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary, #999);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.staff-chat-panel__list {
  flex: 1;
  overflow: auto;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  -webkit-overflow-scrolling: touch;
}

.muted {
  margin: auto;
  text-align: center;
  color: var(--color-text-secondary, #999);
  font-size: 0.88rem;
  padding: 1rem;
}

.bubble {
  max-width: 92%;
  align-self: flex-start;
  background: var(--color-input-bg, #1c1c1c);
  border: 1px solid var(--color-border, #2f2f2f);
  border-radius: 12px 12px 12px 4px;
  padding: 0.55rem 0.7rem;
}

.bubble.mine {
  align-self: flex-end;
  border-color: rgba(255, 94, 0, 0.4);
  background: rgba(255, 94, 0, 0.12);
  border-radius: 12px 12px 4px 12px;
}

.bubble__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  align-items: baseline;
  margin-bottom: 0.25rem;
}

.bubble__name {
  font-size: 0.78rem;
  font-weight: 700;
}

.bubble__role {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ff5e00;
}

.bubble__time {
  font-size: 0.68rem;
  color: var(--color-text-secondary, #888);
  margin-left: auto;
}

.bubble__body {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.staff-chat-panel__composer {
  padding: 0.65rem 0.85rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border, #2a2a2a);
  background: var(--color-surface, #141414);
}

.composer-row {
  display: flex;
  gap: 0.45rem;
}

.composer-row input {
  flex: 1;
  border: 1px solid var(--color-border, #333);
  background: var(--color-input-bg, #1a1a1a);
  color: var(--color-text-primary, #eee);
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
}

.send-btn {
  width: 46px;
  border: 0;
  border-radius: 12px;
  background: #ff5e00;
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hint {
  margin: 0.4rem 0 0;
  font-size: 0.7rem;
  color: var(--color-text-secondary, #888);
}

.form-error {
  margin: 0 0 0.4rem;
  color: #ff8a80;
  font-size: 0.8rem;
}

.staff-chat-toast {
  position: fixed;
  left: 50%;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 1000;
  max-width: min(420px, calc(100vw - 24px));
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.94);
  border: 1px solid rgba(255, 94, 0, 0.4);
  color: #f5f5f5;
  font-size: 0.82rem;
  line-height: 1.35;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.staff-chat-toast .material-icons {
  color: #ff5e00;
  font-size: 18px;
  margin-top: 1px;
}

.staff-chat-sheet-enter-active,
.staff-chat-sheet-leave-active {
  transition: opacity 0.18s ease;
}
.staff-chat-sheet-enter-active .staff-chat-panel,
.staff-chat-sheet-leave-active .staff-chat-panel {
  transition: transform 0.2s ease;
}
.staff-chat-sheet-enter-from,
.staff-chat-sheet-leave-to {
  opacity: 0;
}
.staff-chat-sheet-enter-from .staff-chat-panel,
.staff-chat-sheet-leave-to .staff-chat-panel {
  transform: translateY(24px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
