<template>
  <button
    type="button"
    class="staff-chat-fab"
    :class="{
      'staff-chat-fab--hidden': keyboardOpen,
      'staff-chat-fab--open': panelOpen,
    }"
    :aria-label="panelOpen ? 'Cerrar chat staff' : 'Abrir chat staff'"
    :title="panelOpen ? 'Cerrar chat' : 'Chat en caliente'"
    @click="togglePanel"
  >
    <span class="material-icons">{{ panelOpen ? 'close' : 'forum' }}</span>
    <span v-if="hasUnread && !panelOpen" class="staff-chat-fab__badge">
      {{ unread > 9 ? '9+' : unread }}
    </span>
  </button>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useStaffChat } from '../composables/useStaffChat';

const { unread, hasUnread, panelOpen, togglePanel } = useStaffChat();
const keyboardOpen = ref(false);
let initialHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

function onFocusIn(e) {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && !t.closest?.('.staff-chat-panel')) {
    keyboardOpen.value = true;
  }
}

function onFocusOut() {
  setTimeout(() => {
    const active = document.activeElement;
    if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
      keyboardOpen.value = false;
    }
  }, 100);
}

function onResize() {
  if (window.innerHeight < initialHeight - 120) {
    // Si el focus está en el input del chat, no ocultar FAB del flujo del panel
    if (document.activeElement?.closest?.('.staff-chat-panel')) {
      keyboardOpen.value = false;
      return;
    }
    keyboardOpen.value = true;
  } else if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    keyboardOpen.value = false;
  }
}

onMounted(() => {
  initialHeight = window.innerHeight;
  window.addEventListener('focusin', onFocusIn);
  window.addEventListener('focusout', onFocusOut);
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('focusin', onFocusIn);
  window.removeEventListener('focusout', onFocusOut);
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.staff-chat-fab {
  position: fixed;
  right: 16px;
  bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  z-index: 70;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 16px;
  background: #ff5e00;
  color: #fff;
  box-shadow: 0 10px 28px rgba(255, 94, 0, 0.35);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease, bottom 0.18s ease;
}

.staff-chat-fab:active {
  transform: scale(0.96);
}

.staff-chat-fab--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(12px);
}

.staff-chat-fab--open {
  background: #2a2a2a;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.staff-chat-fab .material-icons {
  font-size: 24px;
}

.staff-chat-fab__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #22a05a;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  border: 2px solid var(--color-surface, #0e0e0e);
}

@media (min-width: 1024px) {
  .staff-chat-fab {
    display: none;
  }
}
</style>
